# main.py — REPLACEMENT (drop-in)
import os
import logging
import asyncio
import websockets
import json
import base64
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
from starlette.websockets import WebSocketDisconnect, WebSocketState
import websockets.exceptions

# Import models (your models.py defines SESSION_STORE)
from .models import (
    StartInterviewRequest,
    StartInterviewResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    ScoreRequest,
    ScoreResponse,
    SecurityEvent,
    EmotionSignal,
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
    version="0.5.0",
    description="API backend for adaptive AI-driven interviews (Groq + Hume) - Unified DB.",
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
        security_hint = InterviewEngine.security_hint_from_event(
            last_event.get("event_type"), last_event.get("metadata", {})
        )

    q = ENGINE.next_question(
        sess["job_title"],
        sess["company"],
        sess["personality"],
        sess["rag_context"],
        req.candidate_answer,
        emotion_ctx,
        security_hint,
    )

    await SESSION_STORE.add_transcript(req.session_id, "interviewer", q)

    return NextQuestionResponse(
        session_id=req.session_id, question=q, hints={"security_hint": security_hint, "emotion_ctx": emotion_ctx}
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
#  VOICE PROXY (HUME AI) - HYBRID MODE (Groq Logic + Hume Voice)
# -------------------------------------------------------------------
@app.websocket("/ws/hume/{session_id}")
async def hume_websocket_proxy(websocket: WebSocket, session_id: str):
    """
    High-quality Hume EVI proxy for Hybrid mode:
      - Accepts binary audio chunks (from frontend MediaRecorder)
      - Forwards them to Hume as audio_input (base64)
      - Receives user_message (transcript) from Hume -> calls Groq (ENGINE.next_question)
      - Sends assistant_input to Hume with audio_output.enable=True (so Hume speaks)
      - Forwards audio_output bytes and assistant_message events to frontend in a stable UI format
      - Persists only text transcripts to Mongo via SESSION_STORE
    """
    await websocket.accept()

    # verify session exists
    try:
        sess = await SESSION_STORE.get_session(session_id)
    except KeyError:
        logger.warning(f"Session {session_id} not found locally.")
        try:
            await websocket.close(code=4004, reason="Session not found")
        except Exception:
            pass
        return

    # verify HUME API key
    if not HUME_API_KEY:
        logger.error("HUME_API_KEY is missing in environment variables!")
        try:
            await websocket.close(code=4001, reason="API Key Missing")
        except Exception:
            pass
        return

    # Hume EVI websocket (v0) endpoint
    uri = f"wss://api.hume.ai/v0/evi/chat?api_key={HUME_API_KEY}"

    # Safeguard: ensure websocket is closed cleanly on exit
    hume_socket = None
    forward_tasks = []

    try:
        # connect to Hume (no ping to avoid timeout during silence)
        hume_socket = await websockets.connect(uri, ping_interval=None)
        logger.info(f"✅ Connected to Hume EVI for session {session_id}")

        # Configure Hume session: set expected audio encoding and short context
        config_message = {
            "type": "session_settings",
            "audio": {"encoding": "linear16", "sample_rate": 48000, "channels": 1},
            "context": {
                "text": f"You are an interviewer for {sess.get('job_title')} at {sess.get('company')}. "
                "Speak in a natural, conversational tone. Keep questions concise and clear."
            },
        }
        await hume_socket.send(json.dumps(config_message))

        # If transcript already contains an interviewer message (from /start), speak it
        transcript = sess.get("transcript", [])
        if transcript and transcript[-1]["role"] == "interviewer":
            last_q = transcript[-1]["text"]
            if len(last_q) > 250:
                # Trim carefully
                truncated = last_q[:250]
                last_punc = max(truncated.rfind("."), truncated.rfind("?"), truncated.rfind("!"))
                if last_punc > 30:
                    last_q = truncated[: last_punc + 1]
                else:
                    last_q = truncated + "..."
            logger.info(f"🗣️ Triggering initial AI speech (truncated): {last_q[:60]}")

            initial_msg = {
                "type": "assistant_input",
                "text": last_q,
                # Hume expects audio_output at top-level of assistant_input payload
                "audio_output": {"enable": True, "style": "conversational"},
            }
            await hume_socket.send(json.dumps(initial_msg))

            # Also inform frontend immediately what the AI will say (UI shows text)
            await websocket.send_text(json.dumps({"type": "assistant_message", "message": {"content": last_q}}))

        # Helper safe send functions (frontend)
        async def safe_send_text_to_frontend(obj: dict):
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_text(json.dumps(obj))
            except Exception:
                pass

        async def safe_send_bytes_to_frontend(b: bytes):
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.send_bytes(b)
            except Exception:
                pass

        # ---------- Forwarding logic ----------
        # We'll create two concurrent tasks:
        #   - forward_from_frontend_to_hume: reads websocket from client and sends to Hume
        #   - forward_from_hume_to_frontend: reads Hume events and sends to client (plus backend logic)
        # Proper shutdown/cancellation is implemented below.

        # Frontend->Hume: read audio blobs (binary) and JSON control messages
        async def forward_from_frontend_to_hume():
            try:
                while True:
                    msg = await websocket.receive()

                    # Binary audio chunk
                    if "bytes" in msg and msg["bytes"]:
                        audio_chunk = msg["bytes"]
                        # Immediate forwarding to Hume as base64 payload
                        # Hume can accept chunks as audio_input messages
                        try:
                            b64 = base64.b64encode(audio_chunk).decode("utf-8")
                            await hume_socket.send(json.dumps({"type": "audio_input", "data": b64}))
                        except Exception as e:
                            logger.warning(f"Failed to send audio chunk to Hume: {e}")

                    # Text frame from frontend (should be JSON control messages)
                    elif "text" in msg and msg["text"]:
                        raw = msg["text"]
                        # Try to parse JSON control message. If invalid JSON, ignore it.
                        try:
                            obj = json.loads(raw)
                        except Exception:
                            # Ignore non-JSON raw text frames (these are often keepalives from browser)
                            continue

                        # If frontend sends a direct control meant for Hume, forward it.
                        # We only forward messages that have a "type" field and are explicitly intended
                        # for Hume (e.g., "assistant_input" debug/testing). Otherwise ignore.
                        msg_type = obj.get("type")
                        if msg_type in {"assistant_input", "session_settings", "control"}:
                            try:
                                await hume_socket.send(json.dumps(obj))
                            except Exception as e:
                                logger.warning(f"Failed to forward control to Hume: {e}")
                        else:
                            # For other frontend messages, ignore or use in future.
                            continue

            except WebSocketDisconnect:
                logger.info(f"Frontend socket disconnected: {session_id}")
            except Exception as e:
                logger.error(f"Error in forward_from_frontend_to_hume: {e}")

        # Hume->Frontend: process Hume events and run interview logic on user_message
        async def forward_from_hume_to_frontend():
            try:
                while True:
                    data = await hume_socket.recv()

                    # If Hume sent binary (rare), forward raw bytes
                    if isinstance(data, (bytes, bytearray)):
                        await safe_send_bytes_to_frontend(bytes(data))
                        continue

                    # Hume typically sends JSON strings
                    try:
                        event = json.loads(data)
                    except Exception:
                        # Forward raw text for debugging
                        await safe_send_text_to_frontend({"type": "raw", "payload": str(data)})
                        continue

                    evt_type = event.get("type")

                    # AUDIO: Hume voice audio chunk (base64) -> decode -> forward as bytes
                    if evt_type == "audio_output":
                        b64 = event.get("data")
                        if b64:
                            try:
                                audio_bytes = base64.b64decode(b64)
                                await safe_send_bytes_to_frontend(audio_bytes)
                            except Exception as e:
                                logger.warning(f"Failed to decode/forward audio_output: {e}")

                        # also forward a lightweight meta event so UI can show "AI speaking"
                        await safe_send_text_to_frontend({"type": "audio_output_meta", "meta": {"len": len(b64 or "")}})

                    # USER: Hume sends transcribed user message
                    elif evt_type == "user_message":
                        user_text = event.get("message", {}).get("content", "")
                        logger.info(f"[Hume] user_message: {user_text}")

                        if user_text:
                            # persist candidate text
                            try:
                                await SESSION_STORE.add_transcript(session_id, "candidate", user_text)
                            except Exception as e:
                                logger.warning(f"Failed to persist candidate transcript: {e}")

                            # refresh session
                            try:
                                current_session = await SESSION_STORE.get_session(session_id)
                            except Exception as e:
                                logger.warning(f"Failed to fetch session after user_message: {e}")
                                current_session = sess

                            # generate next question via InterviewEngine (Groq or offline)
                            try:
                                next_q = ENGINE.next_question(
                                    current_session.get("job_title"),
                                    current_session.get("company"),
                                    current_session.get("personality"),
                                    current_session.get("rag_context"),
                                    user_text,
                                    current_session.get("emotion_context", {}),
                                    None,
                                )
                            except Exception as e:
                                logger.error(f"ENGINE.next_question failed: {e}")
                                next_q = "Could you expand on that?"

                            # persist interviewer text
                            try:
                                await SESSION_STORE.add_transcript(session_id, "interviewer", next_q)
                            except Exception as e:
                                logger.warning(f"Failed to persist interviewer transcript: {e}")

                            # instruct Hume to speak the generated question (top-level audio_output)
                            assistant_payload = {
                                "type": "assistant_input",
                                "text": next_q,
                                "audio_output": {"enable": True, "style": "conversational"},
                            }
                            try:
                                await hume_socket.send(json.dumps(assistant_payload))
                            except Exception as e:
                                logger.error(f"Failed to send assistant_input to Hume: {e}")

                            # immediately inform frontend UI of assistant text so transcript updates instantly
                            await safe_send_text_to_frontend({"type": "assistant_message", "message": {"content": next_q}})

                    # ASSISTANT MESSAGE: informational object from Hume about assistant text
                    elif evt_type == "assistant_message":
                        # Normalize and forward in your expected UI format
                        msg_obj = event.get("message", {})
                        content = msg_obj.get("content") if isinstance(msg_obj, dict) else None
                        # If Hume included content, forward that; otherwise forward raw event
                        if content:
                            await safe_send_text_to_frontend({"type": "assistant_message", "message": {"content": content}})
                        else:
                            await safe_send_text_to_frontend({"type": "assistant_message", "message": msg_obj})

                    # ERROR or other events — forward for telemetry
                    else:
                        # Keep forwarded format predictable for frontend
                        await safe_send_text_to_frontend({"type": evt_type or "unknown", "payload": event})

            except websockets.exceptions.ConnectionClosed:
                logger.info("Hume connection closed for session %s", session_id)
            except Exception as e:
                logger.error(f"Error in forward_from_hume_to_frontend: {e}")

        # create tasks and supervise
        task_front_to_hume = asyncio.create_task(forward_from_frontend_to_hume())
        task_hume_to_front = asyncio.create_task(forward_from_hume_to_frontend())
        forward_tasks = [task_front_to_hume, task_hume_to_front]

        # wait until either finishes (disconnect or error) and then cancel the other
        done, pending = await asyncio.wait(forward_tasks, return_when=asyncio.FIRST_COMPLETED)

        for t in pending:
            t.cancel()
        # ensure tasks complete/cancelled
        for t in done:
            try:
                await t
            except Exception:
                pass

    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"❌ Hume Connection Refused: {getattr(e, 'status_code', str(e))}")
        try:
            await websocket.close(code=4001, reason="Hume Auth Failed")
        except Exception:
            pass
    except Exception as e:
        logger.error(f"❌ General Proxy Error: {str(e)}")
        try:
            await websocket.close(code=1011, reason="Internal Proxy Error")
        except Exception:
            pass
    finally:
        # cleanup
        try:
            if hume_socket and not hume_socket.closed:
                await hume_socket.close()
        except Exception:
            pass
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
        except Exception:
            pass

        logger.info(f"Cleaned up Hume proxy for session {session_id}")


# -------------------------------------------------------------------
# PING
# -------------------------------------------------------------------
@app.get("/ping-all")
def ping_all():
    groq_status = {"ok": False}
    try:
        client = Groq(api_key=GROQ_API_KEY)
        client.chat.completions.create(messages=[{"role": "user", "content": "hi"}], model="llama-3.1-8b-instant")
        groq_status = {"ok": True}
    except Exception as e:
        groq_status = {"ok": False, "error": str(e)}

    return {"groq": groq_status, "hume": {"ok": True}}
