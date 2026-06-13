from __future__ import annotations

import math
from typing import Any

from app.core.context import Scope, UserContext
from app.core.database import call_proc, fetch_all, fetch_one
from app.core.scope import lotes_agricultor_clause
from app.repositories import domain_repository, solicitudes_repository
from app.repositories.catalog_repository import (
    normalize_cultivo_payload,
    normalize_lote_payload,
    normalize_sensor_payload,
)

CULTIVO_JOINS = """
  LEFT JOIN tipos_cultivo tc ON c.tipo_id = tc.id
  LEFT JOIN temporadas_cultivo tmc ON c.temporada_id = tmc.id
  LEFT JOIN perfiles_climaticos pc ON c.perfil_climatico_id = pc.id
"""

SOL_JOIN_CULTIVO = """
  LEFT JOIN solicitudes_aprobacion sol ON sol.entidad_tipo = 'cultivo' AND sol.entidad_id = c.id
    AND sol.id = (SELECT MAX(s2.id) FROM solicitudes_aprobacion s2
                  WHERE s2.entidad_tipo = 'cultivo' AND s2.entidad_id = c.id)
"""

SOL_JOIN_LOTE = """
  LEFT JOIN solicitudes_aprobacion sol ON sol.entidad_tipo = 'lote' AND sol.entidad_id = l.id
    AND sol.id = (SELECT MAX(s2.id) FROM solicitudes_aprobacion s2
                  WHERE s2.entidad_tipo = 'lote' AND s2.entidad_id = l.id)
"""


def paginate(page: int, limit: int, total: int) -> dict[str, int]:
    return {"page": page, "limit": limit, "total": total, "totalPages": math.ceil(total / limit) if limit else 0}


# ---------- Dashboard ----------
ROLE_META = {
    "administrador": ("Panel administrador", "Vista global del sistema."),
    "tecnico": ("Panel técnico", "Monitoreo de campo de todos los agricultores."),
    "agricultor": ("Mi parcela", "Resumen de sus lotes, sensores y alertas."),
}


def dashboard_stats(scope: Scope) -> dict[str, Any]:
    ag_id = scope.agricultor_id if scope.rol == "agricultor" else None
    kpis_row = call_proc("sp_dashboard_kpis", (ag_id,))[0]
    lot_filter = lotes_agricultor_clause(scope)
    params = lot_filter.params

    produccion = fetch_all(
        f"""SELECT DATE(r.fecha_registro) AS fecha, COALESCE(SUM(r.produccion_kg),0) AS produccion
            FROM registros_agricolas r JOIN lotes l ON r.lote_id = l.id
            WHERE r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY){lot_filter.clause}
            GROUP BY DATE(r.fecha_registro) ORDER BY fecha ASC""",
        params,
    )
    alertas_nivel = fetch_all(
        f"""SELECT al.nivel, COUNT(*) AS cantidad FROM alertas al
            LEFT JOIN registros_agricolas r ON al.registro_id = r.id
            LEFT JOIN sensores s ON al.sensor_id = s.id
            LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
            WHERE al.resuelta = 0 AND (l.id IS NOT NULL OR al.tipo = 'sistema'){lot_filter.clause}
            GROUP BY al.nivel""",
        params,
    )
    cultivos_tipo = fetch_all(
        f"""SELECT tc.codigo AS tipo, COUNT(DISTINCT c.id) AS cantidad
            FROM cultivos c INNER JOIN tipos_cultivo tc ON c.tipo_id = tc.id
            INNER JOIN lotes l ON l.cultivo_id = c.id AND l.activo = 1
            WHERE c.activo = 1{lot_filter.clause if scope.rol == 'agricultor' else ''}
            GROUP BY tc.codigo"""
        if scope.rol == "agricultor"
        else """SELECT tc.codigo AS tipo, COUNT(*) AS cantidad FROM cultivos c
                INNER JOIN tipos_cultivo tc ON c.tipo_id = tc.id WHERE c.activo = 1 GROUP BY tc.codigo""",
        params if scope.rol == "agricultor" else [],
    )
    sensores_estado = fetch_all(
        f"""SELECT s.estado, COUNT(*) AS cantidad FROM sensores s
            INNER JOIN lotes l ON s.lote_id = l.id WHERE 1=1{lot_filter.clause} GROUP BY s.estado""",
        params,
    )
    ultimas = fetch_all(
        f"""SELECT al.*, COALESCE(r.lote_id, s.lote_id) AS lote_id, l.nombre AS lote_nombre,
                   s.codigo_sensor, s.nombre AS sensor_nombre
            FROM alertas al
            LEFT JOIN registros_agricolas r ON al.registro_id = r.id
            LEFT JOIN sensores s ON al.sensor_id = s.id
            LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
            WHERE (l.id IS NOT NULL OR al.tipo = 'sistema'){lot_filter.clause}
            ORDER BY al.fecha_alerta DESC LIMIT 5""",
        params,
    )
    prod_total = fetch_one(
        f"""SELECT COALESCE(SUM(r.produccion_kg),0) AS total FROM registros_agricolas r
            JOIN lotes l ON r.lote_id = l.id
            WHERE r.fecha_registro >= DATE_SUB(NOW(), INTERVAL 7 DAY){lot_filter.clause}""",
        params,
    )
    titulo, desc = ROLE_META.get(scope.rol, ROLE_META["administrador"])
    return {
        "climaHuancayo": None,
        "contexto": {
            "rol": scope.rol,
            "titulo": titulo,
            "descripcion": desc,
            "agricultorVinculado": scope.rol != "agricultor" or bool(scope.agricultor_id),
            "flujo": [],
        },
        "kpis": {
            "totalAgricultores": kpis_row.get("total_agricultores", 0),
            "totalCultivos": kpis_row.get("total_cultivos", 0),
            "sensoresActivos": kpis_row.get("total_sensores", 0),
            "alertasCriticas": kpis_row.get("alertas_criticas", 0),
            "totalLotes": kpis_row.get("total_lotes", 0),
            "totalRegistros": kpis_row.get("total_registros", 0),
            "produccionSemanalKg": prod_total["total"] if prod_total else 0,
        },
        "produccionSemanal": produccion,
        "alertasPorNivel": alertas_nivel,
        "cultivosPorTipo": cultivos_tipo,
        "sensoresPorEstado": sensores_estado,
        "ultimasAlertas": ultimas,
    }


