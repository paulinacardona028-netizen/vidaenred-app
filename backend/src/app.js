import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import donanteRoutes from "./routes/donante.js";
import solicitudesRoutes from "./routes/solicitudes.js";
import entidadesRoutes from "./routes/entidades.js";

export function crearApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/donante", donanteRoutes);
  app.use("/api/solicitudes", solicitudesRoutes);
  app.use("/api/entidades", entidadesRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada." });
  });

  // Manejo centralizado de errores (Express 5 envía aquí los errores de funciones async)
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido." });
    }
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
  });

  return app;
}
