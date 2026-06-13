from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

CATALOGO_LOCAL = [
    {"nombre": "Papa", "nombre_cientifico": "Solanum tuberosum", "tipo": "tuberculo", "familia": "Solanaceae"},
    {"nombre": "Maíz", "nombre_cientifico": "Zea mays", "tipo": "cereal", "familia": "Poaceae"},
    {"nombre": "Haba", "nombre_cientifico": "Vicia faba", "tipo": "legumbre", "familia": "Fabaceae"},
]


def buscar_local(q: str) -> list[dict[str, Any]]:
    term = q.lower()
    return [
        {
            "perenual_id": f"local-{i}",
            "nombre": c["nombre"],
            "nombre_cientifico": c["nombre_cientifico"],
            "tipo_sugerido": c["tipo"],
            "temporada_sugerida": "todo_año",
            "familia": c["familia"],
            "descripcion_sugerida": f"Catálogo AgriJunín — {c['familia']}",
        }
        for i, c in enumerate(CATALOGO_LOCAL)
        if term in c["nombre"].lower() or term in c["nombre_cientifico"].lower()
    ]


async def buscar(q: str) -> list[dict[str, Any]]:
    results = buscar_local(q)
    if settings.trefle_api_token and len(results) < 5:
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                resp = await client.get(
                    "https://trefle.io/api/v1/plants/search",
                    params={"token": settings.trefle_api_token, "q": q},
                )
                if resp.status_code == 200:
                    for item in resp.json().get("data", [])[:5]:
                        results.append(
                            {
                                "perenual_id": str(item.get("id")),
                                "nombre": item.get("common_name") or item.get("scientific_name"),
                                "nombre_cientifico": item.get("scientific_name"),
                                "tipo_sugerido": "otro",
                                "temporada_sugerida": "todo_año",
                                "familia": (item.get("family") or ""),
                                "descripcion_sugerida": "Trefle.io",
                            }
                        )
        except Exception:
            pass
    return results