# ---------- Generic CRUD helpers ----------
def _insert(table: str, data: dict[str, Any]) -> int:
    return domain_repository.insert_row(table, data)


def _update(table: str, id_: int, data: dict[str, Any]) -> None:
    domain_repository.update_row(table, id_, data)


# ---------- Lotes ----------
def list_lotes(query: dict[str, Any], scope: Scope, user: UserContext | None) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = f"""SELECT l.*, ts.codigo AS tipo_suelo, COALESCE(sol.estado,'aprobado') AS estado_aprobacion,
                     sol.solicitado_por, u.nombre AS agricultor_nombre, c.nombre AS cultivo_nombre
              FROM lotes l
              LEFT JOIN tipos_suelo ts ON l.tipo_suelo_id = ts.id
              LEFT JOIN agricultores a ON l.agricultor_id = a.id
              LEFT JOIN usuarios u ON a.usuario_id = u.id
              LEFT JOIN cultivos c ON l.cultivo_id = c.id {SOL_JOIN_LOTE} WHERE 1=1"""
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    sql += sf.clause
    params.extend(sf.params)
    if query.get("agricultor_id"):
        sql += " AND l.agricultor_id = %s"
        params.append(query["agricultor_id"])
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) t", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY l.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_lote(id_: int, scope: Scope) -> dict[str, Any] | None:
    row = fetch_one(
        f"""SELECT l.*, ts.codigo AS tipo_suelo, COALESCE(sol.estado,'aprobado') AS estado_aprobacion,
                   sol.solicitado_por, u.nombre AS agricultor_nombre
            FROM lotes l LEFT JOIN tipos_suelo ts ON l.tipo_suelo_id = ts.id
            LEFT JOIN agricultores a ON l.agricultor_id = a.id
            LEFT JOIN usuarios u ON a.usuario_id = u.id {SOL_JOIN_LOTE} WHERE l.id = %s""",
        (id_,),
    )
    from app.core.scope import can_access_lote
    return row if row and can_access_lote(row, scope) else None


def create_lote(data: dict[str, Any], user: UserContext) -> dict[str, Any]:
    payload = normalize_lote_payload(data)
    payload["activo"] = 0 if user.rol == "agricultor" else payload.get("activo", 1)
    new_id = _insert("lotes", {k: v for k, v in payload.items() if v is not None})
    if user.rol == "agricultor":
        solicitudes_repository.create_solicitud("lote", new_id, user.id)
    return get_lote(new_id, Scope(user.rol, user.id, None)) or {"id": new_id}


