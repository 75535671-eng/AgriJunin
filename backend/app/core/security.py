from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings

BCRYPT_REGEX = re.compile(r"^\$2[aby]\$\d{2}\$.{53}$")


def is_bcrypt_hash(value: str | None) -> bool:
    return bool(value and BCRYPT_REGEX.match(value))


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=10)).decode()


def verify_password(plain: str, stored: str | None) -> bool:
    if not stored:
        return False
    if is_bcrypt_hash(stored):
        return bcrypt.checkpw(plain.encode(), stored.encode())
    return plain == stored


def create_token(user: dict[str, Any]) -> str:
    hours = 8
    if settings.jwt_expires_in.endswith("h"):
        hours = int(settings.jwt_expires_in[:-1] or 8)
    payload = {
        "id": user["id"],
        "email": user["email"],
        "rol": user["rol"],
        "nombre": user["nombre"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
