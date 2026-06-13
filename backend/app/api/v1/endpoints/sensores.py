from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope, require_roles
from app.core.responses import fail, paginated, success
from app.schemas.common import PaginationQuery
from app.schemas.entities import SensorCreate, SensorUpdate
from app.services import domain_service

router = APIRouter(tags=["Sensores"])


@router.get("/sensores", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_sensores(scope: Annotated[Scope, Depends(get_scope)], pagination: Annotated[PaginationQuery, Depends()]):
    r = domain_service.list_sensores(pagination.model_dump(), scope)
    return paginated(r["data"], r["pagination"], "Sensores obtenidos")


@router.get("/sensores/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def get_sensor(item_id: int, scope: Annotated[Scope, Depends(get_scope)]):
    item = domain_service.get_sensor(item_id, scope)
    if not item:
        return fail("Sensor no encontrado", 404)
    return success(item)


@router.post("/sensores", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def post_sensor(body: SensorCreate):
    return success(domain_service.create_sensor(body.model_dump()), "Sensor creado", status=201)


@router.put("/sensores/{item_id}", dependencies=[Depends(require_roles("administrador", "tecnico"))])
async def put_sensor(item_id: int, scope: Annotated[Scope, Depends(get_scope)], body: SensorUpdate):
    item = domain_service.update_sensor(item_id, body.model_dump(exclude_unset=True), scope)
    if not item:
        return fail("Sensor no encontrado", 404)
    return success(item, "Sensor actualizado")


@router.delete("/sensores/{item_id}", dependencies=[Depends(require_roles("administrador"))])
async def del_sensor(item_id: int):
    if not domain_service.delete_sensor(item_id):
        return fail("Sensor no encontrado", 404)
    return success(None, "Sensor eliminado")
