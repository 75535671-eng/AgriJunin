"""Diagrama ER empresarial estilo AgriJunín — 14 tablas con campos."""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
from matplotlib.lines import Line2D

OUTPUT = Path(__file__).resolve().parent / "Diagrama_ER_AgriJunin_Empresarial.png"

MODULES = {
    "Catálogos": "#B0BEC5",
    "Seguridad": "#64B5F6",
    "Agrícola": "#81C784",
    "IoT": "#FFB74D",
    "Monitoreo": "#BA68C8",
    "Alertas": "#E57373",
    "Workflow": "#FFD54F",
}

ENTITIES = {
    # Catálogos — fila superior
    "roles": {
        "module": "Catálogos", "pos": (0.3, 18.8), "w": 2.6,
        "fields": ["id (PK)", "codigo (UK)", "nombre", "descripcion"],
    },
    "tipos_cultivo": {
        "module": "Catálogos", "pos": (3.2, 18.8), "w": 2.8,
        "fields": ["id (PK)", "codigo (UK)", "nombre", "descripcion"],
    },
    "temporadas_cultivo": {
        "module": "Catálogos", "pos": (6.3, 18.8), "w": 2.8,
        "fields": ["id (PK)", "codigo (UK)", "nombre"],
    },
    "perfiles_climaticos": {
        "module": "Catálogos", "pos": (9.4, 18.8), "w": 3.0,
        "fields": ["id (PK)", "nombre", "humedad_optima_min/max", "temp_optima_min/max", "descripcion"],
    },
    "tipos_suelo": {
        "module": "Catálogos", "pos": (12.8, 18.8), "w": 2.6,
        "fields": ["id (PK)", "codigo (UK)", "nombre", "descripcion"],
    },
    "tipos_sensor": {
        "module": "Catálogos", "pos": (15.7, 18.8), "w": 2.8,
        "fields": ["id (PK)", "codigo (UK)", "nombre", "unidad_medida_def", "descripcion"],
    },
    # Seguridad
    "usuarios": {
        "module": "Seguridad", "pos": (1.0, 14.5), "w": 3.0,
        "fields": ["id (PK)", "nombre", "email (UK)", "dni (UK)", "password", "rol_id (FK)", "activo", "estado_cuenta", "created_at"],
    },
    # Agrícola
    "agricultores": {
        "module": "Agrícola", "pos": (1.0, 10.5), "w": 3.0,
        "fields": ["id (PK)", "usuario_id (FK,UK)", "telefono", "distrito", "provincia", "hectareas_totales", "fecha_registro", "activo"],
    },
    "cultivos": {
        "module": "Agrícola", "pos": (9.5, 14.5), "w": 3.2,
        "fields": ["id (PK)", "nombre", "nombre_cientifico", "tipo_id (FK)", "temporada_id (FK)", "perfil_climatico_id (FK)", "dias_crecimiento", "activo"],
    },
    "lotes": {
        "module": "Agrícola", "pos": (5.0, 10.5), "w": 3.4,
        "fields": ["id (PK)", "agricultor_id (FK)", "cultivo_id (FK)", "codigo_lote (UK)", "nombre", "latitud/longitud", "area_hectareas", "tipo_suelo_id (FK)", "estado", "activo"],
    },
    "solicitudes_aprobacion": {
        "module": "Workflow", "pos": (13.5, 10.5), "w": 3.4,
        "fields": ["id (PK)", "entidad_tipo", "entidad_id", "estado", "solicitado_por (FK)", "revisado_por (FK)", "lote_destino_id (FK)", "motivo_rechazo"],
    },
    # IoT
    "sensores": {
        "module": "IoT", "pos": (13.5, 6.5), "w": 3.2,
        "fields": ["id (PK)", "lote_id (FK)", "tipo_sensor_id (FK)", "codigo_sensor (UK)", "nombre", "ultima_lectura", "estado", "bateria_pct"],
    },
    # Monitoreo
    "registros_agricolas": {
        "module": "Monitoreo", "pos": (5.0, 6.5), "w": 3.4,
        "fields": ["id (PK)", "lote_id (FK)", "fecha_registro", "temperatura", "humedad_suelo", "humedad_aire", "ph_suelo", "produccion_kg", "registrado_por (FK)"],
    },
    # Alertas
    "alertas": {
        "module": "Alertas", "pos": (9.0, 2.5), "w": 3.2,
        "fields": ["id (PK)", "registro_id (FK)", "sensor_id (FK)", "tipo", "nivel", "titulo", "mensaje", "leida", "resuelta", "fecha_alerta"],
    },
}

