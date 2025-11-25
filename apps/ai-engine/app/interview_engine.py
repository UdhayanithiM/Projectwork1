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
                    # Use a fast model for voice latency
                    model="llama-3.1-8b-instant",
                    temperature=0.6, # Slightly lower temperature for more focused answers
                    max_tokens=150,  # Limit output tokens to ensure brevity
                )
                return chat_completion.choices[0].message.content or ""
            except Exception as e:
                logger.error(f"Groq call failed: {e}")
                return ""
        return ""  # offline fallback trigger

    def first_question(self, job_title: str, company: str, personality: str, rag_context: str) -> str:
        # We force the first question to be short so the interview starts immediately
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
        # Fallbacks must also be short for voice
        if security_hint:
            return f"I noticed {security_hint}. Please focus. Let's continue."
        if prev_answer:
            return "Could you give me a specific example of that?"
        return f"Tell me about your experience as a {job_title}."

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

        # 🔥 UPDATED SYSTEM PROMPT: OPTIMIZED FOR VOICE (REAL-TIME)
        # This ensures the AI speaks like a human in a call, not a text bot.
        system = (
            f"You are {persona['tone']} interviewer for {company}. "
            "You are conducting a LIVE VOICE interview. "
            "CRITICAL RULES FOR VOICE:\n"
            "1. **BE CONCISE**: Responses must be under 30 words. Max 2 sentences.\n"
            "2. **NO FLUFF**: Never say 'Thank you', 'Great answer', or 'I see'. It wastes time.\n"
            "3. **KEEP MOVING**: Acknowledge the point implicitly and ask the next question immediately.\n"
            "4. **NATURAL**: Use spoken English rhythm. No lists or bullet points."
        )

        user_parts: List[str] = [
            f"Role: {job_title}.",
        ]
        
        if rag_context:
            # Truncate context to focus LLM
            user_parts.append(f"Context: {rag_context[:500]}...")
            
        if prev_answer:
            user_parts.append(f"Candidate said: '{prev_answer}'")
            
        if emotion_ctx:
            # Only mention emotion if it's extreme, otherwise ignore to save tokens
            if emotion_ctx.get("nervous", 0) > 0.7:
                user_parts.append("(Candidate sounds nervous. Be reassuring but brief.)")
                
        if security_hint:
            user_parts.append(f"System Alert: {security_hint}")
        
        user_parts.append("Ask the next single, short follow-up question.")
        prompt = "\n".join(user_parts)

        out = self._llm_call(system, prompt)
        if out:
            return out

        return self._offline_question(job_title, persona, rag_context, prev_answer, emotion_ctx, security_hint)

    def score(self, transcript: List[Dict[str, str]], job_title: str, company: str) -> Dict[str, Any]:
        system = (
            "You are a fair, unbiased evaluator. Return ONLY a JSON object. "
            "No markdown formatting."
        )
        
        user = f"""Evaluate this interview for a {job_title} at {company}.
Transcript:
{json.dumps(transcript, indent=2, default=str)}

Return JSON with fields: "Role Fit" (0-10), "Culture Fit" (0-10), "Honesty" (0-10), "Communication" (0-10), "Notes" (summary string)."""

        raw = self._llm_call(system, user)
        if raw:
            try:
                # Clean up potential markdown code blocks if the LLM adds them
                clean_raw = raw.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_raw)
            except Exception as e:
                logger.warning(f"Score JSON parse failed: {e}")

        # Offline fallback
        return {
            "Role Fit": 7,
            "Culture Fit": 7,
            "Honesty": 7,
            "Communication": 7,
            "Notes": "Scoring unavailable. Please check API keys."
        }

    @staticmethod
    def security_hint_from_event(event_type: str, metadata: dict) -> str:
        impact = normalize_event(event_type, metadata)
        if impact > 0.75:
            return f"{event_type} (high impact)"
        if impact > 0.45:
            return f"{event_type} (moderate impact)"
        return f"{event_type} (low impact)"