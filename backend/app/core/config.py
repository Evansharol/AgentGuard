import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentGuard — AI Agent Policy Enforcement"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./flyyai_governance.db")
    SECRET_KEY: str = "flyyai-secret-governance-key-2026"
    
    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
