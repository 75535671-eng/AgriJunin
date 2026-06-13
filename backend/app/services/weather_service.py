from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

HUANCAYO = {"lat": -12.0464, "lng": -75.3232, "ciudad": "Huancayo", "region": "Junín"}


async def fetch_clima_huancayo() -> dict[str, Any]:
    params = {
        "latitude": HUANCAYO["lat"],
        "longitude": HUANCAYO["lng"],
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code",
        "timezone": "America/Lima",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})
        return {
            "ciudad": HUANCAYO["ciudad"],
            "region": HUANCAYO["region"],
            "temperatura": current.get("temperature_2m"),
            "humedad": current.get("relative_humidity_2m"),
            "precipitacion": current.get("precipitation"),
            "descripcion": "Clima actual Open-Meteo",
            "fuente": "Open-Meteo",
        }


async def get_huancayo() -> dict[str, Any]:
    return await fetch_clima_huancayo()
