// Diagnóstico del backend: revisa cada requisito y dice exactamente qué falla.
// Uso (desde la carpeta backend):  npm run diagnostico
import "../src/config.js";
import os from "node:os";
import pg from "pg";

const PORT = process.env.PORT ?? 3000;
const ok = (t) => console.log(`  [OK]    ${t}`);
const fallo = (t) => console.log(`  [FALLO] ${t}`);
let errores = 0;

console.log("1. Configuración (backend/.env)");
if (process.env.DATABASE_URL) ok("DATABASE_URL definida");
else { fallo("Falta DATABASE_URL en backend/.env"); errores++; }
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) ok("JWT_SECRET definida");
else { fallo("JWT_SECRET falta o es muy corta (mínimo 32 caracteres)"); errores++; }

console.log("2. Base de datos PostgreSQL");
if (process.env.DATABASE_URL) {
  const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await cliente.connect();
    ok("Conexión a PostgreSQL correcta");
    const { rows } = await cliente.query(
      "SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public'"
    );
    if (rows[0].n >= 8) ok(`Tablas creadas: ${rows[0].n}`);
    else { fallo(`Solo hay ${rows[0].n} tablas. Ejecuta: npm run db:migrar`); errores++; }
  } catch (err) {
    fallo(`No se pudo conectar a PostgreSQL: ${err.message}`);
    errores++;
  } finally {
    await cliente.end().catch(() => {});
  }
}

console.log("3. API en este computador");
try {
  const r = await fetch(`http://localhost:${PORT}/api/health`);
  const datos = await r.json();
  if (datos.ok) ok(`La API responde en http://localhost:${PORT}/api`);
  else { fallo("La API responde pero con un dato inesperado"); errores++; }
} catch {
  fallo(`La API no responde en el puerto ${PORT}. ¿Está corriendo "npm run dev"?`);
  errores++;
}

console.log("3b. Versión de la API (detecta procesos viejos en el puerto)");
for (const ruta of ["/api/ciudades", "/api/entidades"]) {
  try {
    const r = await fetch(`http://localhost:${PORT}${ruta}`);
    if (r.ok) ok(`${ruta} responde (versión actual)`);
    else { fallo(`${ruta} responde ${r.status}: hay un backend viejo en el puerto ${PORT}. Ciérralo y vuelve a ejecutar "npm run dev" en esta carpeta`); errores++; }
  } catch {
    fallo(`${ruta} no responde`);
    errores++;
  }
}

console.log("4. Direcciones de red donde el celular puede encontrar esta Mac");
const ips = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === "IPv4" && !i.internal)
  .map((i) => i.address);
if (ips.length === 0) { fallo("No se encontró una IP de red local"); errores++; }
for (const ip of ips) {
  try {
    const r = await fetch(`http://${ip}:${PORT}/api/health`, { signal: AbortSignal.timeout(3000) });
    const datos = await r.json();
    if (datos.ok) ok(`http://${ip}:${PORT}/api responde (accesible desde el celular)`);
    else fallo(`http://${ip}:${PORT}/api responde con un dato inesperado`);
  } catch {
    fallo(`http://${ip}:${PORT}/api no responde. Revisa el firewall de macOS (Ajustes del Sistema → Red → Firewall)`);
  }
}

console.log(errores === 0 ? "\nTodo listo. Puedes abrir la app." : `\nHay ${errores} punto(s) por corregir arriba.`);
process.exitCode = errores === 0 ? 0 : 1;
