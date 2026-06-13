# Sistema Web de Agricultura Inteligente — Región Junín

## Estructura

```
PROYECTO-80-ING-WEB/
├── backend/          # API FastAPI (Python)
│   ├── app/
│   │   ├── api/v1/endpoints/   # Rutas por dominio (auth, lotes, cultivos…)
│   │   ├── schemas/            # Validaciones Pydantic
│   │   ├── services/           # Lógica de negocio
│   │   └── repositories/       # Acceso a datos + procedimientos almacenados
│   └── database/     # schema.sql, seeds, procedimientos almacenados
└── frontend/         # Angular 21 — Signal Forms
    └── src/app/features/   # Rutas modulares por feature
```

## Requisitos

- Python 3.11+
- Node.js 20+
- MySQL / MariaDB (XAMPP)

## Arquitectura (criterios del proyecto)

| Capa | Tecnología | Estructura |
|------|------------|------------|
| Frontend | Angular 21+ | Signal Forms, validaciones, rutas modulares por feature (`features/`) |
| Backend | FastAPI | Routers por dominio, schemas Pydantic, servicios, repositorios |
| Base de datos | MySQL 3FN | 14 tablas, 18 procedimientos almacenados, seeds demo |

## Instalación

```bash
# Backend
cd backend
pip install -r requirements.txt
copy .env.example .env

# Frontend
cd frontend
npm install

# Base de datos
cd ..
npm run seed
```

## Ejecutar

```bash
npm run backend   # http://localhost:3000/api
npm run frontend  # http://localhost:4200
npm run start     # ambos
```

## Credenciales demo

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@agrijunin.pe | Admin123! | administrador |
| maria.quispe@agrijunin.pe | Admin123! | agricultor |
| ana.tello@agrijunin.pe | Admin123! | tecnico |
