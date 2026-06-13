from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Generator

import pymysql
from pymysql.cursors import DictCursor

from app.core.config import settings


@contextmanager
def get_connection() -> Generator[pymysql.Connection, None, None]:
    conn = pymysql.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        cursorclass=DictCursor,
        autocommit=False,
        client_flag=pymysql.constants.CLIENT.MULTI_RESULTS,
    )
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_one(sql: str, params: tuple | list | None = None) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return cur.fetchone()


def fetch_all(sql: str, params: tuple | list | None = None) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return list(cur.fetchall())


def execute(sql: str, params: tuple | list | None = None) -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            affected = cur.execute(sql, params or ())
            return affected


def call_proc(name: str, params: tuple | list | None = None) -> list[dict[str, Any]]:
    args = params or ()
    placeholders = ", ".join(["%s"] * len(args))
    sql = f"CALL {name}({placeholders})" if args else f"CALL {name}()"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            rows = list(cur.fetchall())
            while cur.nextset():
                pass
            return rows


def test_connection() -> bool:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS ok")
            return cur.fetchone()["ok"] == 1
