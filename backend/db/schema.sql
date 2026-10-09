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
