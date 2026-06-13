from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Path

from app.api.deps import UserContext, get_current_user, require_roles
from app.core.responses import fail, success
from app.schemas.auth import LoginBody, RegisterBody, RejectBody
from app.services import auth_service, dni_service

router = APIRouter(tags=["Autenticación"])


@router.get("/auth/consulta-dni/{dni}")
async def consulta_dni(dni: Annotated[str, Path(pattern=r"^\d{8}$")]):
    data = await dni_service.consultar_dni(dni)
    if not data:
        return fail("DNI no encontrado", 404)
    return success(data)


@router.post("/auth/login")
async def login(body: LoginBody):
    login_id = body.dni or body.email or body.login
    result = auth_service.login(str(login_id), body.password)
    if not result:
        return fail("Credenciales inválidas", 401)
    return success(result, "Inicio de sesión exitoso")


@router.post("/auth/register")
async def register(body: RegisterBody):
    result = auth_service.register(body.model_dump())
    msg = (
        "Registro recibido. Un administrador debe aprobar su cuenta antes de iniciar sesión."
        if result.get("pendienteAprobacion")
        else "Registro exitoso"
    )
    return success(result, msg, status=201)


@router.get("/auth/profile")
async def profile(user: Annotated[UserContext, Depends(get_current_user)]):
    data = auth_service.get_profile(user.id)
    if not data:
        return fail("Usuario no encontrado", 404)
    return success(data)


@router.get("/usuarios/pendientes", dependencies=[Depends(require_roles("administrador"))])
async def usuarios_pendientes():
    return success(auth_service.list_tecnicos_pendientes())


@router.patch("/usuarios/{user_id}/aprobar", dependencies=[Depends(require_roles("administrador"))])
async def aprobar_usuario(user_id: int):
    data = auth_service.aprobar_tecnico(user_id)
    if not data:
        return fail("Usuario no encontrado o ya procesado", 404)
    return success(data, "Cuenta aprobada")


@router.patch("/usuarios/{user_id}/rechazar", dependencies=[Depends(require_roles("administrador"))])
async def rechazar_usuario(user_id: int, body: RejectBody):
    data = auth_service.rechazar_tecnico(user_id, body.motivo)
    if not data:
        return fail("Usuario no encontrado o ya procesado", 404)
    return success(data, "Cuenta rechazada")
