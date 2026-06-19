from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

HUANCAYO_CENTER = {"lat": -12.0464, "lng": -75.3232}


def maps_config() -> dict[str, Any]:
    return {
        "apiKey": settings.google_maps_api_key or "",
        "centro": {
            "lat": HUANCAYO_CENTER["lat"],
            "lng": HUANCAYO_CENTER["lng"],
            "etiqueta": "Huancayo, Junín",
        },
        "origenRuta": "Centro de Huancayo",
    }


async def directions(lat: float, lng: float) -> dict[str, Any]:
    if not settings.google_maps_api_key:
        return {"error": "Google Maps API key no configurada"}
    params = {
        "origin": f"{HUANCAYO_CENTER['lat']},{HUANCAYO_CENTER['lng']}",
        "destination": f"{lat},{lng}",
        "key": settings.google_maps_api_key,
        "language": "es",
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://maps.googleapis.com/maps/api/directions/json", params=params)
        data = resp.json()

    if data.get("status") != "OK" or not data.get("routes"):
        return {"error": data.get("error_message") or data.get("status") or "Ruta no disponible"}

    route = data["routes"][0]
    leg = route["legs"][0]
    start = leg["start_location"]
    end = leg["end_location"]
    return {
        "origen_referencia": "Centro de Huancayo",
        "origen": {
            "lat": start["lat"],
            "lng": start["lng"],
            "direccion": leg.get("start_address", "Huancayo, Junín"),
        },
        "destino": {
            "lat": end["lat"],
            "lng": end["lng"],
            "direccion": leg.get("end_address", f"{lat}, {lng}"),
        },
        "distancia": leg["distance"]["text"],
        "distancia_metros": leg["distance"]["value"],
        "duracion": leg["duration"]["text"],
        "duracion_segundos": leg["duration"]["value"],
        "polyline": route["overview_polyline"]["points"],
    }


async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    if not settings.google_maps_api_key:
        return {"direccion": f"Lat {lat:.6f}, Lng {lng:.6f}", "place_id": None}
    params = {"latlng": f"{lat},{lng}", "key": settings.google_maps_api_key, "language": "es"}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get("https://maps.googleapis.com/maps/api/geocode/json", params=params)
        data = resp.json()

    results = data.get("results") or []
    if not results:
        return {"direccion": f"Lat {lat:.6f}, Lng {lng:.6f}", "place_id": None}
    first = results[0]
    return {
        "direccion": first.get("formatted_address", f"Lat {lat:.6f}, Lng {lng:.6f}"),
        "place_id": first.get("place_id"),
    }
