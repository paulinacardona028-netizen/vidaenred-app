import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { serializarDonante } from "../lib/reglas.js";

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
router.patch("/disponibilidad", async (req, res) => {
  if (typeof req.body.disponible !== "boolean") {
    return res.status(400).json({ error: "El campo 'disponible' debe ser verdadero o falso." });
  }

  const { rows } = await query(
    "UPDATE donantes SET disponible = $1 WHERE id = $2 RETURNING *",
    [req.body.disponible, req.donanteId]
  );
  if (rows.length === 0) return res.status(404).json({ error: "Donante no encontrado." });
  res.json(serializarDonante(rows[0]));
});

export default router;
