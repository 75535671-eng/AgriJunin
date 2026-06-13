from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.context import Scope, UserContext
from app.core.responses import http_error
from app.core.security import decode_token
from app.repositories.auth_repository import get_agricultor_id_by_user

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> UserContext:
    if not credentials or not credentials.credentials:
        raise http_error("No autenticado", 401)
    try:
        payload = decode_token(credentials.credentials)
    except Exception as exc:
        raise http_error("Token inválido o expirado", 401) from exc
    return UserContext(
        id=int(payload["id"]),
        email=payload["email"],
        rol=payload["rol"],
        nombre=payload["nombre"],
    )


async def get_scope(user: Annotated[UserContext, Depends(get_current_user)]) -> Scope:
    agricultor_id = None
    if user.rol == "agricultor":
        agricultor_id = get_agricultor_id_by_user(user.id)
    return Scope(rol=user.rol, user_id=user.id, agricultor_id=agricultor_id)


def require_roles(*roles: str):
    async def _checker(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
        if user.rol not in roles:
            raise http_error("No tiene permisos para esta acción", 403)
        return user

    return _checker
