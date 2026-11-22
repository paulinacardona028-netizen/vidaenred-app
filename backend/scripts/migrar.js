// Crea las tablas en PostgreSQL ejecutando db/schema.sql
import "../src/config.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../src/db.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = await readFile(path.join(dir, "..", "db", "schema.sql"), "utf8");

try {
  await pool.query(sql);
  console.log("Esquema aplicado correctamente.");
} catch (err) {
  console.error("Error al aplicar el esquema:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
