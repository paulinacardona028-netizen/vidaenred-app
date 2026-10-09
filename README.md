# VidaEnRed

App móvil (Expo / React Native) para conectar solicitudes de sangre con donantes compatibles cercanos.

Estructura:

- `src/` – app móvil
- `backend/` – API REST con Express y PostgreSQL (ver `backend/README.md`)

## 1. Levantar el backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:migrar
npm run db:seed
npm run dev
```

## 2. Levantar la app

```bash
npm install
npx expo start
```

Si usas un celular físico o un emulador, la app no puede usar `localhost` para llegar a tu computador. Crea un archivo `.env` en la raíz con la IP de tu equipo en la red local:

```
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api
```

Reemplaza `192.168.1.20` por tu IP (en Windows `ipconfig`, en macOS/Linux `ifconfig` o `ip addr`). Después reinicia Expo con `npx expo start -c`.
En el emulador de Android puedes usar `http://10.0.2.2:3000/api`.

## Funcionalidades

- Registro e inicio de sesión con contraseña cifrada y sesión por token JWT.
- Lista de solicitudes filtradas por compatibilidad de sangre.
- Confirmación de donación, con validación en el servidor.
- Publicación de nuevas solicitudes.
- Disponibilidad del donante, guardada en la base de datos.

## Pendientes conocidos

- La sesión se pierde al cerrar la app (el token vive en memoria). Para persistirla, usar `@react-native-async-storage/async-storage`.
- La distancia a los hospitales no se calcula todavía; se muestra solo cuando existe en la base de datos.
- `donacionesRealizadas` no se incrementa automáticamente; hace falta un flujo para marcar donaciones completadas.
