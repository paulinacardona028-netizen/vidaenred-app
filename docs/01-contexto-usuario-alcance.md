# 1. Contexto, usuarios y alcance

## Contexto del problema

Cuando una persona o un hospital necesita sangre con urgencia, el proceso suele depender de llamadas, cadenas de mensajes y de que alguien conozca a un donante compatible. Es lento, poco organizado y no permite saber qué donantes están disponibles en la ciudad.

**VidaEnRed** es una aplicación móvil que conecta de forma directa a quien necesita sangre con donantes compatibles cercanos, y muestra las entidades aliadas (hospitales, urgencias, bancos de sangre y clínicas) de la ciudad de cada persona.

## Usuarios

| Usuario | Qué necesita | Qué hace en la app |
|---|---|---|
| **Donante** | Saber dónde y cuándo puede donar | Activa su rol, completa el formulario de requisitos, ve solicitudes compatibles, confirma que puede donar y consulta su historial |
| **Solicitante** | Conseguir sangre para sí mismo o para un familiar | Publica una solicitud con la entidad, el tipo de sangre y la urgencia, ve quién confirmó y cierra la solicitud |
| **Persona con ambos roles** | Donar y, en otro momento, necesitar sangre | Cambia entre el modo Donar y el modo Solicitar |

## Caso de uso principal

**Solicitar sangre y conseguir un donante compatible.**

1. El solicitante inicia sesión y elige "Nueva solicitud".
2. Selecciona una entidad aliada de su ciudad, el tipo de sangre y la urgencia.
3. El sistema publica la solicitud y avisa a los donantes disponibles compatibles.
4. El donante ve la solicitud, abre el detalle y toca "Puedo donar".
5. El solicitante ve el donante en su lista, elige quién donó y cierra la solicitud.
6. El sistema registra la donación en el historial del donante.

## Alcance

**Incluye (versión actual):**

- Registro e inicio de sesión con contraseñas encriptadas y tokens JWT.
- Control de roles (donante, solicitante o ambos) verificado en el servidor.
- Formulario de requisitos para donar, con reglas de elegibilidad.
- Publicación, consulta, confirmación y cierre de solicitudes.
- Compatibilidad de tipos de sangre.
- Catálogo de entidades aliadas filtrado por ciudad.
- Ubicación de la entidad en Google Maps (ruta o búsqueda).
- Historial de donaciones y notificaciones dentro de la app.
- Recuperación de contraseña con código de un solo uso.
- Documentación de la API con OpenAPI (Swagger) y pruebas automatizadas.

**No incluye (por ahora):**

- Notificaciones push en el teléfono.
- Envío de correos electrónicos (la recuperación de contraseña aún muestra el código en el servidor de desarrollo).
- Pagos o cobros.
- Verificación de identidad de los donantes.
- Panel administrativo para gestionar entidades.

## MVP

El MVP es el **caso de uso principal completo**: registro, roles, formulario de requisitos, publicación de solicitudes, confirmación de donación, cierre con historial y ubicación en el mapa.

## Riesgos principales

Ver [06-negocio-riesgos-roadmap.md](06-negocio-riesgos-roadmap.md).
