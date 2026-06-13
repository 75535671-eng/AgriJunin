from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class AgricultorCreate(BaseModel):
    usuario_id: int
    telefono: str | None = None
    direccion: str | None = None
    distrito: str = "Junín"
    provincia: str = "Junín"
    departamento: str = "Junín"
    hectareas_totales: float = Field(default=0, ge=0)
    fecha_registro: date
    activo: bool = True
    notas: str | None = None


class AgricultorUpdate(BaseModel):
    telefono: str | None = None
    direccion: str | None = None
    distrito: str | None = None
    provincia: str | None = None
    departamento: str | None = None
    hectareas_totales: float | None = Field(default=None, ge=0)
    fecha_registro: date | None = None
    activo: bool | None = None
    notas: str | None = None


class CultivoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=120)
    nombre_cientifico: str | None = None
    tipo: str
    temporada: str
    perfil_climatico: str | None = None
    dias_crecimiento: int = Field(default=90, ge=1, le=730)
    rendimiento_promedio: float | None = Field(default=None, ge=0)
    descripcion: str | None = None
    activo: bool = True
    lote_solicitud_id: int | None = None


class CultivoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    nombre_cientifico: str | None = None
    tipo: str | None = None
    temporada: str | None = None
    perfil_climatico: str | None = None
    dias_crecimiento: int | None = Field(default=None, ge=1, le=730)
    rendimiento_promedio: float | None = Field(default=None, ge=0)
    descripcion: str | None = None
    activo: bool | None = None


class LoteCreate(BaseModel):
    agricultor_id: int
    cultivo_id: int | None = None
    codigo_lote: str = Field(min_length=2, max_length=30)
    nombre: str = Field(min_length=2, max_length=120)
    ubicacion: str | None = None
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    area_hectareas: float = Field(gt=0)
    tipo_suelo: str = "franco"
    estado: Literal["preparacion", "siembra", "crecimiento", "cosecha", "barbecho"] = "preparacion"
    fecha_siembra: date | None = None
    fecha_cosecha_est: date | None = None
    activo: bool = True


class LoteUpdate(BaseModel):
    agricultor_id: int | None = None
    cultivo_id: int | None = None
    codigo_lote: str | None = Field(default=None, min_length=2, max_length=30)
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    ubicacion: str | None = None
    latitud: float | None = Field(default=None, ge=-90, le=90)
    longitud: float | None = Field(default=None, ge=-180, le=180)
    area_hectareas: float | None = Field(default=None, gt=0)
    tipo_suelo: str | None = None
    estado: Literal["preparacion", "siembra", "crecimiento", "cosecha", "barbecho"] | None = None
    fecha_siembra: date | None = None
    fecha_cosecha_est: date | None = None
    activo: bool | None = None


class SensorCreate(BaseModel):
    lote_id: int
    tipo: str
    codigo_sensor: str = Field(min_length=2, max_length=40)
    nombre: str = Field(min_length=2, max_length=120)
    unidad_medida: str = "%"
    valor_min: float | None = None
    valor_max: float | None = None
    ultima_lectura: float | None = None
    estado: Literal["activo", "inactivo", "mantenimiento", "falla"] = "activo"
    bateria_pct: int | None = Field(default=None, ge=0, le=100)
    activo: bool = True


class SensorUpdate(BaseModel):
    lote_id: int | None = None
    tipo: str | None = None
    codigo_sensor: str | None = Field(default=None, min_length=2, max_length=40)
    nombre: str | None = Field(default=None, min_length=2, max_length=120)
    unidad_medida: str | None = None
    valor_min: float | None = None
    valor_max: float | None = None
    ultima_lectura: float | None = None
    estado: Literal["activo", "inactivo", "mantenimiento", "falla"] | None = None
    bateria_pct: int | None = Field(default=None, ge=0, le=100)
    activo: bool | None = None


class RegistroCreate(BaseModel):
    lote_id: int
    fecha_registro: datetime | None = None
    temperatura: float | None = Field(default=None, ge=-50, le=60)
    humedad_suelo: float | None = Field(default=None, ge=0, le=100)
    humedad_aire: float | None = Field(default=None, ge=0, le=100)
    ph_suelo: float | None = Field(default=None, ge=0, le=14)
    precipitacion_mm: float | None = Field(default=None, ge=0)
    produccion_kg: float | None = Field(default=None, ge=0)
    observaciones: str | None = None
    registrado_por: int | None = None


class RegistroUpdate(BaseModel):
    lote_id: int | None = None
    fecha_registro: datetime | None = None
    temperatura: float | None = Field(default=None, ge=-50, le=60)
    humedad_suelo: float | None = Field(default=None, ge=0, le=100)
    humedad_aire: float | None = Field(default=None, ge=0, le=100)
    ph_suelo: float | None = Field(default=None, ge=0, le=14)
    precipitacion_mm: float | None = Field(default=None, ge=0)
    produccion_kg: float | None = Field(default=None, ge=0)
    observaciones: str | None = None
    registrado_por: int | None = None


class AlertaCreate(BaseModel):
    registro_id: int | None = None
    sensor_id: int | None = None
    tipo: Literal["humedad", "temperatura", "ph", "pluvia", "sensor", "produccion", "sistema"]
    nivel: Literal["info", "advertencia", "critica"] = "advertencia"
    titulo: str = Field(min_length=3, max_length=200)
    mensaje: str = Field(min_length=3)


class AlertaUpdate(BaseModel):
    registro_id: int | None = None
    sensor_id: int | None = None
    tipo: Literal["humedad", "temperatura", "ph", "pluvia", "sensor", "produccion", "sistema"] | None = None
    nivel: Literal["info", "advertencia", "critica"] | None = None
    titulo: str | None = Field(default=None, min_length=3, max_length=200)
    mensaje: str | None = Field(default=None, min_length=3)
    leida: bool | None = None
    resuelta: bool | None = None
