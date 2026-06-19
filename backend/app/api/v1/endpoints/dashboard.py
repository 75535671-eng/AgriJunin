from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope
from app.core.responses import success
from app.services import domain_service, weather_service

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats")
async def dashboard(scope: Annotated[Scope, Depends(get_scope)]):
    stats = domain_service.dashboard_stats(scope)
    try:
        stats["climaHuancayo"] = await weather_service.get_huancayo()
    except Exception:
        stats["climaHuancayo"] = None
    return success(stats)
