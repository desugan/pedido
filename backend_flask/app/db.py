from __future__ import annotations

from contextlib import contextmanager
from urllib.parse import urlparse
import pymysql
from pymysql.cursors import DictCursor

from .config import Config


def _db_params_from_url(database_url: str) -> dict:
    parsed = urlparse(database_url)
    if parsed.scheme not in {"mysql", "mysql+pymysql"}:
        raise ValueError("DATABASE_URL must use mysql scheme")

    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "root",
        "password": parsed.password or "",
        "database": (parsed.path or "/").lstrip("/"),
        "cursorclass": DictCursor,
        "autocommit": True,
        "charset": "utf8mb4",
    }


@contextmanager
def get_connection():
    params = _db_params_from_url(Config.DATABASE_URL)
    conn = pymysql.connect(**params)
    try:
        yield conn
    finally:
        conn.close()


def query_all(sql: str, params: tuple | list | None = None) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            rows = cur.fetchall()
            return list(rows)


def query_one(sql: str, params: tuple | list | None = None) -> dict | None:
    rows = query_all(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple | list | None = None) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            return cur.execute(sql, params or ())


def execute_insert(sql: str, params: tuple | list | None = None) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return int(cur.lastrowid)
