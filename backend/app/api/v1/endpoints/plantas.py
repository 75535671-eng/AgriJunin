from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_roles
from app.core.responses import success
from app.services import plantas_service

router = APIRouter(tags=["Plantas"])


@router.get("/plantas/buscar", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def plantas_buscar(q: str = Query(..., min_length=2)):
    return success(await plantas_service.buscar(q))
