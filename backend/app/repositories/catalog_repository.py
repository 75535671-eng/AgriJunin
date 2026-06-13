from __future__ import annotations

from typing import Any

from app.core.database import execute, fetch_one
from app.repositories.auth_repository import catalog_id


def normalize_cultivo_payload(data: dict[str, Any]) -> dict[str, Any]:
    payload = dict(data)
    if payload.get("tipo"):
        payload["tipo_id"] = catalog_id("sp_catalogo_tipo_cultivo_id", payload.pop("tipo"))
    if payload.get("temporada"):
        payload["temporada_id"] = catalog_id("sp_catalogo_temporada_id", payload.pop("temporada"))
    payload["perfil_climatico_id"] = _upsert_perfil(payload, payload.get("nombre", "Perfil cultivo"))
    for key in ("humedad_optima_min", "humedad_optima_max", "temp_optima_min", "temp_optima_max"):
        payload.pop(key, None)
    return payload


def normalize_lote_payload(data: dict[str, Any]) -> dict[str, Any]:
    payload = dict(data)
    if payload.get("tipo_suelo"):
        payload["tipo_suelo_id"] = catalog_id("sp_catalogo_tipo_suelo_id", payload.pop("tipo_suelo"))
    return payload


def normalize_sensor_payload(data: dict[str, Any]) -> dict[str, Any]:
    payload = dict(data)
    if payload.get("tipo"):
        payload["tipo_sensor_id"] = catalog_id("sp_catalogo_tipo_sensor_id", payload.pop("tipo"))
    return payload


def _upsert_perfil(data: dict[str, Any], nombre: str) -> int | None:
    if data.get("perfil_climatico_id"):
        return int(data["perfil_climatico_id"])
    fields = ["humedad_optima_min", "humedad_optima_max", "temp_optima_min", "temp_optima_max"]
    if not any(data.get(f) not in (None, "") for f in fields):
        return None
    execute(
        """INSERT INTO perfiles_climaticos
           (nombre, humedad_optima_min, humedad_optima_max, temp_optima_min, temp_optima_max)
           VALUES (%s, %s, %s, %s, %s)""",
        (
            nombre,
            data.get("humedad_optima_min"),
            data.get("humedad_optima_max"),
            data.get("temp_optima_min"),
            data.get("temp_optima_max"),
        ),
    )
    row = fetch_one("SELECT LAST_INSERT_ID() AS id")
    return int(row["id"]) if row else None
