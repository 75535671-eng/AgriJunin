from __future__ import annotations

from app.core.database import call_proc


def create_solicitud(entidad_tipo: str, entidad_id: int, solicitado_por: int, lote_destino_id: int | None = None) -> int:
    rows = call_proc(
        "sp_solicitud_crear",
        (entidad_tipo, entidad_id, solicitado_por, lote_destino_id),
    )
    return int(rows[0]["solicitud_id"]) if rows else 0


def aprobar(entidad_tipo: str, entidad_id: int, revisor_id: int) -> bool:
    rows = call_proc("sp_solicitud_aprobar", (entidad_tipo, entidad_id, revisor_id))
    return bool(rows and rows[0].get("affected"))


def rechazar(entidad_tipo: str, entidad_id: int, revisor_id: int, motivo: str | None = None) -> bool:
    rows = call_proc("sp_solicitud_rechazar", (entidad_tipo, entidad_id, revisor_id, motivo))
    return bool(rows and rows and rows[0].get("affected"))
