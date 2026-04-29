from __future__ import annotations

import os
import logging
from contextlib import contextmanager
from urllib.parse import urlparse
from pymysql.connections import Connection
from pymysql.cursors import DictCursor
from queue import Queue, Empty
from threading import Lock

from .config import Config

logger = logging.getLogger(__name__)


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


class ConnectionPool:
    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._params = _db_params_from_url(Config.DATABASE_URL)
        self._pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
        self._pool: Queue = Queue(maxsize=self._pool_size)
        self._initialized = True
        self._fill_pool()

    def _fill_pool(self):
        for _ in range(self._pool_size):
            try:
                conn = Connection(**self._params)
                self._pool.put(conn)
            except Exception:
                pass

    def _create_connection(self) -> Connection:
        try:
            conn = self._pool.get_nowait()
            conn.ping(reconnect=True)
            return conn
        except Empty:
            return Connection(**self._params)

    def return_connection(self, conn: Connection):
        try:
            conn.ping(reconnect=True)
            self._pool.put_nowait(conn)
        except Exception:
            conn.close()

    def close_all(self):
        while not self._pool.empty():
            try:
                conn = self._pool.get_nowait()
                conn.close()
            except Empty:
                break


_pool = None


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool()
    return _pool


@contextmanager
def get_connection():
    pool = _get_pool()
    conn = pool._create_connection()
    try:
        yield conn
    finally:
        pool.return_connection(conn)


@contextmanager
def transaction():
    pool = _get_pool()
    conn = pool._create_connection()
    conn.autocommit = False
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Transaction rolled back: {type(e).__name__}: {e}")
        raise
    finally:
        conn.autocommit = True
        pool.return_connection(conn)


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


def tx_query(conn: Connection, sql: str, params: tuple | list | None = None) -> list[dict]:
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return list(cur.fetchall())


def tx_one(conn: Connection, sql: str, params: tuple | list | None = None) -> dict | None:
    rows = tx_query(conn, sql, params)
    return rows[0] if rows else None


def tx_execute(conn: Connection, sql: str, params: tuple | list | None = None) -> int:
    with conn.cursor() as cur:
        return cur.execute(sql, params or ())


def tx_insert(conn: Connection, sql: str, params: tuple | list | None = None) -> int:
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return int(cur.lastrowid)