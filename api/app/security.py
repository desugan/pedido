from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
import jwt
import hashlib

from .config import Config

logger = logging.getLogger(__name__)


def sign_token(payload: dict) -> str:
    secret = Config.JWT_SECRET
    if not secret:
        logger.error("JWT_SECRET is empty!")
        raise ValueError("JWT_SECRET not configured")

    logger.info("security.py - sign_token: signing with issuer=%s, audience=%s", Config.JWT_ISSUER, Config.JWT_AUDIENCE)

    now = datetime.now(timezone.utc)
    data = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=Config.JWT_TTL_MINUTES)).timestamp()),
        "iss": Config.JWT_ISSUER,
        "aud": Config.JWT_AUDIENCE,
    }
    return jwt.encode(data, secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    secret = Config.JWT_SECRET
    if not secret:
        logger.error("JWT_SECRET is empty!")
        raise ValueError("JWT_SECRET not configured")

    logger.info("security.py - decode_token: decoding with issuer=%s, audience=%s", Config.JWT_ISSUER, Config.JWT_AUDIENCE)

    return jwt.decode(
        token,
        secret,
        algorithms=["HS256"],
        audience=Config.JWT_AUDIENCE,
        issuer=Config.JWT_ISSUER,
    )


def verify_password(stored_password: str, raw_password: str) -> bool:
    if not stored_password or not raw_password:
        return False

    return stored_password == hashlib.md5(raw_password.encode()).hexdigest()


