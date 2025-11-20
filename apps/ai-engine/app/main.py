import os
import logging
import asyncio
import websockets
import json
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from starlette.websockets import WebSocketDisconnect

# Import models
from .models import (
    StartInterviewRequest, StartInterviewResponse,
    NextQuestionRequest, NextQuestionResponse,
    ScoreRequest, ScoreResponse,
    SecurityEvent, EmotionSignal,
    SESSION_STORE, 
)
from .interview_engine import InterviewEngine
from .rag import retrieve

# -------------------------------------------------------------------
# Setup
# -------------------------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fortitwin")

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HUME_API_KEY = os.getenv("HUME_API_KEY")

app = FastAPI(
    title="FortiTwin MVP API",
    version="0.4.0",
    description="API backend for adaptive AI-driven interviews (Groq + Hume) - Unified DB."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ENGINE = InterviewEngine()

# -------------------------------------------------------------------
# Routes
# -------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "FortiTwin MVP API is running 🚀 (Groq + Hume)"}

@app.post("/interview/start", response_model=StartInterviewResponse)
async def start_interview(req: StartInterviewRequest):
    logger.info(f"Starting interview session={req.session_id}")
    rag_ctx = retrieve(req.rag_query or "") if req.rag_query else ""
    
    await SESSION_STORE.init_session(
        session_id=req.session_id,
        candidate_id=req.candidate_id,
        job_title=req.job_title,
        company=req.company,
        personality=req.personality,
        rag_context=rag_ctx,
        mode=ENGINE.mode,
    )

    q = ENGINE.first_question(req.job_title, req.company, req.personality, rag_ctx)
    await SESSION_STORE.add_transcript(req.session_id, "interviewer", q)

    return StartInterviewResponse(session_id=req.session_id, first_question=q, mode=ENGINE.mode)

@app.post("/interview/next", response_model=NextQuestionResponse)
async def next_question(req: NextQuestionRequest):
    try:
        sess = await SESSION_STORE.get_session(req.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")

    await SESSION_STORE.add_transcript(req.session_id, "candidate", req.candidate_answer)

    emotion_ctx = sess.get("emotion_context", {"nervous": 0.3, "confident": 0.5})
    security_hint = None 
    if sess.get("security_events"):
        last_event = sess["security_events"][-1]
        security_hint = InterviewEngine.security_hint_from_event(last_event.get("event_type"), last_event.get("metadata", {}))

    q = ENGINE.next_question(
        sess["job_title"], sess["company"], sess["personality"], sess["rag_context"],
        req.candidate_answer, emotion_ctx, security_hint
    )

    await SESSION_STORE.add_transcript(req.session_id, "interviewer", q)

    return NextQuestionResponse(
        session_id=req.session_id, question=q,
        hints={"security_hint": security_hint, "emotion_ctx": emotion_ctx},
    )

@app.post("/interview/score", response_model=ScoreResponse)
async def score(req: ScoreRequest):
    try:
        sess = await SESSION_STORE.get_session(req.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")

    scores = ENGINE.score(sess.get("transcript", []), sess["job_title"], sess["company"])
    return ScoreResponse(session_id=req.session_id, scores=scores)

# -------------------------------------------------------------------
#  VOICE PROXY (HUME AI)
# -------------------------------------------------------------------
@app.websocket("/ws/hume/{session_id}")
async def hume_websocket_proxy(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        sess = await SESSION_STORE.get_session(session_id)
    except KeyError:
        await websocket.close(code=4004, reason="Session not found")
        return

    uri = f"wss://api.hume.ai/v0/evi/chat?api_key={HUME_API_KEY}"
    
    try:
        async with websockets.connect(uri) as hume_socket:
            
            # 1. Configure Hume Session
            config_message = {
                "type": "session_config",
                "models": { "prosody": {}, "language": {} },
                # Increase timeout to avoid cutting off thinking time
                "timeout": 10000 
            }
            await hume_socket.send(json.dumps(config_message))

            # 2. Browser -> Python -> Hume
            async def forward_to_hume():
                try:
                    while True:
                        message = await websocket.receive()
                        
                        # Handle Audio Data (Bytes)
                        if "bytes" in message:
                            await hume_socket.send(message["bytes"])
                        
                        # Handle Control Messages (Text/JSON)
                        elif "text" in message:
                            await hume_socket.send(message["text"])

                except (WebSocketDisconnect, websockets.exceptions.ConnectionClosed):
                    pass

            # 3. Hume -> Python -> Browser
            async def forward_to_client():
                try:
                    while True:
                        data = await hume_socket.recv()

                        # If Binary Audio, just forward it to frontend to play
                        if isinstance(data, bytes):
                            await websocket.send_bytes(data)
                        
                        # If Text, we analyze it for the conversation logic
                        elif isinstance(data, str):
                            response_json = json.loads(data)
                            
                            # Check if user finished speaking
                            if response_json.get("type") == "user_message":
                                user_text = response_json.get("message", {}).get("content")
                                
                                if user_text:
                                    # A. Save User Transcript
                                    await SESSION_STORE.add_transcript(session_id, "candidate", user_text)
                                    
                                    # B. Generate AI Response (LLM)
                                    # We re-fetch session to get fresh context
                                    current_session = await SESSION_STORE.get_session(session_id)
                                    next_q = ENGINE.next_question(
                                        current_session["job_title"], current_session["company"], 
                                        current_session["personality"], current_session["rag_context"], 
                                        user_text, current_session.get("emotion_context", {}), None
                                    )
                                    
                                    # C. Save AI Transcript
                                    await SESSION_STORE.add_transcript(session_id, "interviewer", next_q)
                                    
                                    # D. Send AI Text to Hume (so Hume speaks it)
                                    assistant_msg = {"type": "assistant_input", "text": next_q}
                                    await hume_socket.send(json.dumps(assistant_msg))

                            # Always forward the JSON (transcripts/metadata) to frontend
                            await websocket.send_text(data)

                except (WebSocketDisconnect, websockets.exceptions.ConnectionClosed):
                    pass

            # Run loops concurrently
            await asyncio.gather(forward_to_hume(), forward_to_client())
            
    except Exception as e:
        logger.error(f"WebSocket Proxy Error: {e}")
    finally:
        logger.info(f"Closing WebSocket for session {session_id}")

# -------------------------------------------------------------------
# PING
# -------------------------------------------------------------------
@app.get("/ping-all")
def ping_all():
    # Check Groq
    groq_status = {"ok": False}
    try:
        client = Groq(api_key=GROQ_API_KEY)
        client.chat.completions.create(
            messages=[{"role": "user", "content": "hi"}],
            model="llama-3.1-8b-instant"
        )
        groq_status = {"ok": True}
    except Exception as e:
        groq_status = {"ok": False, "error": str(e)}

    return {"groq": groq_status, "hume": {"ok": True}}