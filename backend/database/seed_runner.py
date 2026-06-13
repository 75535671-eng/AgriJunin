"""
Recrea schema 3FN + seeds + procedimientos almacenados.
Uso: python backend/database/seed_runner.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pymysql
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / ".env")

TABLES = [
    "alertas",
    "registros_agricolas",
    "sensores",
    "solicitudes_aprobacion",
    "lotes",
    "cultivos",
    "agricultores",
    "usuarios",
    "perfiles_climaticos",
    "tipos_sensor",
    "tipos_suelo",
    "temporadas_cultivo",
    "tipos_cultivo",
    "roles",
]


def strip_preamble(sql: str) -> str:
    upper = sql.upper()
    marker = "USE AGRI_JUNIN;"
    idx = upper.find(marker)
    if idx != -1:
        return sql[idx + len(marker) :].lstrip()
    return sql


import re


def strip_sql_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


def run_sql_file(cur: pymysql.cursors.Cursor, filename: str) -> None:
    path = ROOT / filename
    sql = strip_preamble(path.read_text(encoding="utf-8"))

    if filename == "stored_procedures.sql":
        sql = sql.replace("DELIMITER $$", "").replace("DELIMITER ;", "")
        chunks = [c.strip() for c in sql.split("$$") if c.strip()]
        for chunk in chunks:
            cur.execute(chunk)
    else:
        sql = strip_sql_comments(sql)
        statements = [s.strip() for s in sql.split(";") if s.strip()]
        for stmt in statements:
            cur.execute(stmt)
    print(f"[OK] {filename} aplicado")


def run() -> None:
    db_name = os.getenv("DB_NAME", "agri_junin")
    conn = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        charset="utf8mb4",
        autocommit=True,
        client_flag=pymysql.constants.CLIENT.MULTI_STATEMENTS,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS {db_name} "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            cur.execute(f"USE {db_name}")
            cur.execute("SET FOREIGN_KEY_CHECKS = 0")
            for table in TABLES:
                cur.execute(f"DROP TABLE IF EXISTS {table}")
            cur.execute("SET FOREIGN_KEY_CHECKS = 1")
            print("[OK] Tablas anteriores eliminadas")

            for filename in ("schema.sql", "stored_procedures.sql", "seeds.sql"):
                run_sql_file(cur, filename)

            print("[OK] Datos de prueba insertados")
            print("  Credenciales: admin@agrijunin.pe / Admin123!")
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        run()
    except Exception as exc:
        print(f"Error en seed: {exc}", file=sys.stderr)
        sys.exit(1)
