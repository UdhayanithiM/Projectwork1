import asyncio
import json
import logging
import base64
import websockets
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.core.config import get_settings
from app.models import SESSION_STORE
from app.services.gateway import gateway  # The Router we built in Step 5

logger = logging.getLogger("fortitwin.websocket")
settings = get_settings()

class WebSocketManager:
    """
    Manages real-time voice & text connections for multiple students.
    Handles the Hume AI proxy and integrates the LLM Gateway.
    """
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"🔌 Student connected: {session_id}. Active users: {len(self.active_connections)}")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"🔌 Student disconnected: {session_id}")

    async def handle_hume_proxy(self, websocket: WebSocket, session_id: str):
        """
        The Core Loop: Forwards Audio (Frontend <-> Hume) + Injects AI Logic
        """
        try:
            # 1. Fetch Session Context
            try:
                sess = await SESSION_STORE.get_session(session_id)
            except KeyError:
                await websocket.close(code=4004, reason="Session not found")
                return

            if not settings.HUME_API_KEY:
                logger.error("❌ Hume API Key missing")
                await websocket.close(code=4001, reason="Server Config Error")
                return

            # 2. Connect to Hume AI (Upstream)
            hume_uri = f"wss://api.hume.ai/v0/evi/chat?api_key={settings.HUME_API_KEY}"
            async with websockets.connect(hume_uri) as hume_socket:
                logger.info(f"✅ Connected to Hume for session {session_id}")

                # 3. Configure Hume Session
                await self._send_hume_config(hume_socket, sess)

                # 4. Resume Conversation (if applicable)
                await self._resume_conversation(hume_socket, websocket, sess)

                # 5. Start Bidirectional Forwarding
                # We run two infinite loops in parallel: 
                # A. Frontend -> Hume (Audio Input)
                # B. Hume -> Frontend (Audio Output + Transcripts)
                
                task_a = asyncio.create_task(self._forward_frontend_to_hume(websocket, hume_socket))
                task_b = asyncio.create_task(self._forward_hume_to_frontend(websocket, hume_socket, session_id, sess))

                # Wait until one terminates (usually disconnect)
                done, pending = await asyncio.wait(
                    [task_a, task_b], 
                    return_when=asyncio.FIRST_COMPLETED
                )
                for task in pending: task.cancel()

        except Exception as e:
            logger.error(f"⚠️ WebSocket Error for {session_id}: {e}")
        finally:
            self.disconnect(session_id)

    # --- INTERNAL HELPERS ---

    async def _send_hume_config(self, hume_socket, sess):
        msg = {
            "type": "session_settings",
            "audio": {"encoding": "linear16", "sample_rate": 48000, "channels": 1},
            "transcription": {"mode": "continuous", "interim_results": True},
            "context": {
                "text": f"You are an interviewer for {sess.get('job_title')} at {sess.get('company')}. Be concise."
            },
        }
        await hume_socket.send(json.dumps(msg))

    async def _resume_conversation(self, hume_socket, websocket, sess):
        transcript = sess.get("transcript", [])
        if transcript and transcript[-1]["role"] == "interviewer":
            last_q = transcript[-1]["text"]
            # Speak the last question again so the user knows where they are
            await hume_socket.send(json.dumps({
                "type": "assistant_input",
                "text": last_q
            }))
            await websocket.send_text(json.dumps({
                "type": "assistant_message", 
                "message": {"content": last_q}
            }))

    async def _forward_frontend_to_hume(self, ws_client: WebSocket, ws_hume):
        """Reads mic audio from student -> sends to Hume"""
        try:
            while True:
                msg = await ws_client.receive()
                
                # Handle Binary Audio (Mic data)
                if "bytes" in msg and msg["bytes"]:
                    b64 = base64.b64encode(msg["bytes"]).decode("utf-8")
                    await ws_hume.send(json.dumps({"type": "audio_input", "data": b64}))
                
                # Handle Control Messages (Mute, Pause)
                elif "text" in msg and msg["text"]:
                    # Forward valid JSON controls
                    try:
                        data = json.loads(msg["text"])
                        if data.get("type") in ["session_settings", "assistant_input"]:
                            await ws_hume.send(msg["text"])
                    except:
                        pass
        except WebSocketDisconnect:
            pass

    async def _forward_hume_to_frontend(self, ws_client: WebSocket, ws_hume, session_id: str, sess: dict):
        """Reads Hume audio/text -> sends to student + Calls LLM Gateway"""
        try:
            while True:
                data = await ws_hume.recv()

                # A. Binary Audio Output (Hume speaking) -> Forward instantly
                if isinstance(data, bytes):
                    await ws_client.send_bytes(data)
                    continue

                # B. JSON Events (Transcripts)
                event = json.loads(data)
                evt_type = event.get("type")

                # 1. Forward Audio Metadata
                if evt_type == "audio_output":
                    b64 = event.get("data")
                    if b64:
                        await ws_client.send_bytes(base64.b64decode(b64))
                    continue

                # 2. Handle User Finished Speaking (THE BRAIN LOGIC)
                if evt_type == "user_message":
                    user_text = event.get("message", {}).get("content", "")
                    if user_text:
                        logger.info(f"🗣️ User said: {user_text}")
                        
                        # Save to DB
                        await SESSION_STORE.add_transcript(session_id, "candidate", user_text)

                        # --- CALL THE NEW GATEWAY (ROUTER) ---
                        # This replaces the old blocking ENGINE.next_question
                        ai_response = await gateway.generate_response(
                            job_title=sess.get("job_title", "Engineer"),
                            company=sess.get("company", "Tech Corp"),
                            history=[{"role": "user", "content": user_text}], # Simplified history
                            context=sess.get("rag_context", "")
                        )

                        next_q = ai_response.response_text
                        logger.info(f"🤖 AI replied: {next_q}")

                        # Save AI Reply
                        await SESSION_STORE.add_transcript(session_id, "interviewer", next_q)

                        # A. Tell Hume to speak it
                        await ws_hume.send(json.dumps({
                            "type": "assistant_input",
                            "text": next_q
                        }))

                        # B. Tell Frontend to show it
                        await ws_client.send_text(json.dumps({
                            "type": "assistant_message",
                            "message": {"content": next_q}
                        }))
                
                # 3. Forward Partial Transcripts (Real-time captions)
                elif evt_type in ["transcription_partial", "user_partial"]:
                    # Forward raw event so UI updates live
                    await ws_client.send_text(json.dumps(event))

        except Exception as e:
            logger.error(f"Error in Hume->Frontend loop: {e}")

# Singleton
ws_manager = WebSocketManager()