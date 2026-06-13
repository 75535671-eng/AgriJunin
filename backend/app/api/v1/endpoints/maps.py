from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.api.deps import require_roles
from app.core.responses import success
from app.services import maps_service

router = APIRouter(tags=["Mapas"])


@router.get("/maps/config", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def maps_config():
    return success(maps_service.maps_config())


@router.get("/maps/directions", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def maps_directions(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    return success(await maps_service.directions(lat, lng))


@router.get("/maps/geocode", dependencies=[Depends(require_roles("administrador", "tecnico", "agricultor"))])
async def maps_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    return success(await maps_service.reverse_geocode(lat, lng))
