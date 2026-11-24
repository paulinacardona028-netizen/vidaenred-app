import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomInt } from "node:crypto";
import { query } from "../db.js";
import { serializarDonante, validarRegistro } from "../lib/reglas.js";
import { ciudadCanonica } from "../lib/ciudades.js";
import { enviarCodigoRecuperacion } from "../lib/correo.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Límite de intentos por IP: frena la fuerza bruta de contraseñas y de códigos de 6 dígitos.
const limitarIntentos = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
  });

function generarToken(donanteId) {
  return jwt.sign({ sub: donanteId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRA ?? "7d",
  });
}

const hashCodigo = (codigo) => createHash("sha256").update(codigo).digest("hex");

// POST /api/auth/registro
router.post("/registro", async (req, res) => {
  const datos = {
    nombre: req.body.nombre?.trim(),
    correo: req.body.correo?.trim().toLowerCase(),
    contrasena: req.body.contrasena,
    tipoSangre: req.body.tipoSangre,
    ciudad: req.body.ciudad?.trim(),
    fechaNacimiento: req.body.fechaNacimiento,
  };

  const errores = validarRegistro(datos);
  if (errores.length > 0) {
    return res.status(400).json({ error: errores.join(" ") });
  }

  const hash = await bcrypt.hash(datos.contrasena, 10);

  try {
    const { rows } = await query(
      `INSERT INTO donantes (nombre, correo, contrasena_hash, tipo_sangre, ciudad, fecha_nacimiento, es_donante, es_solicitante)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE)
       RETURNING *`,
      [datos.nombre, datos.correo, hash, datos.tipoSangre ?? null, ciudadCanonica(datos.ciudad), datos.fechaNacimiento]
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
router.post("/login", limitarIntentos(20), async (req, res) => {
  const correo = req.body.correo?.trim().toLowerCase();
  const contrasena = req.body.contrasena ?? "";

  const { rows } = await query("SELECT * FROM donantes WHERE correo = $1", [correo ?? ""]);
  const donante = rows[0];

  // Mismo mensaje si el correo no existe o la contraseña no coincide
  const coincide = donante && (await bcrypt.compare(contrasena, donante.contrasena_hash));
  if (!coincide) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos." });
  }

  res.json({ token: generarToken(donante.id), donante: serializarDonante(donante) });
});

// POST /api/auth/recuperar  body: { correo }
// Siempre responde igual, exista o no el correo, para no revelar cuentas.
// El código se envía por correo (ver lib/correo.js). En desarrollo, sin correo configurado, se muestra en consola.
router.post("/recuperar", limitarIntentos(5), async (req, res) => {
  const correo = req.body.correo?.trim().toLowerCase();
  const mensaje = "Si el correo está registrado, recibirás un código para restablecer tu contraseña.";

  const { rows } = await query("SELECT id FROM donantes WHERE correo = $1", [correo ?? ""]);
  if (rows[0]) {
    const codigo = String(randomInt(100000, 1000000));
    await query(
      `INSERT INTO recuperaciones_contrasena (donante_id, codigo_hash, expira_en)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [rows[0].id, hashCodigo(codigo)]
    );
    await enviarCodigoRecuperacion(correo, codigo);
  }
  res.json({ mensaje });
});

// POST /api/auth/restablecer  body: { correo, codigo, contrasena }
router.post("/restablecer", limitarIntentos(10), async (req, res) => {
  const correo = req.body.correo?.trim().toLowerCase();
  const codigo = String(req.body.codigo ?? "").trim();
  const contrasena = req.body.contrasena ?? "";

  if (contrasena.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }

  const { rows } = await query(
    `SELECT r.id, r.donante_id
     FROM recuperaciones_contrasena r
     JOIN donantes d ON d.id = r.donante_id
     WHERE d.correo = $1 AND r.codigo_hash = $2 AND r.usada = FALSE AND r.expira_en > now()`,
    [correo ?? "", hashCodigo(codigo)]
  );
  if (rows.length === 0) {
    return res.status(400).json({ error: "El código no es válido o ya venció." });
  }

  const hash = await bcrypt.hash(contrasena, 10);
  await query("UPDATE donantes SET contrasena_hash = $1 WHERE id = $2", [hash, rows[0].donante_id]);
  await query("UPDATE recuperaciones_contrasena SET usada = TRUE WHERE donante_id = $1", [
    rows[0].donante_id,
  ]);
  res.json({ mensaje: "Tu contraseña fue actualizada. Ya puedes iniciar sesión." });
});

export default router;
