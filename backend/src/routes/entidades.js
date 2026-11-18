import { Router } from "express";
import { query } from "../db.js";
import { TIPOS_ENTIDAD, serializarEntidad } from "../lib/reglas.js";
import { normalizarCiudad } from "../lib/ciudades.js";

// Catálogo público: no requiere sesión, así el carrusel de inicio funciona siempre.
const router = Router();

// GET /api/entidades?tipo=Hospital&incluirNoAliadas=true
// Por defecto solo devuelve las entidades aliadas.
router.get("/", async (req, res) => {
  const condiciones = [];
  const params = [];

  if (req.query.incluirNoAliadas !== "true") condiciones.push("es_aliada = TRUE");

  if (req.query.tipo !== undefined) {
    if (!TIPOS_ENTIDAD.includes(req.query.tipo)) {
      return res.status(400).json({ error: "El tipo de entidad no es válido." });
    }
    params.push(req.query.tipo);
    condiciones.push(`tipo = $${params.length}`);
  }

  // Filtra por ciudad ignorando mayúsculas y tildes
  if (req.query.ciudad !== undefined && String(req.query.ciudad).trim() !== "") {
    params.push(normalizarCiudad(req.query.ciudad));
    condiciones.push(`translate(lower(ciudad), 'áéíóúüñ', 'aeiouun') = $${params.length}`);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { rows } = await query(`SELECT * FROM entidades ${where} ORDER BY tipo, nombre`, params);
  res.json(rows.map(serializarEntidad));
});

export default router;
