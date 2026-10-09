import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { serializarDonante, validarRegistro } from "../lib/reglas.js";

const router = Router();

function generarToken(donanteId) {
  return jwt.sign({ sub: donanteId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRA ?? "7d",
  });
}

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
  const datos = {
    nombre: req.body.nombre?.trim(),
    correo: req.body.correo?.trim().toLowerCase(),
    contrasena: req.body.contrasena,
    tipoSangre: req.body.tipoSangre,
    ciudad: req.body.ciudad?.trim(),
  };

  const errores = validarRegistro(datos);
  if (errores.length > 0) {
    return res.status(400).json({ error: errores.join(" ") });
  }

  const hash = await bcrypt.hash(datos.contrasena, 10);

  try {
    const { rows } = await query(
      `INSERT INTO donantes (nombre, correo, contrasena_hash, tipo_sangre, ciudad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [datos.nombre, datos.correo, hash, datos.tipoSangre, datos.ciudad]
    );
    const donante = rows[0];
    res.status(201).json({ token: generarToken(donante.id), donante: serializarDonante(donante) });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const correo = req.body.correo?.trim().toLowerCase();
  const contrasena = req.body.contrasena ?? "";

  const { rows } = await query("SELECT * FROM donantes WHERE correo = $1", [correo ?? ""]);
  const donante = rows[0];

  // Mismo mensaje si el correo no existe o la contraseña no coincide,
  // para no revelar qué correos están registrados.
  const coincide = donante && (await bcrypt.compare(contrasena, donante.contrasena_hash));
  if (!coincide) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }

  res.json({ token: generarToken(donante.id), donante: serializarDonante(donante) });
});

export default router;
