# VidaEnRed

Aplicación móvil (Expo / React Native) que conecta solicitudes de sangre con donantes compatibles cercanos, y permite que una misma cuenta sea donante, solicitante o ambos.

## Estructura

```
.                  App móvil (Expo, React Native, TypeScript)
├── src/           Pantallas, navegación, contexto y cliente de la API
├── e2e/           Pruebas de punta a punta (solo base de prueba)
├── eas.json       Perfiles de build para Expo Application Services
└── backend/       API REST (Express) con PostgreSQL
    ├── src/       Rutas, reglas de negocio y middleware
    ├── db/        Esquema SQL (idempotente)
    ├── scripts/   Migración e importación del catálogo de entidades
    ├── data/      entidades.csv: el catálogo lo llenan ustedes con datos reales
    └── Dockerfile Imagen de producción del backend
```

Para más detalle de la API, consulta `backend/README.md`.

## Desarrollo local

### 1. Backend y base de datos

Necesitas Node.js 22 y PostgreSQL 14 o superior.

```bash
cd backend
npm install
cp .env.example .env          # edita DATABASE_URL y JWT_SECRET
createdb vidaenred            # o créala desde pgAdmin
npm run db:migrar             # crea las tablas
npm run db:importar-entidades # carga el catálogo desde data/entidades.csv
npm run dev                   # API en http://localhost:3000/api
```

La base queda sin usuarios, solicitudes ni entidades hasta que las ingresen en la app y en el CSV. No hay datos de ejemplo.

### 2. Catálogo de entidades

Llena `backend/data/entidades.csv` con hospitales, urgencias, bancos de sangre y clínicas reales. El encabezado es `nombre,tipo,ciudad,telefono,latitud,longitud,es_aliada`. Si una fila tiene errores, el importador no guarda nada y te indica la línea. Después ejecuta `npm run db:importar-entidades`.

### 3. App

```bash
npm install
cp .env.example .env   # opcional, ver abajo
npx expo start -c
```

El celular o emulador no puede usar `localhost` para llegar a tu computador. Define `EXPO_PUBLIC_API_URL` con la IP de tu equipo en la red local:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api
```

En el emulador de Android puedes usar `http://10.0.2.2:3000/api`.

## Despliegue

### Backend

El backend se despliega como contenedor Docker en cualquier hosting que lo admita (Render, Railway, Fly.io, un VPS con Docker, etc.).

1. Crea una base PostgreSQL en tu proveedor y copia su URL de conexión.
2. Crea el servicio desde este repositorio con el directorio raíz `backend/`. El hosting usará el `Dockerfile`.
3. Define estas variables de entorno en el hosting:
   - `DATABASE_URL`: la URL de PostgreSQL (con `?sslmode=require` si tu proveedor lo pide).
   - `JWT_SECRET`: una clave larga y aleatoria. Genérala con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
   - `NODE_ENV=production`
   - `CORS_ORIGIN=*` (la app móvil no lo necesita; déjalo así)
   - `PORT` lo asigna normalmente el hosting.
4. Al arrancar, el contenedor aplica el esquema (`npm run db:migrar`, que se puede repetir sin problemas) y luego inicia la API. Revisa que `https://TU-API/api/health` responda `{"ok":true}`.
5. Importa el catálogo de entidades ejecutando `npm run db:importar-entidades` contra la base de producción, después de llenar `backend/data/entidades.csv`.

### App móvil con EAS

Usamos Expo Application Services (EAS) para generar los instaladores.

1. Instala la herramienta y entra a tu cuenta de Expo:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Vincula el proyecto a tu cuenta (una sola vez). Esto crea un `projectId` en `app.json`:
   ```bash
   eas init
   ```
3. Reemplaza `TU-API-EN-PRODUCCION` en `eas.json` por la URL pública de tu backend, por ejemplo `https://vidaenred-api.onrender.com`.
4. Genera un instalador para probar con personas reales:
   ```bash
   eas build --profile preview --platform android   # genera un APK instalable
   ```
   Comparte el enlace del APK. Para iOS se necesita una cuenta de Apple Developer.
5. Para publicar en las tiendas:
   ```bash
   eas build --profile production --platform all
   eas submit --profile production --platform all
   ```

Los identificadores de la app son `com.vidaenred.app`. Si tienen un dominio propio, cámbialos en `app.json` antes de publicar, porque no se pueden modificar después de subir la app a una tienda.

## Pendientes antes de publicar

- **Umbrales médicos** en `backend/src/lib/reglas.js`: edad, peso, intervalos de donación y tiempos de espera. Están marcados como provisionales y deben validarse con un banco de sangre.
- **Envío de correos** para recuperar contraseña. Hoy el código solo aparece en la consola del servidor en desarrollo.
- **Notificaciones push.** Las notificaciones actuales son solo dentro de la app.
- **Pruebas en dispositivo real.** Las pruebas automatizadas de `e2e/` corren en el navegador, no en Android ni iOS.
