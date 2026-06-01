export type Rol = 'administrador' | 'agricultor' | 'tecnico';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  dni?: string;
  rol: Rol;
  activo?: boolean;
  estado_cuenta?: EstadoCuenta;
  agricultor_id?: number;
  agricultor_nombre?: string;
}

export type EstadoAprobacionCultivo = 'aprobado' | 'pendiente' | 'rechazado';
export type EstadoAprobacionLote = EstadoAprobacionCultivo;

export interface AuthData {
  user: Usuario;
  token: string | null;
  pendienteAprobacion?: boolean;
}

export type EstadoCuenta = 'aprobada' | 'pendiente' | 'rechazada';

export interface UsuarioPendiente {
  id: number;
  nombre: string;
  email: string;
  dni?: string;
  rol: Rol;
  estado_cuenta: EstadoCuenta;
  created_at?: string;
}

/** Cultivo en un lote del agricultor, con estado propio de la parcela */
export interface AgricultorLoteCultivo {
  lote_id: number;
  codigo_lote: string;
  lote_nombre: string;
  cultivo_id?: number;
  cultivo_nombre: string;
  cultivo_tipo?: string;
  estado: string;
  area_hectareas: number;
  fecha_siembra?: string;
}

export interface Agricultor {
  id?: number;
  usuario_id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  email_contacto?: string;
  direccion?: string;
  distrito: string;
  provincia?: string;
  departamento?: string;
  hectareas_totales?: number;
  fecha_registro: string;
  activo?: boolean;
  notas?: string;
  usuario_email?: string;
  usuario_nombre?: string;
  total_lotes?: number;
  total_cultivos_distintos?: number;
  cultivos_en_lotes?: string;
  lotes_cultivos?: AgricultorLoteCultivo[];
}

export interface Cultivo {
  id?: number;
  nombre: string;
  nombre_cientifico?: string;
  tipo: string;
  temporada?: string;
  dias_crecimiento?: number;
  rendimiento_promedio?: number;
  humedad_optima_min?: number;
  humedad_optima_max?: number;
  temp_optima_min?: number;
  temp_optima_max?: number;
  descripcion?: string;
  activo?: boolean;
  total_lotes?: number;
  total_agricultores?: number;
  agricultores_en_lotes?: string;
  estado_aprobacion?: EstadoAprobacionCultivo;
  solicitado_por?: number;
  solicitante_nombre?: string;
  revisor_nombre?: string;
  motivo_rechazo?: string;
  lote_solicitud_id?: number;
  lote_solicitud_codigo?: string;
  lote_solicitud_nombre?: string;
}

export interface Lote {
  id?: number;
  agricultor_id: number;
  cultivo_id?: number;
  codigo_lote: string;
  nombre: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  area_hectareas: number;
  tipo_suelo?: string;
  estado?: string;
  fecha_siembra?: string;
  fecha_cosecha_est?: string;
  activo?: boolean;
  agricultor_nombres?: string;
  agricultor_apellidos?: string;
  cultivo_nombre?: string;
  estado_aprobacion?: EstadoAprobacionLote;
  solicitado_por?: number;
  solicitante_nombre?: string;
  revisor_nombre?: string;
  motivo_rechazo?: string;
}

export interface Sensor {
  id?: number;
  lote_id: number;
  codigo_sensor: string;
  nombre: string;
  tipo: string;
  unidad_medida: string;
  valor_min?: number;
  valor_max?: number;
  ultima_lectura?: number;
  ultima_fecha?: string;
  estado?: string;
  bateria_pct?: number;
  activo?: boolean;
  lote_nombre?: string;
  codigo_lote?: string;
  agricultor_id?: number;
  cultivo_id?: number;
  cultivo_nombre?: string;
  agricultor_nombre?: string;
}

export interface RegistroAgricola {
  id?: number;
  lote_id: number;
  cultivo_id: number;
  fecha_registro?: string;
  temperatura?: number;
  humedad_suelo?: number;
  humedad_aire?: number;
  ph_suelo?: number;
  precipitacion_mm?: number;
  produccion_kg?: number;
  observaciones?: string;
  registrado_por?: number;
  lote_nombre?: string;
  codigo_lote?: string;
  agricultor_id?: number;
  agricultor_nombre?: string;
  cultivo_nombre?: string;
}

