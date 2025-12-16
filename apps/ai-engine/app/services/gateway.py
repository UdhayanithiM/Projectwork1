import logging
import random
import time
from typing import List, Dict, Optional, Literal, Any
import instructor
from pydantic import BaseModel, Field
from groq import AsyncGroq
from openai import AsyncOpenAI
import google.generativeai as genai

from app.core.config import get_settings

logger = logging.getLogger("fortitwin.gateway")
settings = get_settings()

# -------------------------------------------------------------------
# 1. STRUCTURED OUTPUT SCHEMAS (Pydantic)
# -------------------------------------------------------------------
class InterviewTurn(BaseModel):
    """The AI's response for the interview conversation."""
    response_text: str = Field(
        description="The actual spoken response to the candidate. Keep it under 30 words. Conversational and natural."
    )
    hints: List[str] = Field(
        default=[], 
        description="2-3 short hints if the candidate gets stuck. Empty if not needed."
    )
    sentiment_analysis: str = Field(
        description="Brief internal analysis of the candidate's last answer (e.g., 'Confused', 'Confident', 'Vague')."
    )

class AssessmentScore(BaseModel):
    """Final evaluation of the interview."""
    role_fit: int = Field(description="Score 0-10 based on technical skills.")
    culture_fit: int = Field(description="Score 0-10 based on personality.")
    honesty: int = Field(description="Score 0-10 based on consistency.")
    communication: int = Field(description="Score 0-10 based on clarity.")
    feedback_summary: str = Field(description="A concise summary of strengths and areas for improvement.")

# -------------------------------------------------------------------
# 2. THE LLM GATEWAY (ROUTER)
# -------------------------------------------------------------------
class LLMGateway:
    def __init__(self):
        # A. Initialize Groq (Primary for Chat - Fast)
        self.groq_client = None
        if settings.GROQ_API_KEY:
            try:
                # Patching with instructor enables response_model
                self.groq_client = instructor.patch(
                    AsyncGroq(api_key=settings.GROQ_API_KEY)
                )
                logger.info("✅ Groq Client Initialized (Llama 3)")
            except Exception as e:
                logger.error(f"❌ Failed to init Groq: {e}")

        # B. Initialize OpenAI (Secondary - High Logic)
        self.openai_client = None
        if settings.OPENAI_API_KEY:
            try:
                self.openai_client = instructor.patch(
                    AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                )
                logger.info("✅ OpenAI Client Initialized")
            except Exception as e:
                logger.error(f"❌ Failed to init OpenAI: {e}")

        # C. Initialize Gemini (Backup/Vision)
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Instructor support for Gemini is different, handled manually if needed
            logger.info("✅ Gemini Client Initialized")

    async def generate_response(
        self,
        job_title: str,
        company: str,
        history: List[Dict[str, str]],
        context: str = "",
        emotion_data: Dict[str, float] = {},
        security_alert: Optional[str] = None
    ) -> InterviewTurn:
        """
        Generates the next interview question.
        ROUTING STRATEGY: Always try Groq (Llama 3) first for speed.
        """
        
        # 1. Construct System Prompt
        system_prompt = (
            f"You are an interviewer for {company} hiring a {job_title}. "
            "Conduct a professional, oral interview. "
            "RULES:\n"
            "- Responses must be SHORT (under 30 words).\n"
            "- Speak naturally. Do not use bullet points.\n"
            "- If context is provided, use it to ask relevant technical questions.\n"
        )

        # 2. Add Context Signals
        if security_alert:
            system_prompt += f"\n[SYSTEM ALERT]: {security_alert}. Address this subtly."
        
        if emotion_data.get("nervous", 0) > 0.7:
            system_prompt += "\n[EMOTION]: Candidate is nervous. Be reassuring."

        # 3. Construct Messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add RAG context if available
        if context:
            messages.append({"role": "system", "content": f"BACKGROUND KNOWLEDGE:\n{context[:1000]}"})
            
        messages.extend(history)

        # 4. Call LLM (Try Groq First)
        try:
            if self.groq_client:
                return await self.groq_client.chat.completions.create(
                    model="llama-3.3-70b-versatile", # Or llama3-8b-8192 for speed
                    response_model=InterviewTurn,
                    messages=messages,
                    temperature=0.6,
                    max_retries=2
                )
        except Exception as e:
            logger.warning(f"Groq failed, failing over: {e}")

        # 5. Fallback to OpenAI (if Groq fails)
        if self.openai_client:
            return await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo", 
                response_model=InterviewTurn,
                messages=messages,
                temperature=0.7
            )

        # 6. Ultimate Fallback (Offline)
        return InterviewTurn(
            response_text="Could you elaborate on your experience?",
            hints=["Focus on your last role."],
            sentiment_analysis="Fallback"
        )

    async def evaluate_interview(
        self, 
        transcript: List[Dict[str, str]], 
        job_title: str
    ) -> AssessmentScore:
        """
        Scores the interview.
        ROUTING STRATEGY: Use OpenAI (GPT-4) or Gemini Pro for deep analysis.
        """
        prompt = f"Evaluate this interview for the role of {job_title}."
        
        # Convert transcript to string for context
        conversation_text = "\n".join([f"{m['role']}: {m['content']}" for m in transcript])
        
        messages = [
            {"role": "system", "content": "You are an expert HR evaluator. Be strict and fair."},
            {"role": "user", "content": f"{prompt}\n\nTRANSCRIPT:\n{conversation_text}"}
        ]

        # Prefer OpenAI for scoring
        if self.openai_client:
            return await self.openai_client.chat.completions.create(
                model="gpt-4o", # Smartest model for scoring
                response_model=AssessmentScore,
                messages=messages
            )
        
        # Fallback to Groq (Llama 70b is good at reasoning too)
        if self.groq_client:
            return await self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                response_model=AssessmentScore,
                messages=messages
            )

        return AssessmentScore(
            role_fit=5, culture_fit=5, honesty=5, communication=5, 
            feedback_summary="Scoring service unavailable."
        )

# Singleton Instance
gateway = LLMGateway()