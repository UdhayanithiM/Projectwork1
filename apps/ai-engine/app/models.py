import os
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# --- DB CONFIGURATION ---
# We use the same DATABASE_URL as Next.js
MONGO_URL = os.getenv("DATABASE_URL")
if not MONGO_URL:
    # Fallback for local dev if .env is missing (though it shouldn't be)
    MONGO_URL = "mongodb://localhost:27017/fortitwin"

client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database() # Automatically gets the db name from the URL

# --- DATA MODELS ---

class StartInterviewRequest(BaseModel):
    session_id: str  # This is the MongoDB ID sent by Next.js
    candidate_id: str
    job_title: str
    company: str
    personality: str = "Default Manager"
    rag_query: Optional[str] = None

class StartInterviewResponse(BaseModel):
    session_id: str
    first_question: str
    mode: str = Field(description="llm|offline")

class NextQuestionRequest(BaseModel):
    session_id: str
    candidate_answer: str

class NextQuestionResponse(BaseModel):
    session_id: str
    question: str
    hints: Optional[Dict[str, Any]] = None

class ScoreRequest(BaseModel):
    session_id: str

class ScoreResponse(BaseModel):
    session_id: str
    scores: Dict[str, Any]

class SecurityEvent(BaseModel):
    session_id: str
    event_type: str
    metadata: Dict[str, Any] = {}

class EmotionSignal(BaseModel):
    session_id: str
    signals: Dict[str, float]

# --- MONGODB STORE ---

class MongoSessionStore:
    """
    Interacts directly with the 'Assessment' collection in MongoDB.
    It maps Python's 'Session' concept to the Prisma 'Assessment' schema.
    """
    
    async def init_session(self, session_id: str, candidate_id: str, job_title: str, company: str, personality: str, rag_context: str, mode: str):
        """
        Updates the existing Assessment record created by Next.js with AI-specific context.
        """
        # We verify the ID is a valid ObjectId
        if not ObjectId.is_valid(session_id):
             raise ValueError(f"Invalid MongoDB ID: {session_id}")

        # Note: Next.js has already created the record. We just add our context fields.
        # If your Prisma schema doesn't have these fields, we store them in a generic 'aiContext' or similar if available.
        # For now, we will assume we can store a 'transcript' array or generic JSON.
        
        update_data = {
            "status": "IN_PROGRESS",
            "updatedAt": datetime.utcnow(),
            # We store AI metadata in a 'metadata' field or we can just manage transcript in memory for the request scope
            # But to persist, we will write to a custom field.
            # STRATEGY: We will use a flexible collection 'InterviewSessions' linked by assessmentId 
            # to avoid breaking strict Prisma schemas if they aren't updated yet.
        }

        # For robust persistence without changing Prisma Schema immediately, 
        # let's use a dedicated collection 'ai_sessions' for the python logic.
        await db.ai_sessions.update_one(
            {"assessment_id": session_id},
            {"$set": {
                "candidate_id": candidate_id,
                "job_title": job_title,
                "company": company,
                "personality": personality,
                "rag_context": rag_context,
                "mode": mode,
                "transcript": [],
                "security_events": [],
                "emotion_context": {},
                "started_at": datetime.utcnow()
            }},
            upsert=True
        )
        return session_id

    async def get_session(self, session_id: str):
        doc = await db.ai_sessions.find_one({"assessment_id": session_id})
        if not doc:
            raise KeyError(f"Session {session_id} not found in ai_sessions")
        return doc

    async def add_transcript(self, session_id: str, role: str, text: str):
        await db.ai_sessions.update_one(
            {"assessment_id": session_id},
            {"$push": {"transcript": {"role": role, "text": text, "timestamp": datetime.utcnow()}}}
        )

    async def update_emotion(self, session_id: str, signals: dict):
        await db.ai_sessions.update_one(
            {"assessment_id": session_id},
            {"$set": {"emotion_context": signals}}
        )

    async def log_security_event(self, session_id: str, event: SecurityEvent):
        await db.ai_sessions.update_one(
            {"assessment_id": session_id},
            {"$push": {"security_events": event.dict()}}
        )

SESSION_STORE = MongoSessionStore()