from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, UserContext, get_current_user, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.auth import RejectBody
from app.schemas.common import PaginationQuery
from app.schemas.entities import CultivoCreate, CultivoUpdate
from app.services import domain_service

router = APIRouter(tags=["Cultivos"])


@router.get("/cultivos", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_cultivos(scope: Annotated[Scope, Depends(get_scope)], pagination: Annotated[PaginationQuery, Depends()]):
    r = domain_service.list_cultivos(pagination.model_dump(), scope)
    return paginated(r["data"], r["pagination"], "Cultivos obtenidos")


@router.get("/cultivos/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_cultivo(item_id: int):
    item = domain_service.get_cultivo(item_id)
    if not item:
        return fail("Cultivo no encontrado", 404)
    return success(item)


@router.post("/cultivos", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def post_cultivo(user: Annotated[UserContext, Depends(get_current_user)], body: CultivoCreate):
    return success(domain_service.create_cultivo(body.model_dump(), user), "Cultivo creado", status=201)


@router.put("/cultivos/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def put_cultivo(
    item_id: int,
    user: Annotated[UserContext, Depends(get_current_user)],
    body: CultivoUpdate,
):
    item = domain_service.update_cultivo(item_id, body.model_dump(exclude_unset=True), user)
    if not item:
        return fail("Cultivo no encontrado", 404)
    return success(item, "Cultivo actualizado")


@router.patch("/cultivos/{item_id}/aprobar", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def patch_aprobar_cultivo(item_id: int, user: Annotated[UserContext, Depends(get_current_user)]):
    item = domain_service.aprobar_cultivo(item_id, user.id)
    if not item:
        return fail("Solicitud no encontrada", 404)
    return success(item, "Cultivo aprobado")


@router.patch("/cultivos/{item_id}/rechazar", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def patch_rechazar_cultivo(
    item_id: int,
    user: Annotated[UserContext, Depends(get_current_user)],
    body: RejectBody,
):
    item = domain_service.rechazar_cultivo(item_id, user.id, body.motivo)
    if not item:
        return fail("Solicitud no encontrada", 404)
    return success(item, "Cultivo rechazado")


@router.delete("/cultivos/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_cultivo(item_id: int):
    if not domain_service.delete_cultivo(item_id):
        return fail("Cultivo no encontrado", 404)
    return success(None, "Cultivo eliminado")
