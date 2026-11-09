import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRol } from "../middleware/roles.js";
import {
  esUUID,
  serializarSolicitud,
  tiposCompatiblesCon,
  validarSolicitud,
} from "../lib/reglas.js";

const router = Router();
router.use(requireAuth);

// Consulta base. $1 siempre es el id del donante que consulta.
// Incluye la ubicación de la entidad para que la app pueda abrir el mapa.
const SQL_SOLICITUDES = `
  SELECT s.id, s.tipo_sangre, s.hospital, s.ciudad, s.distancia_km,
         s.urgencia, s.estado, s.creada_en, s.entidad_id,
         e.latitud, e.longitud,
         COALESCE(
           array_agg(d.nombre ORDER BY dc.confirmado_en) FILTER (WHERE d.id IS NOT NULL),
           '{}'
         ) AS donantes_confirmados,
         COALESCE(bool_or(d.id = $1), false) AS ya_confirmo
  FROM solicitudes s
  LEFT JOIN entidades e ON e.id = s.entidad_id
  LEFT JOIN donaciones_confirmadas dc ON dc.solicitud_id = s.id
  LEFT JOIN donantes d ON d.id = dc.donante_id
`;

async function obtenerSolicitudSerializada(solicitudId, donanteId) {
  const { rows } = await query(
    `${SQL_SOLICITUDES} WHERE s.id = $2 GROUP BY s.id, e.id`,
    [donanteId, solicitudId]
  );
  return rows[0] ? serializarSolicitud(rows[0]) : null;
}

// GET /api/solicitudes/compatibles  (requiere rol donante, solo disponibles)
router.get("/compatibles", requireRol("donante"), async (req, res) => {
  const { rows: donantes } = await query(
    "SELECT tipo_sangre, disponible FROM donantes WHERE id = $1",
    [req.donanteId]
  );
  const donante = donantes[0];
  if (!donante) return res.status(404).json({ error: "Donante no encontrado." });
  if (!donante.disponible) return res.json([]);

  const tipos = tiposCompatiblesCon(donante.tipo_sangre);
  const { rows } = await query(
    `${SQL_SOLICITUDES}
     WHERE s.estado = 'activa' AND s.tipo_sangre = ANY($2)
     GROUP BY s.id, e.id
     ORDER BY s.creada_en DESC`,
    [req.donanteId, tipos]
  );
  res.json(rows.map(serializarSolicitud));
});

// GET /api/solicitudes/:id
router.get("/:id", async (req, res) => {
  if (!esUUID(req.params.id)) return res.status(404).json({ error: "Solicitud no encontrada." });
  const solicitud = await obtenerSolicitudSerializada(req.params.id, req.donanteId);
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });
  res.json(solicitud);
});

// POST /api/solicitudes  (requiere rol solicitante)
// body: { tipoSangre, urgencia, entidadId? | hospital, pacienteNombre?, contactoTelefono? }
// Si se envía entidadId, el hospital y la ciudad se toman del catálogo.
router.post("/", requireRol("solicitante"), async (req, res) => {
  const datos = {
    tipoSangre: req.body.tipoSangre,
    hospital: req.body.hospital?.trim(),
    urgencia: req.body.urgencia,
    entidadId: req.body.entidadId,
  };

  if (datos.entidadId !== undefined && !esUUID(datos.entidadId)) {
    return res.status(400).json({ error: "La entidad no es válida." });
  }

  const errores = validarSolicitud(datos);
  if (errores.length > 0) return res.status(400).json({ error: errores.join(" ") });

  let entidad = null;
  if (datos.entidadId) {
    const { rows } = await query("SELECT * FROM entidades WHERE id = $1", [datos.entidadId]);
    entidad = rows[0];
    if (!entidad) return res.status(404).json({ error: "La entidad no existe." });
  }

  const { rows: donantes } = await query("SELECT ciudad FROM donantes WHERE id = $1", [
    req.donanteId,
  ]);
  if (donantes.length === 0) return res.status(404).json({ error: "Donante no encontrado." });

  const hospital = entidad ? entidad.nombre : datos.hospital;
  const ciudad = entidad ? entidad.ciudad : donantes[0].ciudad;

  const { rows } = await query(
    `INSERT INTO solicitudes
       (solicitante_id, tipo_sangre, hospital, ciudad, urgencia, entidad_id, paciente_nombre, contacto_telefono)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      req.donanteId,
      datos.tipoSangre,
      hospital,
      ciudad,
      datos.urgencia,
      entidad ? entidad.id : null,
      req.body.pacienteNombre?.trim() || null,
      req.body.contactoTelefono?.trim() || null,
    ]
  );

  res.status(201).json(await obtenerSolicitudSerializada(rows[0].id, req.donanteId));
});

// POST /api/solicitudes/:id/donaciones  (requiere rol donante)
router.post("/:id/donaciones", requireRol("donante"), async (req, res) => {
  if (!esUUID(req.params.id)) return res.status(404).json({ error: "Solicitud no encontrada." });

  const { rows: solicitudes } = await query(
    "SELECT id, tipo_sangre, estado FROM solicitudes WHERE id = $1",
    [req.params.id]
  );
  const solicitud = solicitudes[0];
  if (!solicitud) return res.status(404).json({ error: "Solicitud no encontrada." });
  if (solicitud.estado !== "activa") {
    return res.status(409).json({ error: "Esta solicitud ya no está activa." });
  }

  const { rows: donantes } = await query("SELECT tipo_sangre FROM donantes WHERE id = $1", [
    req.donanteId,
  ]);
  if (!tiposCompatiblesCon(donantes[0].tipo_sangre).includes(solicitud.tipo_sangre)) {
    return res.status(403).json({ error: "Tu tipo de sangre no es compatible con esta solicitud." });
  }

  const insercion = await query(
    `INSERT INTO donaciones_confirmadas (solicitud_id, donante_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [solicitud.id, req.donanteId]
  );
  if (insercion.rowCount === 0) {
    return res.status(409).json({ error: "Ya confirmaste que puedes donar para esta solicitud." });
  }

  res.json(await obtenerSolicitudSerializada(solicitud.id, req.donanteId));
});

export default router;
