from __future__ import annotations

from dataclasses import dataclass


@dataclass
class UserContext:
    id: int
    email: str
    rol: str
    nombre: str


@dataclass
class Scope:
    rol: str
    user_id: int
    agricultor_id: int | None
