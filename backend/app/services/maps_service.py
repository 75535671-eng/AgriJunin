from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

HUANCAYO_CENTER = {"lat": -12.0464, "lng": -75.3232}
OSM_HEADERS = {"User-Agent": "AgriJunin/2.0 (agricultura inteligente Junin)"}


def maps_config() -> dict[str, Any]:
    return {
        "apiKey": settings.google_maps_api_key or "",
        "provider": "google" if settings.google_maps_api_key else "osm",
        "centro": {
            "lat": HUANCAYO_CENTER["lat"],
            "lng": HUANCAYO_CENTER["lng"],
            "etiqueta": "Huancayo, Junín",
        },
        "origenRuta": "Centro de Huancayo",
    }


def _format_distance(meters: float) -> str:
    if meters >= 1000:
        return f"{meters / 1000:.1f} km"
    return f"{int(meters)} m"


def _format_duration(seconds: float) -> str:
    minutes = max(1, int(round(seconds / 60)))
    if minutes < 60:
        return f"{minutes} min"
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours} h {mins} min" if mins else f"{hours} h"


async def _reverse_geocode_nominatim(lat: float, lng: float) -> dict[str, Any]:
    params = {"lat": lat, "lon": lng, "format": "json", "accept-language": "es"}
    async with httpx.AsyncClient(timeout=15, headers=OSM_HEADERS) as client:
        resp = await client.get("https://nominatim.openstreetmap.org/reverse", params=params)
        resp.raise_for_status()
        data = resp.json()
    address = data.get("display_name") or f"Lat {lat:.6f}, Lng {lng:.6f}"
    return {"direccion": address, "place_id": str(data.get("place_id") or "")}


async def _directions_osrm(lat: float, lng: float) -> dict[str, Any]:
    origin = f"{HUANCAYO_CENTER['lng']},{HUANCAYO_CENTER['lat']}"
    dest = f"{lng},{lat}"
    url = f"https://router.project-osrm.org/route/v1/driving/{origin};{dest}"
    params = {"overview": "full", "geometries": "polyline", "steps": "false"}
    async with httpx.AsyncClient(timeout=20, headers=OSM_HEADERS) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    if data.get("code") != "Ok" or not data.get("routes"):
        return {"error": "Ruta no disponible (OSRM)"}

    route = data["routes"][0]
    meters = float(route.get("distance") or 0)
    seconds = float(route.get("duration") or 0)
    dest_geo = await _reverse_geocode_nominatim(lat, lng)
    return {
        "origen_referencia": "Centro de Huancayo",
        "origen": {
            "lat": HUANCAYO_CENTER["lat"],
            "lng": HUANCAYO_CENTER["lng"],
            "direccion": "Huancayo, Junín",
        },
        "destino": {
            "lat": lat,
            "lng": lng,
            "direccion": dest_geo["direccion"],
        },
        "distancia": _format_distance(meters),
        "distancia_metros": int(meters),
        "duracion": _format_duration(seconds),
        "duracion_segundos": int(seconds),
        "polyline": route.get("geometry"),
        "fuente": "OpenStreetMap / OSRM",
    }


async def directions(lat: float, lng: float) -> dict[str, Any]:
    if settings.google_maps_api_key:
        params = {
            "origin": f"{HUANCAYO_CENTER['lat']},{HUANCAYO_CENTER['lng']}",
            "destination": f"{lat},{lng}",
            "key": settings.google_maps_api_key,
            "language": "es",
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get("https://maps.googleapis.com/maps/api/directions/json", params=params)
                data = resp.json()

            if data.get("status") == "OK" and data.get("routes"):
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
                    "fuente": "Google Maps",
                }
        except httpx.HTTPError:
            pass

    try:
        return await _directions_osrm(lat, lng)
    except httpx.HTTPError:
        return {"error": "No se pudo calcular la ruta"}


async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    if settings.google_maps_api_key:
        params = {"latlng": f"{lat},{lng}", "key": settings.google_maps_api_key, "language": "es"}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get("https://maps.googleapis.com/maps/api/geocode/json", params=params)
                data = resp.json()

            results = data.get("results") or []
            if results:
                first = results[0]
                return {
                    "direccion": first.get("formatted_address", f"Lat {lat:.6f}, Lng {lng:.6f}"),
                    "place_id": first.get("place_id"),
                    "fuente": "Google Maps",
                }
        except httpx.HTTPError:
            pass

    try:
        result = await _reverse_geocode_nominatim(lat, lng)
        result["fuente"] = "OpenStreetMap"
        return result
    except httpx.HTTPError:
        return {"direccion": f"Lat {lat:.6f}, Lng {lng:.6f}", "place_id": None, "fuente": "coordenadas"}
