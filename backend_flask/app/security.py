from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

from .config import Config


def sign_token(payload: dict) -> str:
    now = datetime.now(timezone.utc)
    data = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=Config.JWT_TTL_MINUTES)).timestamp()),
        "iss": Config.JWT_ISSUER,
        "aud": Config.JWT_AUDIENCE,
    }
    return jwt.encode(data, Config.get_jwt_private_key(), algorithm="RS256")


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        Config.get_jwt_public_key(),
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
        unverified = jwt.decode(token, options={"verify_signature": False})
        if unverified.get("alg") not in ALGORITHM_WHITELIST:
            return False
        return True
    except jwt.exceptions.DecodeError:
        return False