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
  rol: Rol;
  activo?: boolean;
}

export interface AuthData {
  user: Usuario;
  token: string;
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
  cultivo_nombre?: string;
}

export interface Alerta {
  id?: number;
  registro_id: number;
  tipo: string;
  nivel: string;
  titulo: string;
  mensaje: string;
  leida?: boolean;
  resuelta?: boolean;
  fecha_alerta?: string;
  lote_nombre?: string;
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

export interface SincronizacionClima {
  clima: ClimaHuancayo;
  sincronizacion: {
    lote_id: number;
    lote_nombre: string;
    registro_id: number;
    sensores_actualizados: number;
    sensores: { sensor_id: number; codigo: string; lectura: number }[];
    alertas_generadas: number;
    alertas: { id: number; tipo: string; nivel: string }[];
  };
}

export interface DashboardStats {
  climaHuancayo?: ClimaHuancayo | null;
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