def update_lote(id_: int, data: dict[str, Any], user: UserContext, scope: Scope) -> dict[str, Any] | None:
    existing = get_lote(id_, scope)
    if not existing:
        return None
    payload = normalize_lote_payload(data)
    if user.rol == "agricultor":
        if existing.get("solicitado_por") != user.id or existing.get("estado_aprobacion") != "pendiente":
            return None
        payload.pop("activo", None)
    _update("lotes", id_, {k: v for k, v in payload.items() if v is not None})
    return get_lote(id_, scope)


def aprobar_lote(id_: int, revisor_id: int) -> dict[str, Any] | None:
    if solicitudes_repository.aprobar("lote", id_, revisor_id):
        return get_lote(id_, Scope("administrador", revisor_id, None))
    return None


def rechazar_lote(id_: int, revisor_id: int, motivo: str | None) -> dict[str, Any] | None:
    if solicitudes_repository.rechazar("lote", id_, revisor_id, motivo):
        return get_lote(id_, Scope("administrador", revisor_id, None))
    return None


def delete_lote(id_: int) -> bool:
    return domain_repository.delete_row("lotes", id_)


# ---------- Cultivos (similar pattern, abbreviated list) ----------
def list_cultivos(query: dict[str, Any], scope: Scope) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = f"""SELECT c.*, tc.codigo AS tipo, tmc.codigo AS temporada,
                     pc.humedad_optima_min, pc.humedad_optima_max, pc.temp_optima_min, pc.temp_optima_max,
                     COALESCE(sol.estado,'aprobado') AS estado_aprobacion, sol.solicitado_por
              FROM cultivos c {CULTIVO_JOINS} {SOL_JOIN_CULTIVO} WHERE 1=1"""
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    if sf.clause:
        sql += f" AND EXISTS (SELECT 1 FROM lotes l WHERE l.cultivo_id = c.id AND l.activo = 1{sf.clause})"
        params.extend(sf.params)
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) AS sub", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY c.nombre ASC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_cultivo(id_: int) -> dict[str, Any] | None:
    rows = fetch_all(
        f"""SELECT c.*, tc.codigo AS tipo, tmc.codigo AS temporada,
                   pc.humedad_optima_min, pc.humedad_optima_max, pc.temp_optima_min, pc.temp_optima_max,
                   COALESCE(sol.estado,'aprobado') AS estado_aprobacion, sol.solicitado_por
            FROM cultivos c {CULTIVO_JOINS} {SOL_JOIN_CULTIVO} WHERE c.id = %s GROUP BY c.id""",
        (id_,),
    )
    return rows[0] if rows else None


def create_cultivo(data: dict[str, Any], user: UserContext) -> dict[str, Any]:
    lote_sol = data.pop("lote_solicitud_id", None)
    payload = normalize_cultivo_payload(data)
    payload["activo"] = 0 if user.rol == "agricultor" else payload.get("activo", 1)
    new_id = _insert("cultivos", {k: v for k, v in payload.items() if v is not None})
    if user.rol == "agricultor":
        solicitudes_repository.create_solicitud("cultivo", new_id, user.id, lote_sol)
    return get_cultivo(new_id) or {"id": new_id}


def update_cultivo(id_: int, data: dict[str, Any], user: UserContext) -> dict[str, Any] | None:
    existing = get_cultivo(id_)
    if not existing:
        return None
    payload = normalize_cultivo_payload(data)
    if user.rol == "agricultor":
        if existing.get("solicitado_por") != user.id or existing.get("estado_aprobacion") != "pendiente":
            return None
        payload.pop("activo", None)
    _update("cultivos", id_, {k: v for k, v in payload.items() if v is not None})
    return get_cultivo(id_)


def aprobar_cultivo(id_: int, revisor_id: int) -> dict[str, Any] | None:
    if solicitudes_repository.aprobar("cultivo", id_, revisor_id):
        return get_cultivo(id_)
    return None


def rechazar_cultivo(id_: int, revisor_id: int, motivo: str | None) -> dict[str, Any] | None:
    if solicitudes_repository.rechazar("cultivo", id_, revisor_id, motivo):
        return get_cultivo(id_)
    return None


