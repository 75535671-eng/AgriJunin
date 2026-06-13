from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    agricultores,
    alertas,
    auth,
    clima,
    cultivos,
    dashboard,
    lotes,
    maps,
    plantas,
    registros,
    sensores,
)

router = APIRouter()
router.include_router(auth.router)
router.include_router(dashboard.router)
router.include_router(clima.router)
router.include_router(maps.router)
router.include_router(plantas.router)
router.include_router(agricultores.router)
router.include_router(cultivos.router)
router.include_router(lotes.router)
router.include_router(sensores.router)
router.include_router(registros.router)
router.include_router(alertas.router)
