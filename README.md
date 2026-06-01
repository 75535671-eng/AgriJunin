El Proyecto al 80% esta en Enriquez_Millan
# Sistema Web de Agricultura Inteligente — Región Junín

Plataforma Full Stack profesional para gestión de agricultores, cultivos, lotes, sensores IoT, monitoreo ambiental y alertas inteligentes.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 20+, Signals, Standalone, Reactive Forms, SCSS |
| Backend | Node.js, Express.js, JWT, MVC |
| Base de datos | MySQL 8+ con integridad referencial |

## Estructura del proyecto

```
PROYECTO-FINAL-ING-WEB/
├── backend/          # API REST Node.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   └── database/     # schema.sql, seeds
├── frontend/         # Angular 20
│   └── src/app/
│       ├── core/     # guards, interceptors, auth
│       ├── shared/   # componentes reutilizables
│       ├── layouts/  # sidebar + navbar
│       ├── pages/    # CRUD por módulo
│       └── dashboard/
└── README.md
```

## Requisitos previos

- Node.js 20+
- MySQL 8+
- npm

## Instalación

### 1. Base de datos

```bash
# Opción A: Ejecutar SQL manualmente
mysql -u root -p < backend/database/schema.sql
mysql -u root -p < backend/database/seeds.sql

# Opción B: Seed automático con bcrypt
cd backend
npm install
cp .env.example .env   # Editar credenciales MySQL
npm run seed
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
# API: http://localhost:3000/api
```

### 3. Frontend

```bash
cd frontend
npm install
ng serve
# App: http://localhost:4200
```

## Credenciales de prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@agrijunin.pe | Admin123! | administrador |
| maria.quispe@agrijunin.pe | Admin123! | agricultor |
| ana.tello@agrijunin.pe | Admin123! | tecnico |

## API REST (endpoints principales)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/register` | Registro |
| GET | `/api/dashboard/stats` | KPIs del dashboard |
| GET | `/api/clima/huancayo` | Clima real Huancayo (Open-Meteo) |
| POST | `/api/clima/sincronizar` | Sincroniza clima → registros, sensores y alertas |
| CRUD | `/api/agricultores` | Gestión agricultores |
| CRUD | `/api/cultivos` | Catálogo cultivos |
| CRUD | `/api/lotes` | Lotes agrícolas |
| CRUD | `/api/sensores` | Sensores IoT |
| CRUD | `/api/registros` | Registros de monitoreo |
| CRUD | `/api/alertas` | Alertas inteligentes |

## Roles y permisos

- **Administrador**: acceso total, eliminar registros
- **Técnico**: crear y editar datos de campo
- **Agricultor**: consulta y visualización

## Escalabilidad futura

El sistema está preparado para integrar:

- Sensores IoT reales (MQTT/WebSocket)
- APIs meteorológicas
- Machine Learning / predicción de cosechas
- Exportación PDF / Excel
- Notificaciones push

## Autor

Proyecto Final — Ingeniería Web
