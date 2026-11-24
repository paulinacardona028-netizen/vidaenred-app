# 6. Negocio, mercado, riesgos y roadmap

> Este documento contiene propuestas y puntos a validar. Las cifras de mercado deben completarse con fuentes verificables antes de la entrega.

## Modelo de monetización (propuesta)

VidaEnRed es un servicio social. La monetización propuesta **no cobra a los donantes ni a quien necesita sangre**:

- **Convenios institucionales:** las entidades aliadas (hospitales, bancos de sangre, clínicas) pagan una suscripción para aparecer destacadas y recibir reportes de donantes disponibles en su ciudad.
- **Versión para empresas:** programas de donación corporativa, con panel de seguimiento para el área de bienestar.
- **Campañas de sensibilización** financiadas por patrocinadores, sin publicidad dentro de las pantallas de emergencia.

**Por validar:** precios, disposición a pagar de las entidades y viabilidad legal de los convenios.

## Estrategia de visibilidad (propuesta)

- Campaña en redes sociales con historias reales (con consentimiento) de solicitudes atendidas.
- Alianzas con universidades y grupos de donantes voluntarios.
- Presencia en tiendas de aplicaciones con descripción clara y capturas de pantalla.
- Trabajo con las entidades aliadas para que la compartan con sus pacientes y donantes.

## Estudio de mercado y soluciones similares

**Por completar:** investigar y documentar al menos tres soluciones existentes, indicando qué resuelven, cuál es su modelo y qué les falta. Como punto de partida conviene revisar: plataformas de donación de sangre de bancos y fundaciones, grupos de donantes en redes sociales y aplicaciones de emergencias médicas.

## Diferenciadores

- **Por ciudad:** muestra solo las entidades aliadas y los donantes de la ciudad de cada persona.
- **Compatibilidad automática:** solo llega la solicitud a quien puede donar ese tipo de sangre.
- **Formulario de requisitos:** evalúa la elegibilidad antes de activar el rol de donante.
- **Un solo perfil para dos roles:** la misma persona puede donar y, en otro momento, solicitar para un familiar.
- **Privacidad:** el teléfono de contacto de quien solicita no se muestra a los donantes.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Umbrales médicos incorrectos en el formulario | Alto: una persona no apta podría donar | Marcar los valores como provisionales, validarlos con un banco de sangre antes de usarlos con personas reales y aclarar que la decisión final es médica |
| Solicitudes falsas o de broma | Medio | Solo entidades aliadas cargadas por el equipo; cierre de solicitudes por su dueño; posibilidad de reportar (pendiente) |
| Pérdida de datos personales | Alto | Contraseñas encriptadas (bcrypt), tokens JWT, teléfonos que no se devuelven, copias de seguridad de la base |
| Caída del servicio en el plan gratuito | Medio | Plan de pago cuando haya uso real; el servicio gratuito se duerme tras inactividad |
| Dependencia de la red para emergencias | Medio | Registrar la entidad y su teléfono para llamar directamente desde la app |
| Baja adopción por donantes | Alto | Campañas, alianzas y mensajes de recordatorio (pendiente) |
| Cumplimiento de protección de datos personales | Alto | Revisar la política de tratamiento de datos antes de publicar; minimizar datos de salud almacenados |

## Roadmap

**Corto plazo (entrega del proyecto):**
- Desplegar backend y base de datos en la nube y generar el APK.
- Completar la documentación de mercado y los diagramas faltantes.
- Validar los umbrales médicos.

**Mediano plazo:**
- Plantillas de correo más completas y registro de envíos.
- Notificaciones push en el teléfono.
- Panel administrativo para entidades.
- Reportar solicitudes sospechosas.

**Largo plazo:**
- Versión para empresas.
- Estadísticas de donación por ciudad.
- Integración con bancos de sangre para confirmar donaciones reales.
