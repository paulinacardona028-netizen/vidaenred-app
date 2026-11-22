# 2. Diagramas

Todos los diagramas están escritos en **Mermaid**, que GitHub muestra directamente. Corresponden al sistema tal como está implementado.

## 2.1 Diagrama de casos de uso

```mermaid
flowchart LR
  donante([Donante])
  solicitante([Solicitante])
  sistema([Sistema de la API])

  donante --- uc1((Registrarse e iniciar sesión))
  donante --- uc2((Completar formulario de requisitos))
  donante --- uc3((Ver solicitudes compatibles))
  donante --- uc4((Confirmar que puedo donar))
  donante --- uc5((Consultar historial))
  donante --- uc6((Ver ubicación en Google Maps))

  solicitante --- uc1
  solicitante --- uc7((Publicar solicitud))
  solicitante --- uc8((Ver quién confirmó))
  solicitante --- uc9((Cerrar solicitud))
  solicitante --- uc6

  uc7 -. incluye .-> uc10((Elegir entidad aliada de mi ciudad))
  uc4 -. dispara .-> uc11((Notificar al solicitante))
  uc7 -. dispara .-> uc12((Notificar a donantes compatibles))
  uc9 -. registra .-> uc13((Historial del donante))
  sistema --- uc12
  sistema --- uc13
```

## 2.2 Diagrama de secuencia: confirmar una donación

```mermaid
sequenceDiagram
  actor D as Donante
  participant App as App móvil
  participant API as API (Express)
  participant DB as PostgreSQL

  D->>App: Toca "Puedo donar"
  App->>API: POST /api/solicitudes/{id}/donaciones (Bearer token)
  API->>API: requireAuth: verifica el JWT
  API->>DB: Consulta el rol de donante
  API->>API: requireRol("donante")
  API->>DB: Lee la solicitud y el tipo del donante
  API->>API: Valida estado activa y compatibilidad de sangre
  alt Ya confirmó o solicitud cerrada
    API-->>App: 409 Conflict
  else Incompatible
    API-->>App: 403 Forbidden
  else Válido
    API->>DB: INSERT donaciones_confirmadas
    API->>DB: INSERT notificaciones (para el solicitante)
    API-->>App: 200 Solicitud actualizada
    App-->>D: Pantalla de confirmación
  end
```

## 2.3 Diagrama de secuencia: cerrar una solicitud

```mermaid
sequenceDiagram
  actor S as Solicitante
  participant App as App móvil
  participant API as API
  participant DB as PostgreSQL

  S->>App: Elige donantes que sí donaron y toca "Cerrar"
  App->>API: POST /api/solicitudes/{id}/resolver { donantesIds }
  API->>DB: Verifica que la cuenta es la dueña de la solicitud
  API->>DB: UPDATE solicitud SET estado = resuelta
  loop Por cada donante que confirmó
    API->>DB: INSERT donaciones_completadas
    API->>DB: UPDATE donantes SET donaciones_realizadas + 1
    API->>DB: INSERT notificaciones (para el donante)
  end
  API-->>App: 200 Solicitud cerrada
```

## 2.4 Diagrama entidad-relación

```mermaid
erDiagram
  DONANTES ||--o{ SOLICITUDES : "publica"
  ENTIDADES |o--o{ SOLICITUDES : "atiende"
  SOLICITUDES ||--o{ DONACIONES_CONFIRMADAS : "recibe"
  DONANTES ||--o{ DONACIONES_CONFIRMADAS : "confirma"
  SOLICITUDES ||--o{ DONACIONES_COMPLETADAS : "cierra con"
  DONANTES ||--o{ DONACIONES_COMPLETADAS : "dona"
  DONANTES ||--o{ NOTIFICACIONES : "recibe"
  SOLICITUDES |o--o{ NOTIFICACIONES : "origina"
  DONANTES ||--o{ EVALUACIONES_ELEGIBILIDAD : "completa"
  DONANTES ||--o{ RECUPERACIONES_CONTRASENA : "solicita"

  DONANTES {
    uuid id PK
    text nombre
    text correo UK
    text contrasena_hash
    text tipo_sangre
    text ciudad
    date fecha_nacimiento
    boolean disponible
    int donaciones_realizadas
    boolean es_donante
    boolean es_solicitante
  }
  SOLICITUDES {
    uuid id PK
    uuid solicitante_id FK
    uuid entidad_id FK
    text tipo_sangre
    text hospital
    text ciudad
    text urgencia
    text estado
    text paciente_nombre
    text contacto_telefono
    timestamptz creada_en
    timestamptz resuelta_en
  }
  ENTIDADES {
    uuid id PK
    text nombre
    text tipo
    text ciudad
    numeric latitud
    numeric longitud
    boolean es_aliada
  }
  DONACIONES_CONFIRMADAS {
    uuid solicitud_id PK
    uuid donante_id PK
    timestamptz confirmado_en
  }
  DONACIONES_COMPLETADAS {
    uuid solicitud_id PK
    uuid donante_id PK
    timestamptz completada_en
  }
  NOTIFICACIONES {
    uuid id PK
    uuid donante_id FK
    uuid solicitud_id FK
    text tipo
    boolean leida
  }
  EVALUACIONES_ELEGIBILIDAD {
    uuid id PK
    uuid donante_id FK
    jsonb respuestas
    boolean cumple
    date reintentar_en
  }
  RECUPERACIONES_CONTRASENA {
    uuid id PK
    uuid donante_id FK
    text codigo_hash
    timestamptz expira_en
    boolean usada
  }
```

**Integridad referencial:** las claves foráneas usan `ON DELETE CASCADE` para datos que dependen de una cuenta (notificaciones, evaluaciones, recuperaciones) y `ON DELETE SET NULL` cuando la solicitud debe sobrevivir a la borrada de una entidad.

## 2.5 Diagrama de componentes

```mermaid
flowchart LR
  subgraph Cliente
    app[App móvil<br/>Expo / React Native]
  end
  subgraph Servidor
    api[API REST<br/>Express 5 + JWT]
    reglas[[Reglas de negocio<br/>compatibilidad, elegibilidad]]
    notif[[Notificaciones<br/>dentro de la app]]
  end
  subgraph Datos
    db[(PostgreSQL)]
  end
  maps[Google Maps<br/>externo]
  docs[Swagger UI<br/>/api/docs]

  app -- "REST / JSON<br/>Bearer JWT" --> api
  api --> reglas
  api --> notif
  api -- "pg (SQL)" --> db
  app -- "Linking: abre ruta" --> maps
  docs -- "lee openapi.json" --> api
```

## 2.6 Diagrama de arquitectura (infraestructura)

```mermaid
flowchart TB
  dev[Desarrollador<br/>GitHub] -->|push| gh[GitHub]
  gh -->|dispara| ci[GitHub Actions<br/>pruebas, cobertura, tipos]
  ci -->|análisis| sonar[SonarCloud<br/>calidad y cobertura]
  gh -->|despliegue automático| render[Render<br/>API en Docker]
  render -->|SQL| neon[(Neon<br/>PostgreSQL en la nube)]
  celular[App en el celular<br/>Expo Go / APK] -->|HTTPS REST| render
  celular -->|abre| maps[Google Maps]
  eas[EAS Build] -->|genera APK / AAB| celular
```
