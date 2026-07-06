"""FastAPI main application."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import logging
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import init_db, get_db, seed_materials, seed_settings
from app.core.security import create_staff_user
from app.api import v1

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("Backend v2 - Modern architecture")
    
    # Warn if SECRET_KEY is not set via environment
    import os
    if not os.environ.get("SECRET_KEY"):
        logger.warning("SECRET_KEY not set via environment variable - using auto-generated key. Tokens will be invalidated on restart!")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Seed default data
    db = next(get_db())
    try:
        seed_materials(db)
        seed_settings(db)
        
        # Create default admin user if not exists
        admin = db.query(StaffUser).filter(StaffUser.username == "admin").first()
        if not admin:
            from app.core.security import get_password_hash
            admin = StaffUser(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            logger.info("Default admin user created (admin/admin123)")
        
        logger.info("Database seeded with default data")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
    
    yield
    # Shutdown
    logger.info("Shutting down...")


# Import StaffUser after database is defined
from app.core.database import StaffUser


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Modern 3D Printing Quotation System v2",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include API routes
app.include_router(v1.router, prefix="/api/v1")


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "name": settings.APP_NAME
    }


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
