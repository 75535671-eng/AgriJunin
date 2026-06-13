from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

HUANCAYO_CENTER = {"lat": -12.0464, "lng": -75.3232}


def maps_config() -> dict[str, Any]:
    return {"apiKey": settings.google_maps_api_key or None, "center": HUANCAYO_CENTER}


async def directions(lat: float, lng: float) -> dict[str, Any]:
    if not settings.google_maps_api_key:
        return {"error": "Google Maps API key no configurada"}
    params = {
        "origin": f"{HUANCAYO_CENTER['lat']},{HUANCAYO_CENTER['lng']}",
        "destination": f"{lat},{lng}",
        "key": settings.google_maps_api_key,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://maps.googleapis.com/maps/api/directions/json", params=params)
        return resp.json()


async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    if not settings.google_maps_api_key:
        return {"error": "Google Maps API key no configurada"}
    params = {"latlng": f"{lat},{lng}", "key": settings.google_maps_api_key}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://maps.googleapis.com/maps/api/geocode/json", params=params)
        return resp.json()
