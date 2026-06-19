"""Inicializa la BD solo si aún no tiene tablas (despliegue en la nube)."""
from __future__ import annotations

from pathlib import Path


def needs_init() -> bool:
    try:
        from app.core.database import fetch_one

        row = fetch_one("SHOW TABLES LIKE 'usuarios'")
        if not row:
            return True
        users = fetch_one("SELECT COUNT(*) AS n FROM usuarios")
        return not users or users["n"] == 0
    except Exception:
        return True


if __name__ == "__main__":
    import os
    import sys

    backend_root = Path(__file__).resolve().parent.parent
    database_dir = backend_root / "database"
    sys.path[:0] = [str(backend_root), str(database_dir)]
    os.chdir(backend_root)

    from seed_runner import run

    if needs_init():
        print("[INIT] Base de datos vacía — aplicando schema, procedimientos y seeds...")
        run()
    else:
        print("[OK] Base de datos ya inicializada")
