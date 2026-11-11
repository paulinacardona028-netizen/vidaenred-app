# VidaEnRed – API

API REST en Node.js (Express 5) con PostgreSQL.

## Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env        # edita DATABASE_URL y JWT_SECRET
createdb vidaenred          # o crea la base desde pgAdmin
npm run db:migrar           # crea las tablas
npm run db:importar-entidades  # carga el catálogo desde data/entidades.csv (llénalo con datos reales)
npm run dev                 # servidor en http://localhost:3000
```

Las cuentas, solicitudes y entidades se crean con datos reales desde la app y la importación; no hay datos de ejemplo.

## Endpoints

Todas las rutas excepto `auth` y `health` requieren el header `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| POST | `/api/auth/registro` | Crea cuenta. Body: `nombre, correo, contrasena, tipoSangre, ciudad` |
| POST | `/api/auth/login` | Inicia sesión. Body: `correo, contrasena`. Devuelve `token` y `donante` |
| GET | `/api/donante` | Perfil del donante logueado |
| PATCH | `/api/donante/disponibilidad` | Body: `{ "disponible": true }` |
| GET | `/api/solicitudes/compatibles` | Solicitudes activas que el donante puede atender |
| GET | `/api/solicitudes/:id` | Detalle de una solicitud |
| POST | `/api/solicitudes` | Publica solicitud. Body: `tipoSangre, hospital, urgencia` |
| POST | `/api/solicitudes/:id/donaciones` | Confirma que puede donar (valida compatibilidad y duplicados) |

Errores: `400` datos inválidos, `401` sin sesión o credenciales incorrectas, `403` tipo de sangre incompatible, `404` no encontrado, `409` conflicto (correo duplicado o confirmación repetida).

## Reglas de negocio en el servidor

- Un donante solo ve y confirma solicitudes de tipos de sangre compatibles (tabla `COMPATIBILIDAD_DONANTE` en `src/lib/reglas.js`).
- La contraseña se guarda cifrada con bcrypt; nunca se devuelve en las respuestas.
- Una misma persona no puede confirmar dos veces la misma solicitud.
