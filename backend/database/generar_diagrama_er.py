"""Genera diagrama Entidad-Relación (PNG) — Base de datos AgriJunín."""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

OUTPUT = Path(__file__).resolve().parent / "Diagrama_ER_AgriJunin.png"

# x, y, w, h, color, tipo
ENTITIES = {
    "roles": (0.5, 16.0, 2.2, 0.85, "#BBDEFB", "Catálogo"),
    "tipos_cultivo": (0.5, 14.5, 2.4, 0.85, "#BBDEFB", "Catálogo"),
    "temporadas_cultivo": (0.5, 13.0, 2.6, 0.85, "#BBDEFB", "Catálogo"),
    "perfiles_climaticos": (0.5, 11.5, 2.6, 0.85, "#BBDEFB", "Catálogo"),
    "tipos_suelo": (0.5, 10.0, 2.2, 0.85, "#BBDEFB", "Catálogo"),
    "tipos_sensor": (0.5, 8.5, 2.2, 0.85, "#BBDEFB", "Catálogo"),
    "usuarios": (4.5, 16.0, 2.2, 0.85, "#C8E6C9", "Entidad"),
    "agricultores": (4.5, 14.0, 2.4, 0.85, "#C8E6C9", "Entidad"),
    "cultivos": (8.5, 15.0, 2.2, 0.85, "#C8E6C9", "Entidad"),
    "lotes": (4.5, 11.0, 2.2, 1.0, "#FFE0B2", "Central"),
    "solicitudes_aprobacion": (8.5, 12.5, 3.0, 0.85, "#C8E6C9", "Entidad"),
    "sensores": (8.5, 9.5, 2.2, 0.85, "#C8E6C9", "Entidad"),
    "registros_agricolas": (4.5, 8.0, 2.8, 0.85, "#C8E6C9", "Entidad"),
    "alertas": (4.5, 5.5, 2.2, 0.85, "#C8E6C9", "Entidad"),
}

RELATIONS = [
    ("roles", "usuarios", "1:N"),
    ("usuarios", "agricultores", "1:1"),
    ("tipos_cultivo", "cultivos", "1:N"),
    ("temporadas_cultivo", "cultivos", "1:N"),
    ("perfiles_climaticos", "cultivos", "1:N"),
    ("agricultores", "lotes", "1:N"),
    ("cultivos", "lotes", "1:N"),
    ("tipos_suelo", "lotes", "1:N"),
    ("lotes", "sensores", "1:N"),
    ("tipos_sensor", "sensores", "1:N"),
    ("lotes", "registros_agricolas", "1:N"),
    ("usuarios", "registros_agricolas", "1:N"),
    ("registros_agricolas", "alertas", "1:N"),
    ("sensores", "alertas", "1:N"),
    ("usuarios", "solicitudes_aprobacion", "1:N"),
    ("lotes", "solicitudes_aprobacion", "1:N"),
    ("cultivos", "solicitudes_aprobacion", "1:N"),
]

EDGE = {"Catálogo": "#1565C0", "Entidad": "#2E7D32", "Central": "#E65100"}


def box_center(name: str) -> tuple[float, float]:
    x, y, w, h, *_ = ENTITIES[name]
    return x + w / 2, y + h / 2


def box_edge(name: str, target: str) -> tuple[tuple[float, float], tuple[float, float]]:
    x, y, w, h, *_ = ENTITIES[name]
    tx, ty = box_center(target)
    cx, cy = x + w / 2, y + h / 2
    dx, dy = tx - cx, ty - cy
    if abs(dx) > abs(dy):
        if dx > 0:
            return (x + w, cy), (ENTITIES[target][0], box_center(target)[1])
        return (x, cy), (ENTITIES[target][0] + ENTITIES[target][2], box_center(target)[1])
    if dy > 0:
        return (cx, y + h), (box_center(target)[0], ENTITIES[target][1])
    return (cx, y), (box_center(target)[0], ENTITIES[target][1] + ENTITIES[target][3])


def draw_box(ax, name: str) -> None:
    x, y, w, h, color, tipo = ENTITIES[name]
    edge = EDGE[tipo]
    lw = 2.5 if tipo == "Central" else 1.6
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.1",
        linewidth=lw, edgecolor=edge, facecolor=color, zorder=3,
    )
    ax.add_patch(box)
    display = name.replace("_", "\n") if len(name) > 12 else name.replace("_", " ")
    fs = 9 if tipo == "Central" else 8
    ax.text(x + w / 2, y + h / 2, display, ha="center", va="center",
            fontsize=fs, fontweight="bold", zorder=4)


def draw_relation(ax, src: str, dst: str, label: str) -> None:
    start, end = box_edge(src, dst)
    color = "#555555"
    ax.add_patch(FancyArrowPatch(
        start, end, arrowstyle="-|>", mutation_scale=11,
        linewidth=1.1, color=color, alpha=0.7,
        connectionstyle="arc3,rad=0.05", zorder=1,
    ))
    mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
    ax.text(mx, my, label, fontsize=7, color="#333", ha="center", va="center",
            bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="#ccc", alpha=0.9), zorder=5)


def main() -> None:
    fig, ax = plt.subplots(figsize=(14, 10), dpi=180)
    ax.set_xlim(0, 12.5)
    ax.set_ylim(4.5, 17.5)
    ax.axis("off")
    fig.patch.set_facecolor("white")

    ax.text(6.2, 17.1, "Diagrama Entidad – Relación", ha="center", fontsize=18, fontweight="bold", color="#1B5E20")
    ax.text(6.2, 16.6, "Sistema AgriJunín  |  BD: agri_junin  |  14 tablas  |  3FN  |  MySQL/MariaDB",
            ha="center", fontsize=10, color="#666")

    # Etiquetas de zona
    ax.text(1.6, 17.2, "CATÁLOGOS", ha="center", fontsize=9, fontweight="bold", color="#1565C0")
    ax.text(5.6, 17.2, "IDENTIDAD / NÚCLEO", ha="center", fontsize=9, fontweight="bold", color="#E65100")
    ax.text(10.0, 17.2, "OPERACIONES", ha="center", fontsize=9, fontweight="bold", color="#2E7D32")

    for src, dst, label in RELATIONS:
        draw_relation(ax, src, dst, label)

    for name in ENTITIES:
        draw_box(ax, name)

    legend_items = [
        mpatches.Patch(facecolor="#BBDEFB", edgecolor="#1565C0", label="Catálogo (6 tablas)"),
        mpatches.Patch(facecolor="#C8E6C9", edgecolor="#2E7D32", label="Entidad (7 tablas)"),
        mpatches.Patch(facecolor="#FFE0B2", edgecolor="#E65100", label="Entidad central: lotes"),
    ]
    ax.legend(handles=legend_items, loc="lower center", ncol=3, fontsize=9, framealpha=0.95,
              bbox_to_anchor=(0.5, 0.0))

    plt.savefig(OUTPUT, bbox_inches="tight", facecolor="white", pad_inches=0.25)
    plt.close()
    print(f"[OK] Imagen generada: {OUTPUT}")


if __name__ == "__main__":
    main()
