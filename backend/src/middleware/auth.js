import jwt from "jsonwebtoken";

// Exige un token JWT válido en el header Authorization: Bearer <token>
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Debes iniciar sesión." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.donanteId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "La sesión no es válida o venció." });
  }
}
