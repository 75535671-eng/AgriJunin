from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.common import PaginationQuery
from app.schemas.entities import AgricultorCreate, AgricultorUpdate
from app.services import domain_service

router = APIRouter(tags=["Agricultores"])


@router.get("/agricultores", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def get_agricultores(pagination: Annotated[PaginationQuery, Depends()]):
    r = domain_service.list_agricultores(pagination.model_dump())
    return paginated(r["data"], r["pagination"], "Agricultores obtenidos")


@router.get("/agricultores/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def get_agricultor(item_id: int, scope: Annotated[Scope, Depends(get_scope)]):
    item = domain_service.get_agricultor(item_id, scope)
    if not item:
        return fail("Agricultor no encontrado", 404)
    return success(item)


@router.post("/agricultores", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def post_agricultor(body: AgricultorCreate):
    return success(domain_service.create_agricultor(body.model_dump()), "Agricultor creado", status=201)


@router.put("/agricultores/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def put_agricultor(item_id: int, body: AgricultorUpdate):
    item = domain_service.update_agricultor(item_id, body.model_dump(exclude_unset=True))
    if not item:
        return fail("Agricultor no encontrado", 404)
    return success(item, "Agricultor actualizado")


@router.delete("/agricultores/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_agricultor(item_id: int):
    if not domain_service.delete_agricultor(item_id):
        return fail("Agricultor no encontrado", 404)
    return success(None, "Agricultor eliminado")
