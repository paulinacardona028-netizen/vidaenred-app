# 5. Guía de instalación, ejecución y despliegue

## Requisitos

- Node.js 22
- PostgreSQL 14 o superior
- Para la app: Expo Go (iPhone o Android) o un emulador
- Git

## Ejecución local

### 1. Clonar y dependencias

```bash
git clone https://github.com/paulinacardona028-netizen/vidaenred-app.git
cd vidaenred-app
npm install
cd backend && npm install && cd ..
```

### 2. Base de datos

Crea una base vacía (por ejemplo `vidaenred`) y, en `backend/`:

```bash
cp .env.example .env          # ajusta DATABASE_URL y JWT_SECRET
npm run db:migrar             # crea o actualiza las tablas (no borra datos)
npm run db:importar-entidades # carga el catálogo desde data/entidades.csv
```

`data/entidades.csv` trae solo el encabezado: `nombre,tipo,ciudad,telefono,latitud,longitud,es_aliada,logo_url,prioridad`. Se llena con hospitales, urgencias, bancos de sangre y clínicas reales. La columna `logo_url` es opcional: si está vacía, la app muestra las iniciales de la entidad. Si se incluye, debe ser una URL https válida.

### 3. API

```bash
cd backend
npm run dev          # http://localhost:3000/api
npm run diagnostico  # verifica configuración, base de datos y acceso desde el celular
```

Documentación interactiva: **http://localhost:3000/api/docs**

### 4. App

En la raíz del proyecto:

```bash
npx expo start -c
```

Escanea el código QR con Expo Go. En desarrollo la app detecta sola la IP de tu computador; no hace falta configurar `EXPO_PUBLIC_API_URL`. El celular y el computador deben estar en la misma red.

## Pruebas

```bash
cd backend
TEST_DATABASE_URL=postgres://USUARIO:CLAVE@localhost:5432/vidaenred_test npm run test:cobertura
```

Ver [04-calidad-y-pruebas.md](04-calidad-y-pruebas.md).

## Despliegue en producción

### Backend y base de datos

El proyecto incluye `backend/Dockerfile` y `render.yaml` (Blueprint de Render). El contenedor aplica el esquema al arrancar (`npm run start:produccion`), así que las migraciones se ejecutan en cada despliegue.

Pasos:

1. Crear una base PostgreSQL gratuita (por ejemplo en **Neon**) y copiar su URL con `?sslmode=require`.
2. En **Render**: New → Blueprint → elegir el repositorio. Render lee `render.yaml`.
3. Pegar la `DATABASE_URL`. `JWT_SECRET` se genera sola.
4. Verificar `https://TU-API.onrender.com/api/health` → `{"ok":true}`.
5. Cargar el catálogo contra la base de producción con `npm run db:importar-entidades`.

### App móvil

1. `npx eas-cli login` y `npx eas-cli init` (una vez).
2. En `eas.json`, reemplazar `TU-API-EN-PRODUCCION` por la URL del backend.
3. Instalador para pruebas: `npx eas-cli build --profile preview --platform android` (genera APK).
4. Publicación: `npx eas-cli build --profile production --platform all` (genera AAB para Google Play).

## Variables de entorno

| Variable | Dónde | Obligatoria | Descripción |
|---|---|---|---|
| `DATABASE_URL` | backend | Sí | Conexión a PostgreSQL |
| `JWT_SECRET` | backend | Sí | Clave para firmar tokens (mínimo 32 caracteres) |
| `JWT_EXPIRA` | backend | No | Duración de la sesión (por defecto 7d) |
| `CORS_ORIGIN` | backend | No | Origen permitido para navegadores (por defecto `*`). La app móvil no usa CORS |
| `RESEND_API_KEY` | backend | Para recuperación por correo | Clave de API de Resend |
| `MAIL_FROM` | backend | Para recuperación por correo | Remitente verificado en Resend, por ejemplo `VidaEnRed <no-reply@tudominio.com>` |
| `NODE_ENV` | backend | No | `production` en el despliegue |
| `PORT` | backend | No | Puerto (por defecto 3000) |
| `TEST_DATABASE_URL` | backend | Solo pruebas | Base desechable para pruebas |
| `EXPO_PUBLIC_API_URL` | raíz | Solo producción | URL pública de la API |

Plantillas: `backend/.env.example` y `.env.example`.