export interface Alerta {
  id?: number;
  lote_id?: number | null;
  registro_id?: number | null;
  sensor_id?: number | null;
  tipo: string;
  nivel: string;
  titulo: string;
  mensaje: string;
  leida?: boolean;
  resuelta?: boolean;
  fecha_alerta?: string;
  lote_nombre?: string;
  codigo_lote?: string;
  codigo_sensor?: string;
  sensor_nombre?: string;
  agricultor_nombre?: string;
  cultivo_nombre?: string;
}

export interface ClimaHuancayo {
  ubicacion: {
    ciudad: string;
    region: string;
    pais: string;
    latitud: number;
    longitud: number;
    elevacion_m: number;
    actualizado: string;
  };
  actual: {
    temperatura: number;
    sensacion_termica: number;
    humedad: number;
    precipitacion: number;
    viento_kmh: number;
    codigo_clima: number;
    descripcion: string;
    humedad_suelo_estimada: number | null;
  };
  pronosticoHorario: {
    hora: string;
    temperatura: number;
    humedad: number;
    precipitacion: number;
    humedad_suelo: number | null;
  }[];
  pronosticoDiario: {
    fecha: string;
    temp_max: number;
    temp_min: number;
    precipitacion_mm: number;
    descripcion: string;
    codigo: number;
  }[];
  fuente: string;
  licencia: string;
}

export interface MapsConfig {
  apiKey: string;
  centro: { lat: number; lng: number; etiqueta: string };
  origenRuta: string;
}

export interface MapsDirections {
  origen_referencia: string;
  origen: { lat: number; lng: number; direccion: string };
  destino: { lat: number; lng: number; direccion: string };
  distancia?: string;
  distancia_metros?: number;
  duracion?: string;
  duracion_segundos?: number;
  polyline?: string;
}

export interface EspeciePlanta {
  perenual_id: number;
  nombre: string;
  nombre_cientifico: string;
  tipo_sugerido: string;
  temporada_sugerida: string;
  familia: string | null;
  ciclo: string | null;
  imagen_url: string | null;
  descripcion_sugerida: string | null;
}

export interface BusquedaPlantas {
  query: string;
  total: number;
  resultados: EspeciePlanta[];
  fuente: string;
}

export interface MapsGeocode {
  direccion: string;
  place_id: string | null;
}

export interface SincronizacionLoteDetalle {
  lote_id: number;
  lote_nombre: string;
  registro_id: number;
  sensores_actualizados: number;
  sensores: { sensor_id: number; codigo: string; lectura: number }[];
  alertas_generadas: number;
  alertas: { id: number; tipo: string; nivel: string }[];
}

export interface SincronizacionClima {
  clima: ClimaHuancayo;
  sincronizacion: SincronizacionLoteDetalle & {
    todos_lotes?: boolean;
    lotes_procesados?: number;
    total_sensores_actualizados?: number;
    total_alertas_generadas?: number;
    lotes?: SincronizacionLoteDetalle[];
  };
}

export interface DashboardContexto {
  rol: Rol;
  titulo: string;
  descripcion: string;
  agricultorVinculado: boolean;
  flujo: { paso: number; modulo: string; descripcion: string }[];
}

export interface DashboardStats {
  climaHuancayo?: ClimaHuancayo | null;
  contexto?: DashboardContexto;
  kpis: {
    totalAgricultores: number;
    totalCultivos: number;
    sensoresActivos: number;
    alertasCriticas: number;
    totalLotes: number;
    totalRegistros: number;
    produccionSemanalKg: number;
  };
  produccionSemanal: { fecha: string; produccion: number }[];
  alertasPorNivel: { nivel: string; cantidad: number }[];
  cultivosPorTipo: { tipo: string; cantidad: number }[];
  sensoresPorEstado: { estado: string; cantidad: number }[];
  ultimasAlertas: Alerta[];
}
