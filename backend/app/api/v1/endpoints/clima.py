from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import Scope, UserContext, get_current_user, get_scope, require_roles
from app.core.responses import fail, success
from app.services import weather_service

router = APIRouter(tags=["Clima"])


class SyncBody(BaseModel):
    lote_id: int | None = None
    todos: bool = False


@router.get("/clima/huancayo")
async def clima_huancayo():
    try:
        return success(await weather_service.get_huancayo())
    except Exception as exc:
        return fail(f"No se pudo obtener el clima: {exc}", 502)


@router.post(
    "/clima/sincronizar",
    dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))],
)
async def clima_sincronizar(
    scope: Annotated[Scope, Depends(get_scope)],
    user: Annotated[UserContext, Depends(get_current_user)],
    body: SyncBody | None = None,
):
    payload = body or SyncBody()
    todos = payload.todos or (
        scope.rol in ("administrador", "tecnico") and payload.lote_id is None
    )
    try:
        data = await weather_service.sincronizar_clima(
            scope,
            user.id,
            lote_id=payload.lote_id,
            todos=todos,
        )
        return success(data, "Clima sincronizado correctamente")
    except ValueError as exc:
        return fail(str(exc), 400)
    except Exception as exc:
        return fail(f"Error al sincronizar: {exc}", 500)
