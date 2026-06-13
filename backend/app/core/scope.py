from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.core.context import Scope


@dataclass
class ScopeFilter:
    clause: str
    params: list[Any]


def lotes_agricultor_clause(scope: Scope | None, alias: str = "l") -> ScopeFilter:
    if not scope or scope.rol != "agricultor":
        return ScopeFilter("", [])
    if scope.agricultor_id:
        return ScopeFilter(f" AND {alias}.agricultor_id = %s", [scope.agricultor_id])
    return ScopeFilter(" AND 1=0", [])


def can_access_lote(lote: dict[str, Any] | None, scope: Scope | None) -> bool:
    if not scope or scope.rol != "agricultor":
        return True
    if not lote:
        return False
    return scope.agricultor_id is not None and int(lote.get("agricultor_id", 0)) == int(scope.agricultor_id)
