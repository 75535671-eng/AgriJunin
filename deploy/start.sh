#!/bin/sh
set -e

cd /app/backend
export PYTHONPATH=/app/backend

echo "[START] Esperando MySQL..."
python - <<'PY'
import sys
import time

from app.core.database import test_connection

for attempt in range(60):
    try:
        if test_connection():
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
