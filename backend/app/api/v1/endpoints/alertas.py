from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.common import PaginationQuery
from app.schemas.entities import AlertaCreate, AlertaUpdate
from app.services import domain_service

router = APIRouter(tags=["Alertas"])


@router.get("/alertas", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_alertas(scope: Annotated[Scope, Depends(get_scope)], pagination: Annotated[PaginationQuery, Depends()]):
    r = domain_service.list_alertas(pagination.model_dump(), scope)
    return paginated(r["data"], r["pagination"], "Alertas obtenidas")


@router.get("/alertas/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_alerta(item_id: int, scope: Annotated[Scope, Depends(get_scope)]):
    item = domain_service.get_alerta(item_id, scope)
    if not item:
        return fail("Alerta no encontrada", 404)
    return success(item)


@router.post("/alertas", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def post_alerta(body: AlertaCreate):
    return success(domain_service.create_alerta(body.model_dump()), "Alerta creada", status=201)


@router.put("/alertas/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def put_alerta(item_id: int, scope: Annotated[Scope, Depends(get_scope)], body: AlertaUpdate):
    item = domain_service.update_alerta(item_id, body.model_dump(exclude_unset=True), scope)
    if not item:
        return fail("Alerta no encontrada", 404)
    return success(item, "Alerta actualizada")


@router.delete("/alertas/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_alerta(item_id: int):
    if not domain_service.delete_alerta(item_id):
        return fail("Alerta no encontrada", 404)
    return success(None, "Alerta eliminada")
