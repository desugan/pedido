from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

from .config import Config


def sign_token(payload: dict) -> str:
    data = {
        **payload,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(data, Config.JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])


def verify_password(stored_password: str, raw_password: str) -> bool:
    db_password = (stored_password or "").strip()
    input_password = (raw_password or "").strip()

    if not db_password or not input_password:
        return False

    if db_password.startswith("$2a$") or db_password.startswith("$2b$"):
        try:
            return bcrypt.checkpw(input_password.encode("utf-8"), db_password.encode("utf-8"))
        except ValueError:
            return False

    input_md5 = hashlib.md5(input_password.encode("utf-8")).hexdigest().lower()
    db_lower = db_password.lower()
    return db_lower == input_password.lower() or db_lower == input_md5
