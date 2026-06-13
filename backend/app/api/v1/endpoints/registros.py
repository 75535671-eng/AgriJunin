from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.common import PaginationQuery
from app.schemas.entities import RegistroCreate, RegistroUpdate
from app.services import domain_service

router = APIRouter(tags=["Registros"])


@router.get("/registros", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_registros(scope: Annotated[Scope, Depends(get_scope)], pagination: Annotated[PaginationQuery, Depends()]):
    r = domain_service.list_registros(pagination.model_dump(), scope)
    return paginated(r["data"], r["pagination"], "Registros obtenidos")


@router.get("/registros/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_registro(item_id: int, scope: Annotated[Scope, Depends(get_scope)]):
    item = domain_service.get_registro(item_id, scope)
    if not item:
        return fail("Registro no encontrado", 404)
    return success(item)


@router.post("/registros", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def post_registro(body: RegistroCreate):
    return success(domain_service.create_registro(body.model_dump()), "Registro creado", status=201)


@router.put("/registros/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def put_registro(item_id: int, scope: Annotated[Scope, Depends(get_scope)], body: RegistroUpdate):
    item = domain_service.update_registro(item_id, body.model_dump(exclude_unset=True), scope)
    if not item:
        return fail("Registro no encontrado", 404)
    return success(item, "Registro actualizado")


@router.delete("/registros/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_registro(item_id: int):
    if not domain_service.delete_registro(item_id):
        return fail("Registro no encontrado", 404)
    return success(None, "Registro eliminado")
