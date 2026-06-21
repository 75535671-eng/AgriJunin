from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.context import Scope
from app.core.database import call_proc, fetch_all, fetch_one
from app.core.scope import lotes_agricultor_clause

HUANCAYO = {
    "lat": -12.0464,
    "lng": -75.3232,
    "ciudad": "Huancayo",
    "region": "Junín",
    "pais": "Perú",
    "elevacion_m": 3278,
}

WMO_DESCRIPTIONS: dict[int, str] = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna intensa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    71: "Nevada ligera",
    73: "Nevada moderada",
    75: "Nevada intensa",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos fuertes",
    95: "Tormenta eléctrica",
}


def _wmo_description(code: int | None) -> str:
    if code is None:
        return "Condición desconocida"
    return WMO_DESCRIPTIONS.get(code, f"Código meteorológico {code}")


def _parse_open_meteo(data: dict[str, Any]) -> dict[str, Any]:
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    now = datetime.now(timezone.utc).isoformat()

    code = current.get("weather_code")
    soil_series = hourly.get("soil_moisture_0_to_1cm") or []
    soil_current = next((v for v in soil_series if v is not None), None)

    pronostico_horario: list[dict[str, Any]] = []
    times = hourly.get("time") or []
    temps = hourly.get("temperature_2m") or []
    hums = hourly.get("relative_humidity_2m") or []
    rains = hourly.get("precipitation") or []
    soils = hourly.get("soil_moisture_0_to_1cm") or []
    for i in range(min(24, len(times))):
        pronostico_horario.append(
            {
                "hora": times[i],
                "temperatura": temps[i] if i < len(temps) else None,
                "humedad": hums[i] if i < len(hums) else None,
                "precipitacion": rains[i] if i < len(rains) else 0,
                "humedad_suelo": soils[i] if i < len(soils) else None,
            }
        )

    pronostico_diario: list[dict[str, Any]] = []
    d_times = daily.get("time") or []
    d_max = daily.get("temperature_2m_max") or []
    d_min = daily.get("temperature_2m_min") or []
    d_rain = daily.get("precipitation_sum") or []
    d_codes = daily.get("weather_code") or []
    for i in range(len(d_times)):
        d_code = d_codes[i] if i < len(d_codes) else None
        pronostico_diario.append(
            {
                "fecha": d_times[i],
                "temp_max": d_max[i] if i < len(d_max) else None,
                "temp_min": d_min[i] if i < len(d_min) else None,
                "precipitacion_mm": d_rain[i] if i < len(d_rain) else 0,
                "descripcion": _wmo_description(d_code),
                "codigo": d_code,
            }
        )

    return {
        "ubicacion": {
            "ciudad": HUANCAYO["ciudad"],
            "region": HUANCAYO["region"],
            "pais": HUANCAYO["pais"],
            "latitud": HUANCAYO["lat"],
            "longitud": HUANCAYO["lng"],
            "elevacion_m": HUANCAYO["elevacion_m"],
            "actualizado": now,
        },
        "actual": {
            "temperatura": current.get("temperature_2m"),
            "sensacion_termica": current.get("apparent_temperature") or current.get("temperature_2m"),
            "humedad": current.get("relative_humidity_2m"),
            "precipitacion": current.get("precipitation") or 0,
            "viento_kmh": round(float(current.get("wind_speed_10m") or 0), 1),
            "codigo_clima": code,
            "descripcion": _wmo_description(code),
            "humedad_suelo_estimada": soil_current,
        },
        "pronosticoHorario": pronostico_horario,
        "pronosticoDiario": pronostico_diario,
        "fuente": "Open-Meteo",
        "licencia": "CC BY 4.0",
    }


