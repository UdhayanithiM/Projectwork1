import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "FortiTwin Neural Core"
    
    # Database
    DATABASE_URL: str
    
    # AI Keys
    GROQ_API_KEY: str
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    HUME_API_KEY: str | None = None
    
    # Infra
    REDIS_URL: str = "redis://localhost:6379"
    QDRANT_URL: str = "http://localhost:6333"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env

@lru_cache()
def get_settings():
    return Settings()