RELATIONS = [
    ("roles", "usuarios", "1", "N", True),
    ("usuarios", "agricultores", "1", "1", True),
    ("tipos_cultivo", "cultivos", "1", "N", False),
    ("temporadas_cultivo", "cultivos", "1", "N", False),
    ("perfiles_climaticos", "cultivos", "1", "N", False),
    ("agricultores", "lotes", "1", "N", True),
    ("cultivos", "lotes", "1", "N", False),
    ("tipos_suelo", "lotes", "1", "N", False),
    ("lotes", "sensores", "1", "N", True),
    ("tipos_sensor", "sensores", "1", "N", False),
    ("lotes", "registros_agricolas", "1", "N", True),
    ("usuarios", "registros_agricolas", "1", "N", False),
    ("registros_agricolas", "alertas", "1", "N", False),
    ("sensores", "alertas", "1", "N", False),
    ("usuarios", "solicitudes_aprobacion", "1", "N", False),
    ("lotes", "solicitudes_aprobacion", "1", "N", False),
    ("cultivos", "solicitudes_aprobacion", "1", "N", False),
]

ROW_H = 0.28
HEADER_H = 0.38
PAD = 0.08


def entity_height(name: str) -> float:
    return HEADER_H + len(ENTITIES[name]["fields"]) * ROW_H + PAD


def entity_box(name: str) -> tuple[float, float, float, float]:
    x, y = ENTITIES[name]["pos"]
    w = ENTITIES[name]["w"]
    h = entity_height(name)
    return x, y, w, h


def entity_center(name: str) -> tuple[float, float]:
    x, y, w, h = entity_box(name)
    return x + w / 2, y + h / 2


def draw_entity(ax, name: str) -> None:
    info = ENTITIES[name]
    x, y, w, h = entity_box(name)
    mod_color = MODULES[info["module"]]

    body = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="square,pad=0",
        linewidth=1.2, edgecolor="#37474F", facecolor="white", zorder=3,
    )
    ax.add_patch(body)

    header = Rectangle((x, y + h - HEADER_H), w, HEADER_H, facecolor=mod_color, edgecolor="#37474F", linewidth=1.2, zorder=4)
    ax.add_patch(header)

    display = name.replace("_", " ")
    ax.text(x + w / 2, y + h - HEADER_H / 2, display, ha="center", va="center",
            fontsize=7.5, fontweight="bold", color="#212121", zorder=5)

    for i, field in enumerate(info["fields"]):
        fy = y + h - HEADER_H - (i + 0.65) * ROW_H
        color = "#1565C0" if "(PK)" in field else ("#C62828" if "(FK" in field else "#333")
        ax.text(x + 0.08, fy, field, ha="left", va="center", fontsize=6.2, color=color, zorder=5, family="monospace")


def connection_points(src: str, dst: str) -> tuple[tuple[float, float], tuple[float, float]]:
    sx, sy, sw, sh = entity_box(src)
    dx, dy, dw, dh = entity_box(dst)
    scx, scy = sx + sw / 2, sy + sh / 2
    dcx, dcy = dx + dw / 2, dy + dh / 2

    if abs(dcx - scx) >= abs(dcy - scy):
        if dcx > scx:
            return (sx + sw, scy), (dx, dcy)
        return (sx, scy), (dx + dw, dcy)
    if dcy > scy:
        return (scx, sy + sh), (dcx, dy)
    return (scx, sy), (dcx, dy + dh)


