# VidaEnRed

[![CI](https://github.com/paulinacardona028-netizen/vidaenred-app/actions/workflows/ci.yml/badge.svg)](https://github.com/paulinacardona028-netizen/vidaenred-app/actions/workflows/ci.yml)

Aplicación móvil que conecta a personas que necesitan sangre con donantes compatibles cercanos. Una misma cuenta puede ser donante, solicitante o ambos, y la app muestra las entidades aliadas (hospitales, urgencias, bancos de sangre y clínicas) de la ciudad de cada persona.

## Documentación

Toda la documentación está en la carpeta [`docs/`](docs/README.md):

- [Contexto, usuarios y alcance](docs/01-contexto-usuario-alcance.md)
- [Diagramas: casos de uso, secuencia, entidad-relación, componentes y arquitectura](docs/02-diagramas.md)
- [API REST](docs/03-api.md) · API interactiva en `/api/docs` del backend
- [Calidad y pruebas](docs/04-calidad-y-pruebas.md)
- [Instalación y despliegue](docs/05-instalacion-y-despliegue.md)
- [Negocio, riesgos y roadmap](docs/06-negocio-riesgos-roadmap.md)

## Tecnologías

| Parte | Tecnologías |
|---|---|
| App móvil | Expo SDK 58, React Native, TypeScript (modo estricto) |
| Backend | Node.js 22, Express 5, JWT, bcrypt |
| Base de datos | PostgreSQL |
| Pruebas | Node test runner (66 pruebas), cobertura 93 % líneas |
| Calidad | SonarCloud (`sonar-project.properties`) |
| CI/CD | GitHub Actions, Docker, Render, EAS Build |

## Estructura

```
├── src/                 App móvil: pantallas, componentes, contexto, servicios
├── backend/
│   ├── src/             API: rutas, reglas de negocio, middleware, base de datos
│   ├── test/            Pruebas unitarias y de integración
│   ├── scripts/         Migración, importación de catálogo, diagnóstico
│   ├── db/              Esquema SQL (idempotente)
│   ├── docs/            Especificación OpenAPI
│   └── Dockerfile
├── e2e/                 Pruebas de punta a punta en navegador
├── docs/                Documentación del proyecto
└── .github/workflows/   Integración continua
```

## Inicio rápido

```bash
# 1. Dependencias
npm install && cd backend && npm install && cd ..

# 2. Base de datos y API (en backend/, copia .env.example a .env antes)
cd backend
npm run db:migrar
npm run dev

# 3. App (en la raíz, otra terminal)
npx expo start -c
```

Guía completa: [docs/05-instalacion-y-despliegue.md](docs/05-instalacion-y-despliegue.md).

## Pruebas

```bash
cd backend
TEST_DATABASE_URL=postgres://USUARIO:CLAVE@localhost:5432/vidaenred_test npm run test:cobertura
```

Usa siempre una base de datos de prueba: las pruebas de integración borran y recrean el esquema.

## Estado del proyecto

Lo implementado y probado está en la [sección de alcance](docs/01-contexto-usuario-alcance.md#alcance). Pendientes conocidos: notificaciones push y validación de los umbrales médicos con un banco de sangre. El código de recuperación se envía por correo con Resend (ver `RESEND_API_KEY` y `MAIL_FROM` en `backend/.env.example`).
