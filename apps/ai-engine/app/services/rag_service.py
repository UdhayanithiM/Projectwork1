import logging
import uuid
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import TextEmbedding

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("fortitwin.rag")

class RAGService:
    def __init__(self):
        # 1. Connect to Qdrant (The Memory Bank)
        # In production, use QDRANT_URL from env. For local, we default to localhost.
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self.collection_name = "fortitwin_knowledge"
        
        # 2. Load Local Embedding Model (The Heavy Processor)
        # This runs LOCALLY. No API costs. High performance.
        logger.info("🧠 Loading FastEmbed model (this may take a moment)...")
        self.embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        logger.info("✅ Embedding model loaded.")

        self._ensure_collection()

    def _ensure_collection(self):
        """Creates the vector collection if it doesn't exist."""
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=384, # Matches BAAI/bge-small-en-v1.5 dimensions
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"✅ Created collection: {self.collection_name}")

    async def ingest_document(self, text: str, metadata: Dict[str, Any]):
        """
        Chunks text, embeds it, and stores it in Qdrant.
        """
        try:
            # 1. Smart Chunking (Recursive is better, but splitlines works for resumes)
            # We treat each non-empty line/paragraph as a potential chunk
            chunks = [line for line in text.split('\n') if len(line) > 20]
            
            if not chunks:
                return

            # 2. Embed All Chunks (Batch Processing)
            # This uses the local CPU/GPU "Heavy" model
            embeddings = list(self.embedding_model.embed(chunks))

            # 3. Prepare Points for Qdrant
            points = []
            for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                points.append(models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector.tolist(),
                    payload={
                        "text": chunk,
                        "chunk_index": i,
                        **metadata # candidate_id, filename, etc.
                    }
                ))

            # 4. Upload
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"💾 Ingested {len(points)} chunks for {metadata.get('filename')}")

        except Exception as e:
            logger.error(f"❌ Ingestion failed: {e}")

    async def search(self, query: str, limit: int = 3, candidate_id: str = None) -> str:
        """
        Retrieves relevant context for a query.
        """
        try:
            # 1. Embed the Query
            query_vec = list(self.embedding_model.embed([query]))[0]

            # 2. Define Filters (Only search THIS candidate's resume)
            query_filter = None
            if candidate_id:
                query_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="candidate_id",
                            match=models.MatchValue(value=candidate_id)
                        )
                    ]
                )

            # 3. Search Qdrant
            hits = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vec.tolist(),
                query_filter=query_filter,
                limit=limit
            )

            # 4. Construct Context String
            context_text = "\n---\n".join([hit.payload["text"] for hit in hits])
            return context_text

        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return ""

# Singleton
rag = RAGService()