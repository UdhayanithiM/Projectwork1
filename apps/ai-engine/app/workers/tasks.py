import logging
import io
import json
import pypdf
from groq import AsyncGroq
from app.core.config import get_settings
from app.services.rag_service import rag

settings = get_settings()
logger = logging.getLogger("fortitwin.worker")

async def parse_and_ingest_resume(ctx, file_content: bytes, filename: str, candidate_id: str):
    """
    Background Task:
    1. Extracts text from PDF
    2. Ingests into Qdrant (RAG)
    3. (Optional) pre-calculates summary using Groq
    """
    logger.info(f"🔨 [Worker] Starting job for: {filename}")

    try:
        # 1. CPU Intensive: PDF Extraction
        pdf_file = io.BytesIO(file_content)
        reader = pypdf.PdfReader(pdf_file)
        text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
        
        # Safety truncate
        text = text[:15000]

        # 2. RAG Ingestion (The Memory)
        await rag.ingest_document(
            text=text,
            metadata={"candidate_id": candidate_id, "filename": filename}
        )
        logger.info(f"✅ [Worker] Ingestion complete for {candidate_id}")

        # 3. (Optional) Generate a quick summary to store in DB
        # You could write this to MongoDB here if you wanted persistent profile data
        if settings.GROQ_API_KEY:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            chat = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Extract JSON: skills(list), seniority"},
                    {"role": "user", "content": text[:3000]}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"}
            )
            summary = json.loads(chat.choices[0].message.content)
            logger.info(f"🧠 [Worker] Analysis: {summary}")
            return summary

    except Exception as e:
        logger.error(f"❌ [Worker] Job failed: {e}")
        return {"error": str(e)}