import logging
from contextlib import asynccontextmanager

from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    UploadFile,
    File,
    Form,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware

# --- ARQ (Queue) ---
from arq import create_pool
from arq.connections import RedisSettings

from app.core.config import get_settings
from app.models import (
    StartInterviewRequest,
    StartInterviewResponse,
    NextQuestionRequest,
    NextQuestionResponse,
    ScoreRequest,
    ScoreResponse,
    SESSION_STORE,
)
from app.services.gateway import gateway
from app.services.websocket import ws_manager
from app.services.rag_service import rag

# -------------------------------------------------------------------
# Setup
# -------------------------------------------------------------------
settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fortitwin.api")

# -------------------------------------------------------------------
# LIFESPAN (Startup / Shutdown)
# -------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect Redis for background jobs
    app.state.arq_pool = await create_pool(
        RedisSettings.from_dsn(settings.REDIS_URL)
    )
    logger.info("✅ Redis Job Queue Connected")

    yield

    # Cleanup
    await app.state.arq_pool.close()
    logger.info("🛑 Redis Job Queue Closed")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="3.2.0",
    description="FortiTwin Neural Core 3.2 – Async + RAG + Queue",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# 1. ASYNC JOB SUBMISSION (QUEUE / MUSCLE)
# -------------------------------------------------------------------
@app.post("/api/parse-resume")
async def parse_resume(
    file: UploadFile = File(...),
    candidate_id: str = Form("anonymous"),
):
    """
    Accept resume -> enqueue background job -> return immediately.
    """
    logger.info(f"📥 Queue resume | candidate={candidate_id}")

    content = await file.read()

    # Enqueue background job (worker handles parsing + RAG ingestion)
    job = await app.state.arq_pool.enqueue_job(
        "parse_and_ingest_resume",
        file_content=content,
        filename=file.filename,
        candidate_id=candidate_id,
    )

    return {
        "status": "processing",
        "message": "Resume uploaded. Processing in background.",
        "job_id": job.job_id,
    }


# -------------------------------------------------------------------
# 2. INTERVIEW LOGIC (RAG + GATEWAY)
# -------------------------------------------------------------------
@app.post("/interview/start", response_model=StartInterviewResponse)
async def start_interview(req: StartInterviewRequest):
    logger.info(f"🚀 Start interview | session={req.session_id}")

    # RAG search for candidate background
    context = await rag.search(
        query=f"{req.job_title} experience skills",
        candidate_id=req.candidate_id,
    )

    await SESSION_STORE.init_session(
        session_id=req.session_id,
        candidate_id=req.candidate_id,
        job_title=req.job_title,
        company=req.company,
        personality=req.personality,
        rag_context=context,
        mode="neural-3.2",
    )

    ai_response = await gateway.generate_response(
        job_title=req.job_title,
        company=req.company,
        history=[],
        context=context,
    )

    await SESSION_STORE.add_transcript(
        req.session_id, "interviewer", ai_response.response_text
    )

    return StartInterviewResponse(
        session_id=req.session_id,
        first_question=ai_response.response_text,
        mode="async-rag-queue",
    )


@app.post("/interview/next", response_model=NextQuestionResponse)
async def next_question(req: NextQuestionRequest):
    try:
        sess = await SESSION_STORE.get_session(req.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")

    await SESSION_STORE.add_transcript(
        req.session_id, "candidate", req.candidate_answer
    )

    # Optional dynamic context refresh
    context = sess.get("rag_context", "")

    ai_response = await gateway.generate_response(
        job_title=sess["job_title"],
        company=sess["company"],
        history=[{"role": "user", "content": req.candidate_answer}],
        context=context,
        emotion_data=sess.get("emotion_context", {}),
    )

    await SESSION_STORE.add_transcript(
        req.session_id, "interviewer", ai_response.response_text
    )

    return NextQuestionResponse(
        session_id=req.session_id,
        question=ai_response.response_text,
        hints={"hints_list": ai_response.hints},
    )


# -------------------------------------------------------------------
# 3. INTERVIEW SCORING (SMART MODEL)
# -------------------------------------------------------------------
@app.post("/interview/score", response_model=ScoreResponse)
async def score_interview(req: ScoreRequest):
    try:
        sess = await SESSION_STORE.get_session(req.session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found")

    evaluation = await gateway.evaluate_interview(
        transcript=sess.get("transcript", []),
        job_title=sess["job_title"],
    )

    return ScoreResponse(
        session_id=req.session_id,
        scores=evaluation.dict(),
    )


# -------------------------------------------------------------------
# 4. REAL-TIME VOICE (HUME PROXY)
# -------------------------------------------------------------------
@app.websocket("/ws/hume/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await ws_manager.connect(websocket, session_id)
    try:
        await ws_manager.handle_hume_proxy(websocket, session_id)
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id)


# -------------------------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "operational",
        "queue": "redis-active",
        "rag": "active",
        "gateway": "active",
        "version": "3.2.0",
    }