def delete_cultivo(id_: int) -> bool:
    return domain_repository.delete_row("cultivos", id_)


# ---------- Sensores, registros, alertas, agricultores (compact) ----------
def list_sensores(query: dict[str, Any], scope: Scope) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = """SELECT s.*, ts.codigo AS tipo, l.nombre AS lote_nombre, l.codigo_lote, l.agricultor_id,
                    c.nombre AS cultivo_nombre, u.nombre AS agricultor_nombre
             FROM sensores s
             LEFT JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id
             LEFT JOIN lotes l ON s.lote_id = l.id
             LEFT JOIN agricultores a ON l.agricultor_id = a.id
             LEFT JOIN usuarios u ON a.usuario_id = u.id
             LEFT JOIN cultivos c ON l.cultivo_id = c.id WHERE 1=1"""
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    sql += sf.clause
    params.extend(sf.params)
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) t", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY s.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_sensor(id_: int, scope: Scope) -> dict[str, Any] | None:
    row = fetch_one(
        """SELECT s.*, ts.codigo AS tipo, l.agricultor_id FROM sensores s
           LEFT JOIN tipos_sensor ts ON s.tipo_sensor_id = ts.id
           LEFT JOIN lotes l ON s.lote_id = l.id WHERE s.id = %s""",
        (id_,),
    )
    from app.core.scope import can_access_lote
    return row if row and can_access_lote(row, scope) else None


def create_sensor(data: dict[str, Any]) -> dict[str, Any]:
    payload = normalize_sensor_payload(data)
    new_id = _insert("sensores", {k: v for k, v in payload.items() if v is not None})
    return get_sensor(new_id, Scope("administrador", 0, None)) or {"id": new_id}


def update_sensor(id_: int, data: dict[str, Any], scope: Scope) -> dict[str, Any] | None:
    if not get_sensor(id_, scope):
        return None
    payload = normalize_sensor_payload(data)
    lectura = payload.pop("ultima_lectura", None)
    if lectura is not None:
        call_proc("sp_sensor_actualizar_lectura", (id_, lectura))
    _update("sensores", id_, {k: v for k, v in payload.items() if v is not None and k != "ultima_lectura"})
    return get_sensor(id_, scope)


def delete_sensor(id_: int) -> bool:
    return domain_repository.delete_row("sensores", id_)


def list_registros(query: dict[str, Any], scope: Scope) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = """SELECT r.*, l.nombre AS lote_nombre, l.codigo_lote, c.nombre AS cultivo_nombre,
                    u.nombre AS agricultor_nombre
             FROM registros_agricolas r
             LEFT JOIN lotes l ON r.lote_id = l.id
             LEFT JOIN cultivos c ON l.cultivo_id = c.id
             LEFT JOIN agricultores a ON l.agricultor_id = a.id
             LEFT JOIN usuarios u ON a.usuario_id = u.id WHERE 1=1"""
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    sql += sf.clause
    params.extend(sf.params)
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) t", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY r.fecha_registro DESC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_registro(id_: int, scope: Scope) -> dict[str, Any] | None:
    row = fetch_one(
        """SELECT r.*, l.agricultor_id, l.nombre AS lote_nombre FROM registros_agricolas r
           LEFT JOIN lotes l ON r.lote_id = l.id WHERE r.id = %s""",
        (id_,),
    )
    from app.core.scope import can_access_lote
    return row if row and can_access_lote(row, scope) else None


def create_registro(data: dict[str, Any]) -> dict[str, Any]:
    data = {k: v for k, v in data.items() if k != "cultivo_id"}
    rows = call_proc(
        "sp_registro_crear",
        (
            data.get("lote_id"),
            data.get("fecha_registro"),
            data.get("temperatura"),
            data.get("humedad_suelo"),
            data.get("humedad_aire"),
            data.get("ph_suelo"),
            data.get("precipitacion_mm"),
            data.get("produccion_kg"),
            data.get("observaciones"),
            data.get("registrado_por"),
        ),
    )
    new_id = int(rows[0]["registro_id"])
    return get_registro(new_id, Scope("administrador", 0, None)) or {"id": new_id}


def update_registro(id_: int, data: dict[str, Any], scope: Scope) -> dict[str, Any] | None:
    if not get_registro(id_, scope):
        return None
    data = {k: v for k, v in data.items() if k != "cultivo_id"}
    _update("registros_agricolas", id_, {k: v for k, v in data.items() if v is not None})
    return get_registro(id_, scope)


