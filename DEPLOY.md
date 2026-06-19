# Despliegue en la nube — AgriJunín

Stack unificado: **un solo servicio** sirve API FastAPI + frontend Angular + MySQL en Railway.

## Arquitectura

```
Usuario → https://tu-app.up.railway.app
              ├── /api/*     → FastAPI
              └── /*         → Angular (SPA)
                    └── MySQL (servicio Railway)
```

## Despliegue automático (recomendado)

### 1. Crear cuenta en [Railway](https://railway.app)

### 2. Conectar GitHub

1. Railway → **New Project** → **Deploy from GitHub repo**
2. Selecciona `75535671-eng/AgriJunin` rama `Proyecto_terminado`

### 3. Añadir MySQL

1. En el proyecto → **+ New** → **Database** → **MySQL**
2. En el servicio de la app → **Variables** → **Add Reference** → selecciona las variables del MySQL

### 4. Variables de entorno del servicio web

| Variable | Valor |
|----------|-------|
| `ENV` | `production` |
| `JWT_SECRET` | (cadena aleatoria larga) |
| `MYSQLHOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQLPORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQLUSER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQLPASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `MYSQLDATABASE` | `${{MySQL.MYSQLDATABASE}}` |

Railway asigna `PORT` automáticamente.

### 5. Dominio público

Servicio web → **Settings** → **Networking** → **Generate Domain**

**URL en producción:** https://agrijunin-web-production.up.railway.app

## Verificación

```bash
curl https://agrijunin-web-production.up.railway.app/api/health
```

```bash
npm install -g @railway/cli
railway login
railway init
railway add --database mysql
railway up
railway domain
```

## Verificación

```bash
curl https://TU-DOMINIO.up.railway.app/api/health
```

Respuesta esperada: `"database": true`

Login demo: `admin@agrijunin.pe` / `Admin123!`

## Build local (Docker)

```bash
docker build -t agrijunin .
docker run -p 3000:3000 --env-file backend/.env agrijunin
```
