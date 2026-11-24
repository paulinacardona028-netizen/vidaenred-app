import { Router } from "express";
import { query } from "../db.js";
import { TIPOS_ENTIDAD, serializarEntidad } from "../lib/reglas.js";
import { normalizarCiudad } from "../lib/ciudades.js";

// Catálogo público: no requiere sesión, así el carrusel de inicio funciona siempre.
const router = Router();

// GET /api/entidades?ciudad=Bello&incluirNoAliadas=true&limite=3
// Por defecto solo devuelve las entidades aliadas. "limite" devuelve solo las de mayor prioridad.
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

  // Las más importantes primero: prioridad 1, 2, 3...; luego las aliadas y por nombre
  let limite = "";
  if (req.query.limite !== undefined) {
    const n = Number(req.query.limite);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      return res.status(400).json({ error: "El límite debe ser un número entre 1 y 50." });
    }
    params.push(n);
    limite = `LIMIT $${params.length}`;
  }
  const { rows } = await query(
    `SELECT * FROM entidades ${where}
     ORDER BY prioridad ASC NULLS LAST, es_aliada DESC, nombre ASC ${limite}`,
    params
  );
  res.json(rows.map(serializarEntidad));
});

export default router;
