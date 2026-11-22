import "./config.js";
import { crearApp } from "./app.js";
import { pool } from "./db.js";

const { PORT = 3000, JWT_SECRET, DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL en el archivo .env");
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET.startsWith("cambia-esta-clave")) {
  console.error("Define un JWT_SECRET seguro en el archivo .env");
  process.exit(1);
}

const app = crearApp();

// Escucha en todas las interfaces para que el celular en la misma red pueda conectarse
const servidor = app.listen(PORT, "0.0.0.0", () => {
  console.log(`VidaEnRed API escuchando en http://localhost:${PORT}/api`);
});

function apagar() {
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);
