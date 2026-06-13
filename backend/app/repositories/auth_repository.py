from __future__ import annotations

from typing import Any

from app.core.database import call_proc, execute, fetch_all, fetch_one


def find_user_by_login(login: str) -> dict[str, Any] | None:
    rows = call_proc("sp_usuario_buscar_login", (login.strip(),))
    return rows[0] if rows else None


def get_profile(user_id: int) -> dict[str, Any] | None:
    rows = call_proc("sp_usuario_perfil", (user_id,))
    user = rows[0] if rows else None
    if not user:
        return None
    if user.get("rol") == "agricultor":
        ag_id = get_agricultor_id_by_user(user_id)
        if ag_id:
            user["agricultor_id"] = ag_id
            user["agricultor_nombre"] = user["nombre"]
    return user


def get_agricultor_id_by_user(user_id: int) -> int | None:
    rows = call_proc("sp_agricultor_id_por_usuario", (user_id,))
    return int(rows[0]["id"]) if rows else None


def list_tecnicos_pendientes() -> list[dict[str, Any]]:
    return call_proc("sp_usuarios_tecnicos_pendientes")


def aprobar_tecnico(user_id: int) -> bool:
    rows = call_proc("sp_usuario_aprobar_tecnico", (user_id,))
    return bool(rows and rows[0].get("affected"))


def rechazar_tecnico(user_id: int) -> bool:
    rows = call_proc("sp_usuario_rechazar_tecnico", (user_id,))
    return bool(rows and rows[0].get("affected"))


def catalog_id(proc: str, codigo: str) -> int | None:
    rows = call_proc(proc, (codigo,))
    return int(rows[0]["id"]) if rows else None


def user_exists_by_dni(dni: str) -> bool:
    return bool(fetch_one("SELECT id FROM usuarios WHERE dni = %s", (dni,)))


def create_user(
    nombre: str,
    email: str,
    dni: str,
    password_hash: str,
    rol_id: int,
    activo: int,
    estado_cuenta: str,
) -> int:
    sql = """
        INSERT INTO usuarios (nombre, email, dni, password, rol_id, activo, estado_cuenta)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    with __import__("app.core.database", fromlist=["get_connection"]).get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (nombre, email, dni, password_hash, rol_id, activo, estado_cuenta))
            return int(cur.lastrowid)


def ensure_agricultor(usuario_id: int, distrito: str = "Junín") -> None:
    existing = fetch_one("SELECT id FROM agricultores WHERE usuario_id = %s", (usuario_id,))
    if existing:
        execute("UPDATE agricultores SET activo = 1 WHERE usuario_id = %s", (usuario_id,))
    else:
        execute(
            "INSERT INTO agricultores (usuario_id, distrito, fecha_registro, activo) VALUES (%s, %s, CURDATE(), 1)",
            (usuario_id, distrito),
        )


def upgrade_password_hash(user_id: int, password_hash: str) -> None:
    execute("UPDATE usuarios SET password = %s WHERE id = %s", (password_hash, user_id))
