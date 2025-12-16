import logging
from arq.connections import RedisSettings
from app.core.config import get_settings
from app.workers.tasks import parse_and_ingest_resume

settings = get_settings()

# Configure logging for the worker process
logging.basicConfig(level=logging.INFO)

async def startup(ctx):
    print("💪 Background Worker Started")

async def shutdown(ctx):
    print("💤 Background Worker Stopping")

class WorkerSettings:
    # Connect to Redis (localhost:6379 by default)
    functions = [parse_and_ingest_resume]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    on_startup = startup
    on_shutdown = shutdown