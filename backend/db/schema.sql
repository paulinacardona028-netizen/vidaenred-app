-- Esquema de VidaEnRed. Es idempotente: se puede ejecutar varias veces.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS donantes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                TEXT NOT NULL,
  correo                TEXT NOT NULL UNIQUE,
  contrasena_hash       TEXT NOT NULL,
  tipo_sangre           TEXT NOT NULL
                        CHECK (tipo_sangre IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  ciudad                TEXT NOT NULL,
  disponible            BOOLEAN NOT NULL DEFAULT TRUE,
  donaciones_realizadas INTEGER NOT NULL DEFAULT 0 CHECK (donaciones_realizadas >= 0),
  creado_en             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID REFERENCES donantes(id) ON DELETE SET NULL,
  tipo_sangre    TEXT NOT NULL
                 CHECK (tipo_sangre IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  hospital       TEXT NOT NULL,
  ciudad         TEXT NOT NULL,
  distancia_km   NUMERIC(6,2),
  urgencia       TEXT NOT NULL CHECK (urgencia IN ('Alta','Moderada','Programada')),
  estado         TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','resuelta')),
  creada_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_tipo
  ON solicitudes (estado, tipo_sangre);

-- Relación muchos a muchos: qué donantes confirmaron que pueden donar a cada solicitud
CREATE TABLE IF NOT EXISTS donaciones_confirmadas (
  solicitud_id  UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  donante_id    UUID NOT NULL REFERENCES donantes(id) ON DELETE CASCADE,
  confirmado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (solicitud_id, donante_id)
);

-- ── Roles de cuenta: una persona puede ser donante, solicitante o ambos ──
ALTER TABLE donantes ADD COLUMN IF NOT EXISTS es_donante BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE donantes ALTER COLUMN es_donante SET DEFAULT FALSE;
ALTER TABLE donantes ADD COLUMN IF NOT EXISTS es_solicitante BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE donantes ALTER COLUMN tipo_sangre DROP NOT NULL;

-- ── Entidades aliadas o del directorio (hospitales, urgencias, bancos de sangre, clínicas) ──
CREATE TABLE IF NOT EXISTS entidades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('Hospital','Urgencias','Banco de sangre','Clínica')),
  ciudad     TEXT NOT NULL,
  telefono   TEXT,
  latitud    NUMERIC(9,6),
  longitud   NUMERIC(9,6),
  es_aliada  BOOLEAN NOT NULL DEFAULT FALSE
);
-- Logo opcional (URL https). Si está vacío, la app muestra las iniciales de la entidad.
ALTER TABLE entidades ADD COLUMN IF NOT EXISTS logo_url TEXT;
-- Prioridad para destacar en el carrusel: 1 = la más conocida de la ciudad. Vacía = sin destacar.
ALTER TABLE entidades ADD COLUMN IF NOT EXISTS prioridad INTEGER;

-- ── Historial de evaluaciones del formulario de requisitos ──
CREATE TABLE IF NOT EXISTS evaluaciones_elegibilidad (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donante_id    UUID NOT NULL REFERENCES donantes(id) ON DELETE CASCADE,
  respuestas    JSONB NOT NULL,
  cumple        BOOLEAN NOT NULL,
  motivos       JSONB NOT NULL DEFAULT '[]',
  reintentar_en DATE,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Solicitudes: enlace a entidad, datos del paciente y contacto privado ──
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS entidad_id UUID REFERENCES entidades(id) ON DELETE SET NULL;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS paciente_nombre TEXT;
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;

-- ── Cierre de solicitudes y donaciones completadas (historial) ──
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS resuelta_en TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS donaciones_completadas (
  solicitud_id  UUID NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  donante_id    UUID NOT NULL REFERENCES donantes(id) ON DELETE CASCADE,
  completada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (solicitud_id, donante_id)
);

-- ── Notificaciones dentro de la app ──
CREATE TABLE IF NOT EXISTS notificaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donante_id   UUID NOT NULL REFERENCES donantes(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,
  mensaje      TEXT NOT NULL,
  solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
  leida        BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notificaciones_donante ON notificaciones (donante_id, creada_en DESC);

-- ── Recuperación de contraseña (código de un solo uso) ──
CREATE TABLE IF NOT EXISTS recuperaciones_contrasena (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donante_id  UUID NOT NULL REFERENCES donantes(id) ON DELETE CASCADE,
  codigo_hash TEXT NOT NULL,
  expira_en   TIMESTAMPTZ NOT NULL,
  usada       BOOLEAN NOT NULL DEFAULT FALSE,
  creada_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Fecha de nacimiento del usuario (obligatoria al registrarse; nullable para cuentas antiguas) ──
ALTER TABLE donantes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
