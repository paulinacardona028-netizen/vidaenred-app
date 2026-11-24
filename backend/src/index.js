import "./config.js";
import { crearApp } from "./app.js";
import { pool } from "./db.js";

const { PORT = 3000, JWT_SECRET, DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL en el archivo .env");
  process.exit(1);
}
// Rechaza secretos vacíos, cortos o copiados del ejemplo (que empiezan por "cambia-")
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith("cambia-")) {
  console.error(
    "JWT_SECRET no es seguro: debe tener al menos 32 caracteres y no puede ser el valor de ejemplo. " +
      "Genera uno con: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
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
