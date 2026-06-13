from __future__ import annotations

from typing import Any

from app.core.database import execute, fetch_one

ALLOWED_COLUMNS: dict[str, frozenset[str]] = {
    "agricultores": frozenset(
        {
            "usuario_id",
            "telefono",
            "direccion",
            "distrito",
            "provincia",
            "departamento",
            "hectareas_totales",
            "fecha_registro",
            "activo",
            "notas",
        }
    ),
    "cultivos": frozenset(
        {
            "nombre",
            "nombre_cientifico",
            "tipo_id",
            "temporada_id",
            "perfil_climatico_id",
            "dias_crecimiento",
            "rendimiento_promedio",
            "descripcion",
            "activo",
        }
    ),
    "lotes": frozenset(
        {
            "agricultor_id",
            "cultivo_id",
            "codigo_lote",
            "nombre",
            "ubicacion",
            "latitud",
            "longitud",
            "area_hectareas",
            "tipo_suelo_id",
            "estado",
            "fecha_siembra",
            "fecha_cosecha_est",
            "activo",
        }
    ),
    "sensores": frozenset(
        {
            "lote_id",
            "tipo_sensor_id",
            "codigo_sensor",
            "nombre",
            "unidad_medida",
            "valor_min",
            "valor_max",
            "ultima_lectura",
            "ultima_fecha",
            "estado",
            "bateria_pct",
            "activo",
        }
    ),
    "registros_agricolas": frozenset(
        {
            "lote_id",
            "fecha_registro",
            "temperatura",
            "humedad_suelo",
            "humedad_aire",
            "ph_suelo",
            "precipitacion_mm",
            "produccion_kg",
            "observaciones",
            "registrado_por",
        }
    ),
    "alertas": frozenset(
        {
            "registro_id",
            "sensor_id",
            "tipo",
            "nivel",
            "titulo",
            "mensaje",
            "leida",
            "resuelta",
            "fecha_resolucion",
        }
    ),
}


def filter_columns(table: str, data: dict[str, Any]) -> dict[str, Any]:
    allowed = ALLOWED_COLUMNS.get(table, frozenset())
    return {k: v for k, v in data.items() if k in allowed and v is not None}


def insert_row(table: str, data: dict[str, Any]) -> int:
    filtered = filter_columns(table, data)
    if not filtered:
        raise ValueError(f"Sin columnas válidas para insertar en {table}")
    keys = list(filtered.keys())
    placeholders = ", ".join(["%s"] * len(keys))
    cols = ", ".join(keys)
    execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", [filtered[k] for k in keys])
    row = fetch_one("SELECT LAST_INSERT_ID() AS id")
    return int(row["id"])


def update_row(table: str, id_: int, data: dict[str, Any]) -> None:
    filtered = filter_columns(table, data)
    if not filtered:
        return
    sets = ", ".join(f"{k} = %s" for k in filtered)
    execute(f"UPDATE {table} SET {sets} WHERE id = %s", [*filtered.values(), id_])


def delete_row(table: str, id_: int) -> bool:
    return execute(f"DELETE FROM {table} WHERE id = %s", (id_,)) > 0
