from __future__ import annotations

import os
import json
import logging
import base64
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

from .config import Config

logger = logging.getLogger(__name__)


def sign_token(payload: dict) -> str:
    private_key = Config.get_jwt_private_key()
    if not private_key:
        logger.error("JWT private key is empty!")
        raise ValueError("JWT private key not configured")

    logger.info(f"Signing token with issuer={Config.JWT_ISSUER}, audience={Config.JWT_AUDIENCE}")

    now = datetime.now(timezone.utc)
    data = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=Config.JWT_TTL_MINUTES)).timestamp()),
        "iss": Config.JWT_ISSUER,
        "aud": Config.JWT_AUDIENCE,
    }
    return jwt.encode(data, private_key, algorithm="RS256")


def decode_token(token: str) -> dict:
    public_key = Config.get_jwt_public_key()
    if not public_key:
        logger.error("JWT public key is empty!")
        raise ValueError("JWT public key not configured")

    logger.info(f"Decoding token with issuer={Config.JWT_ISSUER}, audience={Config.JWT_AUDIENCE}")

    return jwt.decode(
        token,
        public_key,
        algorithms=["RS256"],
        audience=Config.JWT_AUDIENCE,
        issuer=Config.JWT_ISSUER,
    )


def verify_password(stored_password: str, raw_password: str) -> bool:
    if not stored_password or not raw_password:
        return False

    if stored_password.startswith("$2b$"):
        try:
            return bcrypt.checkpw(raw_password.encode("utf-8"), stored_password.encode("utf-8"))
        except (ValueError, TypeError):
            return False

    return False


ALGORITHM_WHITELIST = ["RS256"]


def validate_token_algorithm(token: str) -> bool:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return False
        header_part = parts[0]
        if len(header_part) % 4 != 0:
            header_part += "=" * (4 - len(header_part) % 4)
        header_bytes = base64.urlsafe_b64decode(header_part)
        header = json.loads(header_bytes)
        alg = header.get("alg", "")
        return alg in ALGORITHM_WHITELIST
    except Exception:
        return False