# 3. API REST

La documentación completa e interactiva está en **`/api/docs`** (Swagger UI) y la especificación en **`/api/docs/openapi.json`** (OpenAPI 3.0). Ambas se publican desde el mismo backend.

## Convenciones

- **Base:** `/api`. Formato de datos: JSON (`Content-Type: application/json`).
- **Autenticación:** header `Authorization: Bearer <token>`. El token se obtiene en `/auth/registro` o `/auth/login` y dura 7 días por defecto.
- **Errores:** siempre responden `{ "error": "mensaje legible" }`.

| Código | Significado en esta API |
|---|---|
| 200 | Operación exitosa |
| 201 | Recurso creado (cuenta, solicitud) |
| 400 | Datos no válidos o cuerpo que no es JSON |
| 401 | Sin sesión o token vencido |
| 403 | Sesión válida, pero sin el rol necesario, o tipo de sangre incompatible |
| 404 | Recurso no encontrado |
| 409 | Conflicto: correo repetido, donación ya confirmada, solicitud ya cerrada |
| 429 | Demasiados intentos (login, recuperación o restablecimiento); se libera tras 15 minutos |
| 500 | Error interno. Se registra en el servidor y el cliente recibe un mensaje genérico |

## Endpoints

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servicio |
| POST | `/auth/registro` | Público | Crear cuenta |
| POST | `/auth/login` | Público | Iniciar sesión |
| POST | `/auth/recuperar` | Público | Solicitar código de recuperación |
| POST | `/auth/restablecer` | Público | Cambiar contraseña con el código |
| GET | `/donante` | Autenticado | Perfil de la cuenta |
| PATCH | `/donante/disponibilidad` | Donante | Activar o pausar la disponibilidad |
| PATCH | `/donante/roles` | Autenticado | Cambiar roles |
| POST | `/donante/evaluacion` | Autenticado | Formulario de requisitos para donar |
| GET | `/donante/historial` | Autenticado | Donaciones completadas |
| GET | `/donante/notificaciones` | Autenticado | Notificaciones |
| POST | `/donante/notificaciones/leer` | Autenticado | Marcar notificaciones como leídas |
| GET | `/entidades` | Público | Entidades aliadas (filtros `tipo`, `ciudad`) |
| GET | `/ciudades` | Público | Ciudades válidas |
| GET | `/solicitudes/compatibles` | Donante | Solicitudes compatibles |
| GET | `/solicitudes/mias` | Solicitante | Mis solicitudes |
| POST | `/solicitudes` | Solicitante | Publicar solicitud |
| GET | `/solicitudes/:id` | Autenticado | Detalle de una solicitud |
| POST | `/solicitudes/:id/donaciones` | Donante | Confirmar que puedo donar |
| POST | `/solicitudes/:id/resolver` | Solicitante dueño | Cerrar solicitud y registrar donaciones |

## Seguridad

- Las contraseñas se guardan con **bcrypt**. Nunca se devuelven en las respuestas.
- Los roles se verifican en **cada petición** consultando la base de datos, así que desactivar un rol surte efecto de inmediato.
- El teléfono de contacto de una solicitud **nunca** se incluye en las respuestas.
- El login y el registro responden el mismo mensaje si el correo no existe o la contraseña es incorrecta.
- La recuperación de contraseña responde igual exista o no el correo.
