from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

CATALOGO_LOCAL = [
    {"nombre": "Papa", "nombre_cientifico": "Solanum tuberosum", "tipo": "tuberculo", "familia": "Solanaceae"},
    {"nombre": "Maíz", "nombre_cientifico": "Zea mays", "tipo": "cereal", "familia": "Poaceae"},
    {"nombre": "Haba", "nombre_cientifico": "Vicia faba", "tipo": "legumbre", "familia": "Fabaceae"},
    {"nombre": "Cebada", "nombre_cientifico": "Hordeum vulgare", "tipo": "cereal", "familia": "Poaceae"},
    {"nombre": "Zanahoria", "nombre_cientifico": "Daucus carota", "tipo": "hortaliza", "familia": "Apiaceae"},
]


def _to_especie(item: dict[str, Any], idx: int) -> dict[str, Any]:
    return {
        "perenual_id": item.get("perenual_id", idx),
        "nombre": item["nombre"],
        "nombre_cientifico": item["nombre_cientifico"],
        "tipo_sugerido": item.get("tipo_sugerido", item.get("tipo", "otro")),
        "temporada_sugerida": item.get("temporada_sugerida", "todo_año"),
        "familia": item.get("familia"),
        "ciclo": item.get("ciclo"),
        "imagen_url": item.get("imagen_url"),
        "descripcion_sugerida": item.get("descripcion_sugerida"),
    }


def buscar_local(q: str) -> list[dict[str, Any]]:
    term = q.lower()
    results: list[dict[str, Any]] = []
    for i, c in enumerate(CATALOGO_LOCAL):
        if term in c["nombre"].lower() or term in c["nombre_cientifico"].lower():
            results.append(
                _to_especie(
                    {
                        "perenual_id": 1000 + i,
                        "nombre": c["nombre"],
                        "nombre_cientifico": c["nombre_cientifico"],
                        "tipo_sugerido": c["tipo"],
                        "temporada_sugerida": "todo_año",
                        "familia": c["familia"],
                        "descripcion_sugerida": f"Catálogo AgriJunín — {c['familia']}",
                    },
                    i,
                )
            )
    return results


async def buscar(q: str) -> dict[str, Any]:
    resultados = buscar_local(q)
    fuente = "AgriJunín"

    if settings.trefle_api_token and len(resultados) < 8:
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                resp = await client.get(
                    "https://trefle.io/api/v1/plants/search",
                    params={"token": settings.trefle_api_token, "q": q},
                )
                if resp.status_code == 200:
                    fuente = "AgriJunín + Trefle.io"
                    existentes = {r["nombre_cientifico"].lower() for r in resultados}
                    for item in resp.json().get("data", [])[:8]:
                        cientifico = item.get("scientific_name") or ""
                        if cientifico.lower() in existentes:
                            continue
                        resultados.append(
                            _to_especie(
                                {
                                    "perenual_id": int(item.get("id") or 0),
                                    "nombre": item.get("common_name") or cientifico,
                                    "nombre_cientifico": cientifico,
                                    "tipo_sugerido": "otro",
                                    "temporada_sugerida": "todo_año",
                                    "familia": item.get("family") or None,
                                    "descripcion_sugerida": "Trefle.io",
                                },
                                len(resultados),
                            )
                        )
                        existentes.add(cientifico.lower())
        except Exception:
            pass

    return {
        "query": q,
        "total": len(resultados),
        "resultados": resultados,
        "fuente": fuente,
    }