async def fetch_clima_huancayo() -> dict[str, Any]:
    params = {
        "latitude": HUANCAYO["lat"],
        "longitude": HUANCAYO["lng"],
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,apparent_temperature",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_1cm",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "America/Lima",
        "forecast_days": 7,
        "wind_speed_unit": "kmh",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        return _parse_open_meteo(resp.json())


async def get_huancayo() -> dict[str, Any]:
    return await fetch_clima_huancayo()


def _lotes_para_sync(scope: Scope, lote_id: int | None, todos: bool) -> list[dict[str, Any]]:
    sql = """
        SELECT l.id, l.nombre, l.agricultor_id, c.nombre AS cultivo_nombre,
               pc.humedad_optima_min, pc.humedad_optima_max,
               pc.temp_optima_min, pc.temp_optima_max
        FROM lotes l
        LEFT JOIN cultivos c ON l.cultivo_id = c.id
        LEFT JOIN perfiles_climaticos pc ON c.perfil_climatico_id = pc.id
        WHERE l.activo = 1
    """
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    sql += sf.clause
    params.extend(sf.params)
    if lote_id:
        sql += " AND l.id = %s"
        params.append(lote_id)
    elif not todos and scope.rol == "agricultor":
        sql += " LIMIT 1"
    sql += " ORDER BY l.id ASC"
    return fetch_all(sql, params)


def _sensor_lectura(tipo: str, temp: float, humedad_aire: float, humedad_suelo: float, precip: float) -> float | None:
    t = (tipo or "").lower()
    if "temp" in t:
        return temp
    if "humedad" in t or "humed" in t:
        return humedad_suelo
    if "pluv" in t or "lluv" in t or "precip" in t:
        return precip
    if "multi" in t:
        return temp
    return None


def _alerta_abierta_existe(lote_id: int, tipo: str, nivel: str) -> int | None:
    row = fetch_one(
        """SELECT al.id FROM alertas al
           LEFT JOIN registros_agricolas r ON al.registro_id = r.id
           LEFT JOIN sensores s ON al.sensor_id = s.id
           WHERE al.tipo = %s AND al.nivel = %s AND al.resuelta = 0
             AND COALESCE(r.lote_id, s.lote_id) = %s
           ORDER BY al.id DESC LIMIT 1""",
        (tipo, nivel, lote_id),
    )
    return int(row["id"]) if row else None


def _crear_alerta_si_nueva(
    lote_id: int,
    registro_id: int,
    tipo: str,
    nivel: str,
    titulo: str,
    mensaje: str,
) -> dict[str, Any] | None:
    existing = _alerta_abierta_existe(lote_id, tipo, nivel)
    if existing:
        return {"id": existing, "tipo": tipo, "nivel": nivel, "duplicada": True}
    rows = call_proc(
        "sp_alerta_crear",
        (registro_id, None, tipo, nivel, titulo, mensaje),
    )
    return {"id": int(rows[0]["alerta_id"]), "tipo": tipo, "nivel": nivel}


def _generar_alertas(
    registro_id: int,
    lote: dict[str, Any],
    temp: float,
    humedad_suelo: float,
    precip: float,
) -> list[dict[str, Any]]:
    alertas: list[dict[str, Any]] = []
    h_min = lote.get("humedad_optima_min")
    h_max = lote.get("humedad_optima_max")
    t_min = lote.get("temp_optima_min")
    t_max = lote.get("temp_optima_max")

    lote_id = int(lote["id"])

    if h_min is not None and humedad_suelo < float(h_min):
        created = _crear_alerta_si_nueva(
            lote_id,
            registro_id,
            "humedad",
            "critica",
            f"Humedad crítica en {lote['nombre']}",
            f"La humedad del suelo ({humedad_suelo:.1f}%) está por debajo del mínimo óptimo ({h_min}%).",
        )
        if created:
            alertas.append(created)
    elif h_max is not None and humedad_suelo > float(h_max):
        created = _crear_alerta_si_nueva(
            lote_id,
            registro_id,
            "humedad",
            "advertencia",
            f"Humedad elevada en {lote['nombre']}",
            f"La humedad del suelo ({humedad_suelo:.1f}%) supera el máximo óptimo ({h_max}%).",
        )
        if created:
            alertas.append(created)

    if t_min is not None and temp < float(t_min):
        created = _crear_alerta_si_nueva(
            lote_id,
            registro_id,
            "temperatura",
            "advertencia",
            f"Temperatura baja en {lote['nombre']}",
            f"Temperatura {temp:.1f}°C por debajo del rango óptimo ({t_min}°C).",
        )
        if created:
            alertas.append(created)
    elif t_max is not None and temp > float(t_max):
        created = _crear_alerta_si_nueva(
            lote_id,
            registro_id,
            "temperatura",
            "advertencia",
            f"Temperatura alta en {lote['nombre']}",
            f"Temperatura {temp:.1f}°C por encima del rango óptimo ({t_max}°C).",
        )
        if created:
            alertas.append(created)

    if precip >= 10:
        created = _crear_alerta_si_nueva(
            lote_id,
            registro_id,
            "pluvia",
            "advertencia",
            "Precipitación elevada",
            f"Se registraron {precip:.1f} mm de lluvia. Monitorear drenaje del lote.",
        )
        if created:
            alertas.append(created)

    return alertas


def _sync_lote(lote: dict[str, Any], clima: dict[str, Any], user_id: int) -> dict[str, Any]:
    actual = clima["actual"]
    temp = float(actual.get("temperatura") or 0)
    humedad_aire = float(actual.get("humedad") or 0)
    soil_frac = actual.get("humedad_suelo_estimada")
    humedad_suelo = float(soil_frac * 100) if soil_frac is not None else humedad_aire
    precip = float(actual.get("precipitacion") or 0)

    rows = call_proc(
        "sp_registro_crear",
        (
            lote["id"],
            None,
            temp,
            humedad_suelo,
            humedad_aire,
            None,
            precip,
            None,
            f"Sincronización automática con clima Open-Meteo — {HUANCAYO['ciudad']}",
            user_id,
        ),
    )
    registro_id = int(rows[0]["registro_id"])

    sensores = fetch_all(
        """SELECT s.id, s.codigo_sensor, ts.codigo AS tipo
           FROM sensores s
           INNER JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id
           WHERE s.lote_id = %s AND s.estado IN ('activo', 'mantenimiento')""",
        (lote["id"],),
    )
    sensores_actualizados: list[dict[str, Any]] = []
    for sensor in sensores:
        lectura = _sensor_lectura(sensor["tipo"], temp, humedad_aire, humedad_suelo, precip)
        if lectura is None:
            continue
        call_proc("sp_sensor_actualizar_lectura", (sensor["id"], lectura))
        sensores_actualizados.append(
            {
                "sensor_id": sensor["id"],
                "codigo": sensor["codigo_sensor"],
                "lectura": lectura,
            }
        )

    alertas = _generar_alertas(registro_id, lote, temp, humedad_suelo, precip)

    return {
        "lote_id": lote["id"],
        "lote_nombre": lote["nombre"],
        "registro_id": registro_id,
        "sensores_actualizados": len(sensores_actualizados),
        "sensores": sensores_actualizados,
        "alertas_generadas": len(alertas),
        "alertas": alertas,
    }


async def sincronizar_clima(
    scope: Scope,
    user_id: int,
    lote_id: int | None = None,
    todos: bool = False,
) -> dict[str, Any]:
    clima = await fetch_clima_huancayo()
    lotes = _lotes_para_sync(scope, lote_id, todos)
    if not lotes:
        if scope.rol == "agricultor" and scope.agricultor_id:
            fallback = fetch_one(
                "SELECT id, nombre, agricultor_id FROM lotes WHERE agricultor_id = %s AND activo = 1 ORDER BY id LIMIT 1",
                (scope.agricultor_id,),
            )
            if fallback:
                lotes = [fallback]
        if not lotes:
            raise ValueError("No hay lotes activos para sincronizar")

    detalles = [_sync_lote(lote, clima, user_id) for lote in lotes]

    if len(detalles) == 1 and not todos:
        sync = detalles[0]
    else:
        sync = {
            "todos_lotes": True,
            "lotes_procesados": len(detalles),
            "total_sensores_actualizados": sum(d["sensores_actualizados"] for d in detalles),
            "total_alertas_generadas": sum(d["alertas_generadas"] for d in detalles),
            "lotes": detalles,
            **detalles[0],
        }

    return {"clima": clima, "sincronizacion": sync}
