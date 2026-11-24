# 4. Calidad y pruebas

## Pruebas automatizadas del backend

Usan el corredor de pruebas integrado de Node.js (sin dependencias extra).

| Archivo | Tipo | Qué prueba | Cantidad |
|---|---|---|---|
| `backend/test/reglas.test.js` | Unitarias | Compatibilidad de sangre, validaciones, formulario de elegibilidad, utilidades | 33 |
| `backend/test/correo.test.js` | Unitarias | Envío del código de recuperación (Resend), sin llamar al servicio real | 4 |
| `backend/test/entidades.test.js` | Unitarias | Campo `logoUrl` de las entidades | 2 |
| `backend/test/api.test.js` | Integración | Endpoints reales contra PostgreSQL: autenticación, roles, solicitudes, cierre, entidades (incluido el límite de 3), errores | 27 |

Ejecución:

```bash
cd backend
TEST_DATABASE_URL=postgres://USUARIO:CLAVE@localhost:5432/vidaenred_test npm test
```

Las pruebas de integración **borran y recrean el esquema** de la base indicada en `TEST_DATABASE_URL`. Úsala siempre con una base de prueba, nunca con la base real. Si la variable no está definida, esas pruebas se omiten.

## Cobertura

```bash
cd backend
npm run test:cobertura
```

Resultado actual: **93 % de las líneas** (66 pruebas en total). El requisito mínimo del proyecto es 60 %. El script crea la carpeta `coverage/` si no existe, así que funciona en un clon limpio.

El reporte en formato `lcov` se genera en `backend/coverage/lcov.info` y es el que lee SonarCloud.

## Integración continua

El archivo `.github/workflows/ci.yml` ejecuta en cada *push* a `main` y en cada *Pull Request*:

1. **Backend:** levanta PostgreSQL 16 como servicio, instala dependencias, ejecuta las pruebas con cobertura y sube el reporte como artefacto.
2. **App:** verifica que TypeScript compila en modo estricto.
3. **Sonar:** se ejecuta solo si existe el secreto `SONAR_TOKEN`.

## Análisis de calidad (SonarCloud)

La configuración está en `sonar-project.properties`. Para activarlo:

1. Entra a sonarcloud.io con tu cuenta de GitHub y crea la organización `paulinacardona028-netizen`.
2. Importa el repositorio y crea el proyecto con la clave `paulinacardona028-netizen_vidaenred-app`.
3. Genera un token y guárdalo en GitHub como secreto **`SONAR_TOKEN`** (Settings → Secrets and variables → Actions).
4. El siguiente *push* ejecuta el análisis. Los resultados (bugs, vulnerabilidades, *code smells*, deuda técnica) aparecen en el panel de SonarCloud.

## Validación en la app

Las pruebas de punta a punta en navegador (carpeta `e2e/`) recorren el registro, el formulario de requisitos, el carrusel filtrado por ciudad, la confirmación de donación y la recuperación de contraseña. Se ejecutan contra un servidor de prueba y se describen en `e2e/README.md`.
