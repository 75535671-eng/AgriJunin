import { Rol } from '../../models';

export interface NavItemConfig {
  label: string;
  path: string;
  icon: string;
  roles: Rol[];
  hint?: string;
}

export interface NavSectionConfig {
  title: string;
  roles: Rol[];
  items: NavItemConfig[];
}

/** Menú agrupado según el flujo: Productor → Cultivo → Lote → Sensor → Registro → Alerta */
export const NAV_SECTIONS: NavSectionConfig[] = [
  {
    title: 'Inicio',
    roles: ['administrador', 'tecnico', 'agricultor'],
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: '📊',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Resumen según su rol',
      },
      {
        label: 'Clima Huancayo',
        path: '/clima',
        icon: '🌤️',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Datos meteorológicos de la región',
      },
    ],
  },
  {
    title: 'Administración',
    roles: ['administrador'],
    items: [
      {
        label: 'Aprobar técnicos',
        path: '/admin/usuarios-pendientes',
        icon: '✅',
        roles: ['administrador'],
        hint: 'Cuentas de técnico en espera',
      },
    ],
  },
  {
    title: '1. Productores',
    roles: ['administrador', 'tecnico'],
    items: [
      {
        label: 'Agricultores',
        path: '/agricultores',
        icon: '👨‍🌾',
        roles: ['administrador', 'tecnico'],
        hint: 'Quién produce en el sistema',
      },
    ],
  },
  {
    title: '2. Catálogo',
    roles: ['administrador', 'tecnico', 'agricultor'],
    items: [
      {
        label: 'Cultivos',
        path: '/cultivos',
        icon: '🌱',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Tipos de cultivo (papa, maíz…)',
      },
    ],
  },
  {
    title: '3. Campo',
    roles: ['administrador', 'tecnico', 'agricultor'],
    items: [
      {
        label: 'Lotes',
        path: '/lotes',
        icon: '🗺️',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Parcelas del agricultor + cultivo',
      },
      {
        label: 'Sensores',
        path: '/sensores',
        icon: '📡',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'En cada lote',
      },
    ],
  },
  {
    title: '4. Monitoreo',
    roles: ['administrador', 'tecnico', 'agricultor'],
    items: [
      {
        label: 'Registros',
        path: '/registros',
        icon: '📋',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Mediciones por lote',
      },
      {
        label: 'Alertas',
        path: '/alertas',
        icon: '🔔',
        roles: ['administrador', 'tecnico', 'agricultor'],
        hint: 'Avisos según umbrales',
      },
    ],
  },
];

export const ROLE_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  tecnico: 'Técnico de campo',
  agricultor: 'Agricultor',
};