def draw_crow_foot(ax, point: tuple[float, float], toward: tuple[float, float], cardinality: str, side: str) -> None:
    px, py = point
    tx, ty = toward
    dx, dy = tx - px, ty - py
    length = (dx ** 2 + dy ** 2) ** 0.5 or 1
    ux, uy = dx / length, dy / length
    perp_x, perp_y = -uy, ux

    if cardinality == "1":
        ax.plot([px - perp_x * 0.12, px + perp_x * 0.12], [py - perp_y * 0.12, py + perp_y * 0.12],
                color="#455A64", linewidth=1.5, zorder=2)
    else:  # N
        base_x = px - ux * 0.15
        base_y = py - uy * 0.15
        for sign in (-1, 1):
            ax.plot([base_x, px + sign * perp_x * 0.18], [base_y, py + sign * perp_y * 0.18],
                    color="#455A64", linewidth=1.2, zorder=2)

    label_x = px + (0.25 if side == "src" else -0.25) * ux
    label_y = py + (0.25 if side == "src" else -0.25) * uy
    ax.text(label_x, label_y, cardinality, fontsize=6.5, fontweight="bold", color="#37474F",
            ha="center", va="center", zorder=6)


def draw_relation(ax, src: str, dst: str, card_src: str, card_dst: str, solid: bool) -> None:
    start, end = connection_points(src, dst)
    ax.plot([start[0], end[0]], [start[1], end[1]],
            color="#546E7A", linewidth=1.1, linestyle="-" if solid else "--", zorder=1)
    draw_crow_foot(ax, start, end, card_src, "src")
    draw_crow_foot(ax, end, start, card_dst, "dst")


def main() -> None:
    fig, ax = plt.subplots(figsize=(22, 16), dpi=180)
    ax.set_xlim(-0.2, 19.5)
    ax.set_ylim(1.5, 21.5)
    ax.axis("off")
    fig.patch.set_facecolor("#FAFAFA")

    ax.text(9.5, 21.0, "AgriJunín — Modelo Entidad-Relación", ha="center", fontsize=20, fontweight="bold", color="#1B5E20")
    ax.text(9.5, 20.5, "Sistema Web de Agricultura Inteligente · Región Junín · BD: agri_junin · 14 tablas · 3FN · MySQL/MariaDB",
            ha="center", fontsize=10, color="#616161")

    # Módulos labels
    zones = [
        (1.5, 20.2, "CATÁLOGOS", "#607D8B"),
        (2.5, 16.8, "SEGURIDAD", "#1976D2"),
        (7.0, 16.8, "DOMINIO AGRÍCOLA", "#388E3C"),
        (15.0, 16.8, "WORKFLOW", "#F9A825"),
        (15.0, 12.5, "IoT", "#F57C00"),
        (6.5, 12.5, "MONITOREO", "#7B1FA2"),
        (10.5, 8.0, "ALERTAS", "#D32F2F"),
    ]
    for zx, zy, zlabel, zcolor in zones:
        ax.text(zx, zy, zlabel, fontsize=8, fontweight="bold", color=zcolor, alpha=0.85)

    for src, dst, cs, cd, solid in RELATIONS:
        draw_relation(ax, src, dst, cs, cd, solid)

    for name in ENTITIES:
        draw_entity(ax, name)

    # Leyenda
    legend_y = 0.8
    ax.text(0.5, legend_y + 0.6, "Leyenda de módulos", fontsize=9, fontweight="bold", color="#333")
    lx = 0.5
    for mod, color in MODULES.items():
        ax.add_patch(Rectangle((lx, legend_y), 0.35, 0.35, facecolor=color, edgecolor="#37474F"))
        ax.text(lx + 0.45, legend_y + 0.17, mod, fontsize=7.5, va="center")
        lx += 2.3

    ax.text(0.5, legend_y - 0.5, "PK = Clave primaria   |   FK = Clave foránea   |   UK = Único   |   Línea sólida = relación identificadora   |   Línea punteada = no identificadora",
            fontsize=7, color="#666")

    sym = [
        Line2D([0], [0], color="#455A64", linewidth=1.5, label="1 (uno)"),
        Line2D([0], [0], color="#455A64", linewidth=1.2, label="N (muchos) — patas de gallo"),
    ]
    ax.legend(handles=sym, loc="lower right", fontsize=7, framealpha=0.9, title="Cardinalidad")

    plt.savefig(OUTPUT, bbox_inches="tight", facecolor="#FAFAFA", pad_inches=0.35)
    plt.close()
    print(f"[OK] Diagrama empresarial: {OUTPUT}")


if __name__ == "__main__":
    main()
