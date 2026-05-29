import threading
from contextlib import contextmanager

import psycopg2
from psycopg2 import pool
from fastapi import HTTPException

from app.config import get_settings
from app.log_config import get_logger

log = get_logger(__name__)

_pool_lock = threading.Lock()
_db_pool: pool.ThreadedConnectionPool | None = None


def init_pool() -> None:
    global _db_pool
    with _pool_lock:
        if _db_pool is None:
            settings = get_settings()
            _db_pool = pool.ThreadedConnectionPool(1, 10, **settings.db_config)
            log.info("DB pool initialized")


def close_pool() -> None:
    global _db_pool
    with _pool_lock:
        if _db_pool is not None:
            _db_pool.closeall()
            _db_pool = None
            log.info("DB pool closed")


def _get_pool() -> pool.SimpleConnectionPool:
    if _db_pool is None:
        init_pool()
    return _db_pool


@contextmanager
def get_conn():
    db_pool = _get_pool()
    conn = None
    try:
        conn = db_pool.getconn()
        yield conn
    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        log.error("DB error: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        if conn:
            db_pool.putconn(conn)