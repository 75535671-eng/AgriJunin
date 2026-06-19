"""Inicializa la BD solo si aún no tiene tablas (despliegue en la nube)."""
from __future__ import annotations

import sys

from seed_runner import run


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
    if needs_init():
        print("[INIT] Base de datos vacía — aplicando schema, procedimientos y seeds...")
        run()
    else:
        print("[OK] Base de datos ya inicializada")
