from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

APISPERU_DNI_URL = "https://dniruc.apisperu.com/api/v1/dni"


def _map_dni_response(dni: str, data: dict[str, Any]) -> dict[str, Any] | None:
    if data.get("success") is False:
        return None

    nombres = (data.get("nombres") or "").strip()
    ap_paterno = (data.get("apellidoPaterno") or "").strip()
    ap_materno = (data.get("apellidoMaterno") or "").strip()
    apellidos = " ".join(part for part in (ap_paterno, ap_materno) if part).strip()
    nombre_completo = (data.get("nombreCompleto") or "").strip()
    if not nombre_completo and nombres and apellidos:
        nombre_completo = f"{apellidos} {nombres}".strip()

    if not nombres and not apellidos:
        return None

    return {
        "dni": data.get("dni") or dni,
        "nombres": nombres,
        "apellidos": apellidos,
        "apellidoPaterno": ap_paterno,
        "apellidoMaterno": ap_materno,
        "nombreCompleto": nombre_completo,
        "codVerifica": data.get("codVerifica"),
    }


async def consultar_dni(dni: str) -> dict[str, Any] | None:
    if not settings.apisperu_dni_token:
        return None
    url = f"{APISPERU_DNI_URL}/{dni}?token={settings.apisperu_dni_token}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return None
            return _map_dni_response(dni, resp.json())
    except httpx.HTTPError:
        return None
