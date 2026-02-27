# backend/app/auth.py
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models
from .db import get_db

load_dotenv()

SECRET_KEY            = os.getenv("SECRET_KEY", "CHANGE_ME")
REFRESH_SECRET_KEY    = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY + "_refresh")
ALGORITHM             = "HS256"

# Access token: 30 minutes (short-lived)
ACCESS_TOKEN_EXPIRE_MINUTES  = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Refresh token: 7 days (long-lived)
REFRESH_TOKEN_EXPIRE_DAYS    = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

RESET_EXPIRE_MINUTES = 30

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── password helpers ──────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ── token creation ────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """Short-lived access token (default 30 min)."""
    payload = data.copy()
    payload["type"] = "access"
    payload["exp"]  = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Long-lived refresh token (default 7 days).  Signed with a separate secret."""
    payload = data.copy()
    payload["type"] = "refresh"
    payload["exp"]  = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def create_token_pair(user) -> dict:
    """Helper: generate both tokens for 'user' and return as a dict."""
    base = {"sub": user.username, "role": user.role, "user_id": user.id}
    return {
        "access_token":  create_access_token(base),
        "refresh_token": create_refresh_token(base),
        "token_type":    "bearer",
    }


# ── token verification ────────────────────────────────────────────────────────

def decode_access_token(token: str) -> dict:
    """Decode and validate an access token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise JWTError("wrong token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Access token invalid or expired")


def decode_refresh_token(token: str) -> dict:
    """Decode and validate a refresh token. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise JWTError("wrong token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")


# ── password-reset helper ─────────────────────────────────────────────────────

def create_reset_token(username: str) -> str:
    payload = {
        "sub":     username,
        "purpose": "password_reset",
        "exp":     datetime.utcnow() + timedelta(minutes=RESET_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── user lookup ───────────────────────────────────────────────────────────────

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload  = decode_access_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
