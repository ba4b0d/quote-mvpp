from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache
import secrets


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    APP_NAME: str = "quote-mvpp v2"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./data/quote.db"
    
    # JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://quote.3djat.com",
    ]
    
    # Pricing defaults (IRT)
    ELECTRICITY_RATE_PER_KWH: int = 812
    DEFAULT_OVERHEAD_PCT: float = 0.3
    DEFAULT_MARKUP_PCT: float = 2.0
    COLORING_COST_PER_HOUR: int = 150000
    
    # Estimation defaults
    DEFAULT_LAYER_HEIGHT: float = 0.2  # mm
    DEFAULT_INFILL_PCT: float = 0.20
    DEFAULT_SPEED_MM_S: int = 50
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()


settings = get_settings()
