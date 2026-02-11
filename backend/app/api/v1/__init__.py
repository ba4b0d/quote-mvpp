"""API v1 router."""

from fastapi import APIRouter
from app.api.v1 import quote, auth, materials

router = APIRouter()

# Include routers
router.include_router(quote.router, prefix="/quote", tags=["quote"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(materials.router, prefix="", tags=["materials"])
