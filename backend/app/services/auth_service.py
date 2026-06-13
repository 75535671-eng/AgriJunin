from __future__ import annotations

import re
from typing import Any

from app.core.responses import http_error
from app.core.security import create_token, hash_password, is_bcrypt_hash, verify_password
from app.repositories import auth_repository as repo

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def login(login_id: str, password: str) -> dict[str, Any] | None:
    user = repo.find_user_by_login(login_id)
    if not user:
        return None
    if user["estado_cuenta"] == "pendiente":
        raise http_error("Su cuenta de técnico está pendiente de aprobación por el administrador.", 403)
    if user["estado_cuenta"] == "rechazada":
        raise http_error("Su solicitud de cuenta fue rechazada. Contacte al administrador.", 403)
    if not user.get("activo"):
        return None
    if not verify_password(password, user.get("password")):
        return None
    if not is_bcrypt_hash(user.get("password")):
        repo.upgrade_password_hash(user["id"], hash_password(password))
    safe = {k: v for k, v in user.items() if k != "password"}
    profile = repo.get_profile(user["id"]) or safe
    return {"user": profile, "token": create_token(safe)}


def register(data: dict[str, Any]) -> dict[str, Any]:
    dni = str(data.get("dni", "")).strip()
    if not re.fullmatch(r"\d{8}", dni):
        raise http_error("DNI inválido", 400)
    if repo.user_exists_by_dni(dni):
        raise http_error("Ya existe una cuenta con este DNI", 409)

    email = _normalize_email(data["email"])
    nombre = data.get("nombre") or f"{data.get('nombres', '')} {data.get('apellidos', '')}".strip()
    rol_codigo = data.get("rol") or "agricultor"
    rol_id = repo.catalog_id("sp_catalogo_rol_id", rol_codigo) or 2
    es_tecnico = rol_codigo == "tecnico"
    estado = "pendiente" if es_tecnico else "aprobada"
    activo = 0 if es_tecnico else 1

    user_id = repo.create_user(nombre, email, dni, hash_password(data["password"]), rol_id, activo, estado)
    if rol_codigo == "agricultor":
        repo.ensure_agricultor(user_id, data.get("distrito", "Junín"))

    user = {"id": user_id, "nombre": nombre, "email": email, "dni": dni, "rol": rol_codigo, "estado_cuenta": estado}
    profile = repo.get_profile(user_id) or user
    if es_tecnico:
        return {"user": profile, "token": None, "pendienteAprobacion": True}
    return {"user": profile, "token": create_token(user), "pendienteAprobacion": False}


def get_profile(user_id: int) -> dict[str, Any] | None:
    return repo.get_profile(user_id)


def list_tecnicos_pendientes() -> list[dict[str, Any]]:
    return repo.list_tecnicos_pendientes()


def aprobar_tecnico(user_id: int) -> dict[str, Any] | None:
    if not repo.aprobar_tecnico(user_id):
        return None
    return repo.get_profile(user_id)


def rechazar_tecnico(user_id: int, motivo: str | None = None) -> dict[str, Any] | None:
    if not repo.rechazar_tecnico(user_id):
        return None
    return {"id": user_id, "motivo": motivo or "Solicitud no aprobada"}
