from flask import Blueprint, jsonify

from app.db import get_connection

health_bp = Blueprint("health", __name__)


def _health_payload(database_ok: bool) -> dict:
    from datetime import datetime, timezone

    return {
        "api": True,
        "database": database_ok,
        "status": "ok" if database_ok else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@health_bp.get("/health")
@health_bp.get("/api/health")
def health():
    database_ok = False
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        database_ok = True
    except Exception:
        database_ok = False

    status = 200 if database_ok else 503
    return jsonify(_health_payload(database_ok)), status
