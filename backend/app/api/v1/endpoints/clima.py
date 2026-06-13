from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.deps import require_roles
from app.core.responses import success
from app.services import weather_service

router = APIRouter(tags=["Clima"])


@router.get("/clima/huancayo")
async def clima_huancayo():
    return success(await weather_service.get_huancayo())


@router.post("/clima/sincronizar", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def clima_sincronizar():
    return success({"mensaje": "Sincronización disponible en próxima iteración"}, "Clima consultado")
