from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.deps import Scope, get_scope
from app.core.responses import success
from app.services import domain_service

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats")
async def dashboard(scope: Annotated[Scope, Depends(get_scope)]):
    return success(domain_service.dashboard_stats(scope))
