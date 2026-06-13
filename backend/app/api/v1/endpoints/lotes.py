from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.api.deps import Scope, UserContext, get_current_user, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.auth import RejectBody
from app.schemas.common import PaginationQuery
from app.schemas.entities import LoteCreate, LoteUpdate
from app.services import domain_service

router = APIRouter(tags=["Lotes"])


@router.get("/lotes", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_lotes(
    scope: Annotated[Scope, Depends(get_scope)],
    user: Annotated[UserContext, Depends(get_current_user)],
    pagination: Annotated[PaginationQuery, Depends()],
    agricultor_id: int | None = Query(default=None),
):
    query = pagination.model_dump()
    query["agricultor_id"] = agricultor_id
    r = domain_service.list_lotes(query, scope, user)
    return paginated(r["data"], r["pagination"], "Lotes obtenidos")


@router.get("/lotes/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_lote(item_id: int, scope: Annotated[Scope, Depends(get_scope)]):
    item = domain_service.get_lote(item_id, scope)
    if not item:
        return fail("Lote no encontrado", 404)
    return success(item)


@router.post("/lotes", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def post_lote(user: Annotated[UserContext, Depends(get_current_user)], body: LoteCreate):
    return success(domain_service.create_lote(body.model_dump(), user), "Lote creado", status=201)


@router.put("/lotes/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def put_lote(
    item_id: int,
    user: Annotated[UserContext, Depends(get_current_user)],
    scope: Annotated[Scope, Depends(get_scope)],
    body: LoteUpdate,
):
    item = domain_service.update_lote(item_id, body.model_dump(exclude_unset=True), user, scope)
    if not item:
        return fail("Lote no encontrado", 404)
    return success(item, "Lote actualizado")


@router.patch("/lotes/{item_id}/aprobar", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def patch_aprobar_lote(item_id: int, user: Annotated[UserContext, Depends(get_current_user)]):
    item = domain_service.aprobar_lote(item_id, user.id)
    if not item:
        return fail("Solicitud no encontrada", 404)
    return success(item, "Lote aprobado")


@router.patch("/lotes/{item_id}/rechazar", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def patch_rechazar_lote(
    item_id: int,
    user: Annotated[UserContext, Depends(get_current_user)],
    body: RejectBody,
):
    item = domain_service.rechazar_lote(item_id, user.id, body.motivo)
    if not item:
        return fail("Solicitud no encontrada", 404)
    return success(item, "Lote rechazado")


@router.delete("/lotes/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_lote(item_id: int):
    if not domain_service.delete_lote(item_id):
        return fail("Lote no encontrado", 404)
    return success(None, "Lote eliminado")
