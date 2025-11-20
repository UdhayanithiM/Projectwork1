import os
import logging
import json
from typing import Dict, Any, Optional, List
import time
import random

from groq import Groq
from .emotion_engine import MockEmotionProvider, HumeEmotionProvider
from .security_events import normalize_event

logger = logging.getLogger("fortitwin")

# -------------------------------------------------------------------
# Personality presets
# -------------------------------------------------------------------
PERSONALITY_PRESETS = {
    "Default Manager": dict(tone="professional", difficulty="medium"),
    "Startup CTO": dict(tone="direct", difficulty="high"),
    "FAANG Manager": dict(tone="structured", difficulty="high"),
    "Finance Recruiter": dict(tone="formal", difficulty="medium"),
}

# -------------------------------------------------------------------
# Interview Engine (Groq + Offline fallback)
# -------------------------------------------------------------------
class InterviewEngine:
    def __init__(self):
        self.emotion = HumeEmotionProvider()
        self.fallback_emotion = MockEmotionProvider()

        key = os.getenv("GROQ_API_KEY")
        if key:
            try:
                self.client = Groq(api_key=key)
                self.mode = "groq"
            except Exception as e:
                logger.error(f"Failed to init Groq client: {e}")
                self.client = None
                self.mode = "offline"
        else:
            logger.warning("GROQ_API_KEY not set, using offline mode.")
            self.client = None
            self.mode = "offline"

        logger.info(f"InterviewEngine initialized in {self.mode} mode.")

    def _llm_call(self, system: str, user: str) -> str:
        if self.mode == "groq" and self.client:
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    # ✅ FIX: Updated to latest stable model to avoid decommissioned error
                    model="llama-3.1-8b-instant",
                )
                return chat_completion.choices[0].message.content or ""
            except Exception as e:
                logger.error(f"Groq call failed: {e}")
                return ""
        return ""  # offline fallback trigger

    def first_question(self, job_title: str, company: str, personality: str, rag_context: str) -> str:
        return self._generate_question(
            job_title, company, personality, rag_context,
            prev_answer=None,
            emotion_ctx=self._emotion_ctx("seed"),
            security_hint=None,
        )

    def next_question(
        self,
        job_title: str,
        company: str,
        personality: str,
        rag_context: str,
        prev_answer: str,
        emotion_ctx: Dict[str, float],
        security_hint: Optional[str]
    ) -> str:
        return self._generate_question(job_title, company, personality, rag_context, prev_answer, emotion_ctx, security_hint)

    def _emotion_ctx(self, session_id: str) -> Dict[str, float]:
        sig = self.emotion.get_signals(session_id)
        if not sig:
            sig = self.fallback_emotion.get_signals(session_id)
        return sig

    def _persona(self, personality: str) -> Dict[str, str]:
        return PERSONALITY_PRESETS.get(personality, PERSONALITY_PRESETS["Default Manager"])

    def _offline_question(
        self,
        job_title: str,
        persona: Dict[str, str],
        rag_context: str,
        prev_answer: Optional[str],
        emotion_ctx: Dict[str, float],
        security_hint: Optional[str],
    ) -> str:
        base = f"As a {persona['tone']} interviewer for a {job_title}, "
        if security_hint:
            base += f"I noticed a potential distraction ({security_hint}). Please stay focused. "
        if emotion_ctx.get("nervous", 0) > 0.5:
            base += "I'll keep it supportive. "
        if prev_answer:
            return base + "Can you dive deeper into your last answer and describe a concrete example with outcomes?"
        if rag_context:
            return base + "What experience do you have that directly matches this role? Refer to relevant projects."
        return base + "Tell me about a challenging project you led end-to-end."

    def _generate_question(
        self,
        job_title: str,
        company: str,
        personality: str,
        rag_context: str,
        prev_answer: Optional[str],
        emotion_ctx: Dict[str, float],
        security_hint: Optional[str],
    ) -> str:
        persona = self._persona(personality)

        # New, more detailed system prompt
        system = (
            "You are an empathetic, professional AI interviewer. Your goal is to conduct a natural, human-like interview. "
            "1. **Be Conversational**: Do not use repetitive phrases like 'Okay, I get it.' Vary your responses. "
            "2. **Acknowledge and Validate**: Briefly acknowledge the candidate's previous answer to show you are listening. "
            "3. **Ask Relevant Questions**: Your next question must be a logical follow-up to the candidate's last statement. "
            "4. **Be Concise**: Ask only ONE concise question at a time. "
            "5. **Adapt**: Adjust your tone and difficulty based on the personality and emotion signals provided."
        )

        user_parts: List[str] = [
            f"Job Title: {job_title} at {company}.",
            f"Your Interviewer Personality: Tone should be {persona['tone']}, difficulty should be {persona['difficulty']}.",
        ]
        if rag_context:
            user_parts.append(f"Company/Role Context:\n{rag_context[:2000]}")
        if prev_answer:
            user_parts.append(f"This was the candidate's previous answer:\n'{prev_answer}'")
        if emotion_ctx:
            user_parts.append(f"Emotion signals from the candidate's voice: {emotion_ctx}")
        if security_hint:
            user_parts.append(f"Security hint: {security_hint}")
        
        user_parts.append("Based on the previous answer, acknowledge it and ask ONE specific, relevant follow-up question.")
        prompt = "\n\n".join(user_parts)

        out = self._llm_call(system, prompt)
        if out:
            return out

        return self._offline_question(job_title, persona, rag_context, prev_answer, emotion_ctx, security_hint)

    def score(self, transcript: List[Dict[str, str]], job_title: str, company: str) -> Dict[str, Any]:
        system = (
            "You are a fair, unbiased evaluator. Your response must be a single JSON object and nothing else. "
            "Do not include any text before or after the JSON. Your response must start with `{` and end with `}`."
        )
        
        # ✅ FIX: Added default=str to handle datetime objects from MongoDB
        user = f"""Evaluate this interview for a {job_title} at {company}.
Transcript:
{json.dumps(transcript, indent=2, default=str)}

Return a single JSON object with the following fields: "Role Fit" (0-10), "Culture Fit" (0-10), "Honesty" (0-10), "Communication" (0-10), and "Notes" (a string with your summary)."""

        raw = self._llm_call(system, user)
        if raw:
            try:
                return json.loads(raw)
            except Exception as e:
                logger.warning(f"Score JSON parse failed: {e}")

        # Offline fallback
        return {
            "Role Fit": 7,
            "Culture Fit": 7,
            "Honesty": 7,
            "Communication": 7,
            "Notes": "Baseline offline scoring. Provide GROQ_API_KEY for smarter evaluation."
        }

    @staticmethod
    def security_hint_from_event(event_type: str, metadata: dict) -> str:
        impact = normalize_event(event_type, metadata)
        if impact > 0.75:
            return f"{event_type} (high impact)"
        if impact > 0.45:
            return f"{event_type} (moderate impact)"
        return f"{event_type} (low impact)"