def delete_registro(id_: int) -> bool:
    return domain_repository.delete_row("registros_agricolas", id_)


def list_alertas(query: dict[str, Any], scope: Scope) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = """SELECT al.*, COALESCE(r.lote_id, s.lote_id) AS lote_id, l.nombre AS lote_nombre
             FROM alertas al
             LEFT JOIN registros_agricolas r ON al.registro_id = r.id
             LEFT JOIN sensores s ON al.sensor_id = s.id
             LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
             WHERE (l.id IS NOT NULL OR al.tipo = 'sistema')"""
    params: list[Any] = []
    sf = lotes_agricultor_clause(scope, "l")
    sql += sf.clause
    params.extend(sf.params)
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) t", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY al.fecha_alerta DESC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_alerta(id_: int, scope: Scope) -> dict[str, Any] | None:
    row = fetch_one(
        """SELECT al.*, COALESCE(r.lote_id, s.lote_id) AS lote_id, l.agricultor_id
           FROM alertas al
           LEFT JOIN registros_agricolas r ON al.registro_id = r.id
           LEFT JOIN sensores s ON al.sensor_id = s.id
           LEFT JOIN lotes l ON COALESCE(r.lote_id, s.lote_id) = l.id
           WHERE al.id = %s""",
        (id_,),
    )
    if not row:
        return None
    if row.get("tipo") == "sistema":
        return row
    from app.core.scope import can_access_lote
    return row if can_access_lote(row, scope) else None


def create_alerta(data: dict[str, Any]) -> dict[str, Any]:
    rows = call_proc(
        "sp_alerta_crear",
        (
            data.get("registro_id"),
            data.get("sensor_id"),
            data.get("tipo"),
            data.get("nivel", "advertencia"),
            data.get("titulo"),
            data.get("mensaje"),
        ),
    )
    new_id = int(rows[0]["alerta_id"])
    return get_alerta(new_id, Scope("administrador", 0, None)) or {"id": new_id}


def update_alerta(id_: int, data: dict[str, Any], scope: Scope) -> dict[str, Any] | None:
    if not get_alerta(id_, scope):
        return None
    _update("alertas", id_, {k: v for k, v in data.items() if v is not None})
    return get_alerta(id_, scope)


def delete_alerta(id_: int) -> bool:
    return domain_repository.delete_row("alertas", id_)


def list_agricultores(query: dict[str, Any]) -> dict[str, Any]:
    page, limit = int(query.get("page", 1)), int(query.get("limit", 10))
    sql = """SELECT a.*, u.email AS usuario_email, u.nombre AS usuario_nombre, u.dni AS usuario_dni
             FROM agricultores a INNER JOIN usuarios u ON a.usuario_id = u.id WHERE 1=1"""
    params: list[Any] = []
    total_row = fetch_one(f"SELECT COUNT(*) AS total FROM ({sql}) t", params)
    total = int(total_row["total"]) if total_row else 0
    sql += " ORDER BY a.created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, (page - 1) * limit])
    return {"data": fetch_all(sql, params), "pagination": paginate(page, limit, total)}


def get_agricultor(id_: int, scope: Scope) -> dict[str, Any] | None:
    if scope.rol == "agricultor" and scope.agricultor_id != id_:
        return None
    return fetch_one(
        """SELECT a.*, u.email AS usuario_email, u.nombre AS usuario_nombre, u.dni AS usuario_dni
           FROM agricultores a INNER JOIN usuarios u ON a.usuario_id = u.id WHERE a.id = %s""",
        (id_,),
    )


def create_agricultor(data: dict[str, Any]) -> dict[str, Any]:
    new_id = _insert("agricultores", {k: v for k, v in data.items() if v is not None})
    return get_agricultor(new_id, Scope("administrador", 0, None)) or {"id": new_id}


def update_agricultor(id_: int, data: dict[str, Any]) -> dict[str, Any] | None:
    if not fetch_one("SELECT id FROM agricultores WHERE id = %s", (id_,)):
        return None
    _update("agricultores", id_, {k: v for k, v in data.items() if v is not None})
    return get_agricultor(id_, Scope("administrador", 0, None))


def delete_agricultor(id_: int) -> bool:
    return domain_repository.delete_row("agricultores", id_)
