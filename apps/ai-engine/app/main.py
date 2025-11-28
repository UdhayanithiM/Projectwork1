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
#  VOICE PROXY (HUME AI)
#  Minimal changes to help continuous / duplex flow:
#   - request continuous interim transcription in session settings
#   - mark assistant audio_output as interruptible
#   - forward partial transcript events to frontend as `user_partial`
#   - DO NOT drop small/odd-length binary frames from Hume (forward them)
# -------------------------------------------------------------------
@app.websocket("/ws/hume/{session_id}")
async def hume_websocket_proxy(websocket: WebSocket, session_id: str):

    await websocket.accept()

    try:
        sess = await SESSION_STORE.get_session(session_id)
    except KeyError:
        await websocket.close(code=4004, reason="Session not found")
        return

    if not HUME_API_KEY:
        await websocket.close(code=4001, reason="API Key Missing")
        return

    uri = f"wss://api.hume.ai/v0/evi/chat?api_key={HUME_API_KEY}"

    hume_socket = None
    forward_tasks = []

    try:
        hume_socket = await websockets.connect(uri, ping_interval=None)

        # -----------------------
        # UPDATED: request continuous transcription + interim results
        # -----------------------
        config_message = {
            "type": "session_settings",
            "audio": {"encoding": "linear16", "sample_rate": 48000, "channels": 1},
            # Request continuous transcription and interim (partial) transcripts so frontend can show live text
            "transcription": {"mode": "continuous", "interim_results": True},
            "context": {
                "text": (
                    f"You are an interviewer for {sess.get('job_title')} at {sess.get('company')}. "
                    "Speak in a natural, conversational tone. Keep questions concise and clear."
                )
            },
        }
        await hume_socket.send(json.dumps(config_message))
        # -----------------------

        transcript = sess.get("transcript", [])
        if transcript and transcript[-1]["role"] == "interviewer":
            last_q = transcript[-1]["text"]
            if len(last_q) > 250:
                truncated = last_q[:250]
                last_punc = max(truncated.rfind("."), truncated.rfind("?"), truncated.rfind("!"))
                last_q = truncated[: last_punc + 1] if last_punc > 30 else truncated + "..."

            initial_msg = {
                "type": "assistant_input",
                "text": last_q,
                # Mark assistant output interruptible so Hume can detect user speech and stop/resume appropriately
                "audio_output": {"enable": True, "style": "conversational", "interruptible": True},
            }
            await hume_socket.send(json.dumps(initial_msg))
            await websocket.send_text(json.dumps({"type": "assistant_message", "message": {"content": last_q}}))

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

        async def forward_from_frontend_to_hume():
            try:
                while True:
                    msg = await websocket.receive()

                    if "bytes" in msg and msg["bytes"]:
                        audio_chunk = msg["bytes"]
                        try:
                            b64 = base64.b64encode(audio_chunk).decode("utf-8")
                            await hume_socket.send(json.dumps({"type": "audio_input", "data": b64}))
                        except Exception as e:
                            logger.warning(f"Failed to send audio chunk to Hume: {e}")

                    elif "text" in msg and msg["text"]:
                        raw = msg["text"]
                        try:
                            obj = json.loads(raw)
                        except Exception:
                            continue

                        if obj.get("type") in {"assistant_input", "session_settings", "control"}:
                            try:
                                await hume_socket.send(json.dumps(obj))
                            except Exception as e:
                                logger.warning(f"Failed to forward control to Hume: {e}")
                        continue

            except WebSocketDisconnect:
                logger.info(f"Frontend socket disconnected: {session_id}")
            except Exception as e:
                logger.error(f"Error in forward_from_frontend_to_hume: {e}")

        async def forward_from_hume_to_frontend():
            try:
                while True:
                    data = await hume_socket.recv()

                    # --- FORWARD BINARY FRAMES DIRECTLY (NO FILTER) ---
                    # Hume may send a mix of binary audio frames and JSON strings.
                    # Forward raw binary frames to frontend as-is so playback remains continuous.
                    if isinstance(data, (bytes, bytearray)):
                        try:
                            await safe_send_bytes_to_frontend(bytes(data))
                        except Exception as e:
                            logger.warning(f"Failed to forward binary frame to frontend: {e}")
                        continue
                    # --- end binary forward ---

                    try:
                        event = json.loads(data)
                    except Exception:
                        await safe_send_text_to_frontend({"type": "raw", "payload": str(data)})
                        continue

                    evt_type = event.get("type")

                    # Hume sends base64 audio_output chunks
                    if evt_type == "audio_output":
                        b64 = event.get("data")
                        if b64:
                            try:
                                audio_bytes = base64.b64decode(b64)
                                await safe_send_bytes_to_frontend(audio_bytes)
                            except Exception as e:
                                logger.warning(f"Failed to decode/forward audio_output: {e}")

                        await safe_send_text_to_frontend({"type": "audio_output_meta", "meta": {"len": len(b64 or "")}})

                    # USER: full transcription (final)
                    elif evt_type == "user_message":
                        user_text = event.get("message", {}).get("content", "")

                        if user_text:
                            try:
                                await SESSION_STORE.add_transcript(session_id, "candidate", user_text)
                            except Exception:
                                pass

                            try:
                                current_session = await SESSION_STORE.get_session(session_id)
                            except Exception:
                                current_session = sess

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
                            except Exception:
                                next_q = "Could you expand on that?"

                            try:
                                await SESSION_STORE.add_transcript(session_id, "interviewer", next_q)
                            except Exception:
                                pass

                            assistant_payload = {
                                "type": "assistant_input",
                                "text": next_q,
                                # keep assistant interruptible to allow user to break in
                                "audio_output": {"enable": True, "style": "conversational", "interruptible": True},
                            }

                            try:
                                await hume_socket.send(json.dumps(assistant_payload))
                            except Exception:
                                pass

                            await safe_send_text_to_frontend({"type": "assistant_message", "message": {"content": next_q}})

                    # PARTIAL / INTERIM transcription events (live user speaking)
                    # We forward them as `user_partial` so frontend can show a live transcript
                    elif evt_type in {"transcription_partial", "user_partial", "partial_transcript", "speech_hypothesis"}:
                        # Try to pull a likely text field
                        partial_text = None
                        payload = event.get("message") or event.get("payload") or event
                        # different payload shapes possible; try common keys
                        if isinstance(payload, dict):
                            partial_text = payload.get("content") or payload.get("text") or payload.get("hypothesis")
                        if partial_text:
                            await safe_send_text_to_frontend({"type": "user_partial", "partial": partial_text})

                    elif evt_type == "assistant_message":
                        msg_obj = event.get("message", {})
                        content = msg_obj.get("content") if isinstance(msg_obj, dict) else None

                        if content:
                            await safe_send_text_to_frontend({"type": "assistant_message", "message": {"content": content}})
                        else:
                            await safe_send_text_to_frontend({"type": "assistant_message", "message": msg_obj})

                    else:
                        # Forward other events for telemetry
                        await safe_send_text_to_frontend({"type": evt_type or "unknown", "payload": event})

            except websockets.exceptions.ConnectionClosed:
                logger.info("Hume connection closed for session %s", session_id)
            except Exception as e:
                logger.error(f"Error in forward_from_hume_to_frontend: {e}")

        task_front = asyncio.create_task(forward_from_frontend_to_hume())
        task_hume = asyncio.create_task(forward_from_hume_to_frontend())
        forward_tasks = [task_front, task_hume]

        done, pending = await asyncio.wait(forward_tasks, return_when=asyncio.FIRST_COMPLETED)

        for t in pending:
            t.cancel()

        for t in done:
            try:
                await t
            except Exception:
                pass

    except websockets.exceptions.InvalidStatusCode:
        await websocket.close(code=4001, reason="Hume Auth Failed")
    except Exception:
        await websocket.close(code=1011, reason="Internal Proxy Error")
    finally:
        try:
            if hume_socket and not hume_socket.closed:
                await hume_socket.close()
        except:
            pass
        try:
            if websocket.client_state == WebSocketState.CONNECTED:
                await websocket.close()
        except:
            pass


# -------------------------------------------------------------------
# PING
# -------------------------------------------------------------------
@app.get("/ping-all")
def ping_all():
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
