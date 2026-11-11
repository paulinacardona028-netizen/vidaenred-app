# Pruebas de punta a punta

Prueban la app en un navegador con viewport de teléfono (390×844), contra la API y PostgreSQL reales.

## Requisitos
1. PostgreSQL con la base `vidaenred` migrada y con datos de prueba (`npm run db:migrar && npm run db:seed` en `backend/`).
2. API corriendo en `http://localhost:3000`.
3. App web servida en `http://localhost:8081`:
   ```bash
   npx expo export --platform web --output-dir /tmp/web-out
   cd /tmp/web-out && python3 -m http.server 8081
   ```
4. Playwright: `pip install playwright && python3 -m playwright install chromium`

## Orden de ejecución
```bash
python3 e2e/01_registro_y_requisitos.py   # crea una cuenta nueva y guarda su correo en /tmp/ana.txt
python3 e2e/02_confirmacion_y_notificacion.py  # Juan confirma la solicitud de esa cuenta
python3 e2e/03_recuperar_contrasena.py
```

## Limitaciones conocidas
- En la versión web de react-native, `Alert.alert` no muestra diálogos. Los flujos que dependen de confirmar en un diálogo (cerrar solicitud, dejar de donar) se verifican por la API, no con estos scripts.
- En un teléfono real, `EXPO_PUBLIC_API_URL` debe apuntar a la IP de tu computador, no a `localhost`.
