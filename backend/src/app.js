import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import donanteRoutes from "./routes/donante.js";
import solicitudesRoutes from "./routes/solicitudes.js";
import entidadesRoutes from "./routes/entidades.js";
import ciudadesRoutes from "./routes/ciudades.js";

const RAIZ_BACKEND = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPENAPI = path.join(RAIZ_BACKEND, "docs", "openapi.json");

export function crearApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // Documentación de la API: especificación OpenAPI y visor Swagger UI
  app.get("/api/docs/openapi.json", (req, res) => res.sendFile(OPENAPI));
  app.get("/api/docs", (req, res) =>
    res.type("html").send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>VidaEnRed API</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"></head>
<body><div id="swagger"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
<script>window.onload=()=>SwaggerUIBundle({url:"/api/docs/openapi.json",dom_id:"#swagger"});</script>
</body></html>`)
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/donante", donanteRoutes);
  app.use("/api/solicitudes", solicitudesRoutes);
  app.use("/api/entidades", entidadesRoutes);
  app.use("/api/ciudades", ciudadesRoutes);

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
