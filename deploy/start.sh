#!/bin/sh
set -e

cd /app/backend
export PYTHONPATH=/app/backend

echo "[START] Esperando MySQL..."
python - <<'PY'
import os
import sys
import time

import pymysql

host = os.getenv("MYSQLHOST") or os.getenv("DB_HOST", "localhost")
port = int(os.getenv("MYSQLPORT") or os.getenv("DB_PORT", "3306"))
user = os.getenv("MYSQLUSER") or os.getenv("DB_USER", "root")
password = os.getenv("MYSQLPASSWORD") or os.getenv("DB_PASSWORD", "")

for attempt in range(60):
    try:
        conn = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            charset="utf8mb4",
            connect_timeout=5,
        )
        conn.close()
        print("[OK] MySQL disponible")
        sys.exit(0)
    except Exception as exc:
        print(f"[WAIT] intento {attempt + 1}/60: {exc}")
    time.sleep(3)

print("[ERROR] MySQL no respondió a tiempo")
sys.exit(1)
PY

python database/init_db.py

PORT="${PORT:-3000}"
echo "[START] Uvicorn en puerto $PORT"
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
