import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRol } from "../middleware/roles.js";
import {
  evaluarElegibilidad,
  serializarDonante,
  validarRespuestasElegibilidad,
} from "../lib/reglas.js";

const router = Router();
router.use(requireAuth);

async function obtenerDonantePorId(id) {
  const { rows } = await query("SELECT * FROM donantes WHERE id = $1", [id]);
  return rows[0];
}

// GET /api/donante
router.get("/", async (req, res) => {
  const donante = await obtenerDonantePorId(req.donanteId);
  if (!donante) return res.status(404).json({ error: "Donante no encontrado." });
  res.json(serializarDonante(donante));
});

// PATCH /api/donante/disponibilidad  body: { disponible: boolean }
router.patch("/disponibilidad", requireRol("donante"), async (req, res) => {
  if (typeof req.body.disponible !== "boolean") {
    return res.status(400).json({ error: "El campo 'disponible' debe ser verdadero o falso." });
  }
  const { rows } = await query(
    "UPDATE donantes SET disponible = $1 WHERE id = $2 RETURNING *",
    [req.body.disponible, req.donanteId]
  );
  res.json(serializarDonante(rows[0]));
});

// PATCH /api/donante/roles  body: { esSolicitante?: boolean, esDonante?: boolean }
router.patch("/roles", async (req, res) => {
  const { esSolicitante, esDonante } = req.body;
  if (esSolicitante !== undefined && typeof esSolicitante !== "boolean") {
    return res.status(400).json({ error: "El campo 'esSolicitante' debe ser verdadero o falso." });
  }
  if (esDonante !== undefined && typeof esDonante !== "boolean") {
    return res.status(400).json({ error: "El campo 'esDonante' debe ser verdadero o falso." });
  }
  if (esDonante === true) {
    return res.status(400).json({
      error: "Para activar el rol de donante completa el formulario de requisitos.",
    });
  }

  const actual = await obtenerDonantePorId(req.donanteId);
  if (!actual) return res.status(404).json({ error: "Donante no encontrado." });

  const nuevoSolicitante = esSolicitante ?? actual.es_solicitante;
  const nuevoDonante = esDonante === false ? false : actual.es_donante;
  if (!nuevoSolicitante && !nuevoDonante) {
    return res.status(400).json({ error: "Debes tener al menos un rol activo." });
  }

  const { rows } = await query(
    "UPDATE donantes SET es_solicitante = $1, es_donante = $2 WHERE id = $3 RETURNING *",
    [nuevoSolicitante, nuevoDonante, req.donanteId]
  );
  res.json(serializarDonante(rows[0]));
});

// POST /api/donante/evaluacion  (ver reglas en reglas.js)
router.post("/evaluacion", async (req, res) => {
  const respuestas = req.body ?? {};
  const errores = validarRespuestasElegibilidad(respuestas);
  if (errores.length > 0) return res.status(400).json({ error: errores.join(" ") });

  const resultado = evaluarElegibilidad(respuestas);

  await query(
    `INSERT INTO evaluaciones_elegibilidad (donante_id, respuestas, cumple, motivos, reintentar_en)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      req.donanteId,
      JSON.stringify(respuestas),
      resultado.cumple,
      JSON.stringify(resultado.motivos),
      resultado.reintentarEn,
    ]
  );

  const { rows } = await query(
    `UPDATE donantes
     SET tipo_sangre = $1,
         es_donante = $2,
         es_solicitante = TRUE,
         disponible = CASE WHEN $2 THEN TRUE ELSE disponible END
     WHERE id = $3
     RETURNING *`,
    [respuestas.tipoSangre, resultado.cumple, req.donanteId]
  );

  res.json({
    cumple: resultado.cumple,
    motivos: resultado.motivos,
    reintentarEn: resultado.reintentarEn,
    donante: serializarDonante(rows[0]),
  });
});

// GET /api/donante/historial  donaciones completadas
router.get("/historial", async (req, res) => {
  const { rows } = await query(
    `SELECT dc.solicitud_id, dc.completada_en, s.hospital, s.tipo_sangre, s.urgencia
     FROM donaciones_completadas dc
     JOIN solicitudes s ON s.id = dc.solicitud_id
     WHERE dc.donante_id = $1
     ORDER BY dc.completada_en DESC`,
    [req.donanteId]
  );
  res.json(
    rows.map((r) => ({
      solicitudId: r.solicitud_id,
      hospital: r.hospital,
      tipoSangre: r.tipo_sangre,
      urgencia: r.urgencia,
      completadaEn: r.completada_en,
    }))
  );
});

// GET /api/donante/notificaciones
router.get("/notificaciones", async (req, res) => {
  const { rows } = await query(
    `SELECT id, tipo, mensaje, solicitud_id, leida, creada_en
     FROM notificaciones
     WHERE donante_id = $1
     ORDER BY creada_en DESC
     LIMIT 50`,
    [req.donanteId]
  );
  res.json(
    rows.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      mensaje: n.mensaje,
      solicitudId: n.solicitud_id,
      leida: n.leida,
      creadaEn: n.creada_en,
    }))
  );
});

// POST /api/donante/notificaciones/leer  marca todas como leídas
router.post("/notificaciones/leer", async (req, res) => {
  await query("UPDATE notificaciones SET leida = TRUE WHERE donante_id = $1", [req.donanteId]);
  res.json({ ok: true });
});

export default router;
