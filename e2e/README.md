# Pruebas de punta a punta (solo base de prueba)

Estas pruebas crean cuentas y solicitudes reales en la base a la que apunten. Ejecútalas solo contra una base de prueba, nunca contra la base con datos reales.

## Requisitos
1. PostgreSQL con la base migrada (`npm run db:migrar` en `backend/`) y el catálogo importado (`npm run db:importar-entidades`).
2. Una entidad aliada ya importada, un donante con tipo O+ y su contraseña.
3. API en `http://localhost:3000`.
4. App web en `http://localhost:8081`:
   ```bash
   npx expo export --platform web --output-dir /tmp/web-out
   cd /tmp/web-out && python3 -m http.server 8081
   ```
5. Playwright: `pip install playwright && python3 -m playwright install chromium`

## Ejecución
```bash
export ENTIDAD="Nombre de la entidad aliada"
export DONANTE_CORREO="donante@correo.com"
export DONANTE_CLAVE="su-contraseña"
python3 e2e/01_registro_y_requisitos.py       # crea una cuenta nueva; guarda su correo en /tmp/ana.txt
python3 e2e/02_confirmacion_y_notificacion.py  # el donante confirma la solicitud de esa cuenta
python3 e2e/03_recuperar_contrasena.py
```

## Limitaciones
- En la versión web de react-native, `Alert.alert` no muestra diálogos. Los flujos que confirman en un diálogo (cerrar solicitud, dejar de donar) no se pueden probar con estos scripts.
- En un teléfono real, `EXPO_PUBLIC_API_URL` debe apuntar a la IP de tu computador, no a `localhost`.
