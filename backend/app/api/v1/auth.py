"""Auth API endpoints."""

from fastapi import APIRouter, HTTPException, Depends, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.security import authenticate_user, create_access_token
from app.core.config import settings
from app.core.database import get_db

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


class TokenData(BaseModel):
    username: str = None
    role: str = None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate staff user and return JWT token.
    
    Args:
        request: Username and password
        db: Database session
        
    Returns:
        JWT access token and role
    """
    user = authenticate_user(db, request.username, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }


@router.post("/verify")
async def verify_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    """
    Verify a JWT token.
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        Token validity and user info
    """
    from app.core.security import decode_token
    
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    payload = decode_token(token)
    
    if not payload:
        return {"valid": False, "error": "Invalid or expired token"}
    
    return {
        "valid": True,
        "username": payload.get("sub"),
        "role": payload.get("role"),
        "exp": payload.get("exp")
    }
