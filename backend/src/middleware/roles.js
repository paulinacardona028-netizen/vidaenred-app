import { query } from "../db.js";

// Exige que la cuenta tenga activo el rol indicado ("donante" o "solicitante").
// Se consulta la base de datos en cada petición para que un rol desactivado
// deje de funcionar de inmediato, sin esperar a que venza el token.
export function requireRol(rol) {
  return async (req, res, next) => {
    const { rows } = await query(
      "SELECT es_donante, es_solicitante FROM donantes WHERE id = $1",
      [req.donanteId]
    );
    const cuenta = rows[0];
    if (!cuenta) return res.status(404).json({ error: "Donante no encontrado." });

    const activo = rol === "donante" ? cuenta.es_donante : cuenta.es_solicitante;
    if (!activo) {
      return res.status(403).json({
        error:
          rol === "donante"
            ? "Completa el formulario de requisitos para activar el rol de donante."
            : "Activa el rol de solicitante en tu perfil.",
      });
    }
    next();
  };
}
