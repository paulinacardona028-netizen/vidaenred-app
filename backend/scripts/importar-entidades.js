// Importa el catálogo de entidades (hospitales, urgencias, bancos de sangre, clínicas)
// desde un CSV que ustedes llenan con datos reales.
//
// Uso:  npm run db:importar-entidades              (usa data/entidades.csv)
//       npm run db:importar-entidades -- ruta.csv  (otro archivo)
//
// Formato: primera línea con el encabezado exacto, una entidad por línea.
//   nombre,tipo,ciudad,telefono,latitud,longitud,es_aliada
//   tipo: Hospital | Urgencias | Banco de sangre | Clínica
//   latitud / longitud: opcionales (decimales, ej. 6.2442 y -75.5812)
//   es_aliada: si | no
// Si una línea tiene errores, no se importa ninguna: se corrige el archivo y se vuelve a ejecutar.
// Las entidades que ya existen (mismo nombre y ciudad) se omiten.
import "../src/config.js";
import { readFileSync } from "node:fs";
import { pool } from "../src/db.js";
import { TIPOS_ENTIDAD } from "../src/lib/reglas.js";

const ENCABEZADO = ["nombre", "tipo", "ciudad", "telefono", "latitud", "longitud", "es_aliada"];

// Lector de CSV sencillo: soporta campos entre comillas, incluidas comas dentro del campo
function parsearLinea(linea) {
  const campos = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === "," && !entreComillas) {
      campos.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual.trim());
  return campos;
}

function validarFila(campos, numeroLinea) {
  const errores = [];
  const [nombre, tipo, ciudad, telefono, latitud, longitud, esAliada] = campos;
  if (!nombre) errores.push("falta el nombre");
  if (!TIPOS_ENTIDAD.includes(tipo)) errores.push(`tipo "${tipo}" no válido (usa ${TIPOS_ENTIDAD.join(", ")})`);
  if (!ciudad) errores.push("falta la ciudad");
  for (const [etiqueta, valor, min, max] of [
    ["latitud", latitud, -90, 90],
    ["longitud", longitud, -180, 180],
  ]) {
    if (valor === "") continue;
    const n = Number(valor);
    if (Number.isNaN(n) || n < min || n > max) errores.push(`${etiqueta} "${valor}" no es válida`);
  }
  if (!["si", "no"].includes(esAliada.toLowerCase())) errores.push('es_aliada debe ser "si" o "no"');
  return errores.map((e) => `línea ${numeroLinea}: ${e}`);
}

const ruta = process.argv[2] ?? "data/entidades.csv";
let lineas;
try {
  lineas = readFileSync(ruta, "utf8")
    .split(/\r?\n/)
    .map((l, i) => ({ texto: l.trim(), numero: i + 1 }))
    .filter((l) => l.texto !== "");
} catch {
  console.error(`No se pudo leer el archivo: ${ruta}`);
  process.exit(1);
}

if (lineas.length === 0) {
  console.log("El archivo no tiene encabezado. Revisa data/entidades.csv.");
  process.exit(1);
}

const encabezado = parsearLinea(lineas[0].texto).map((c) => c.toLowerCase());
if (encabezado.join(",") !== ENCABEZADO.join(",")) {
  console.error(`El encabezado debe ser exactamente: ${ENCABEZADO.join(",")}`);
  process.exit(1);
}

const filas = lineas.slice(1);
if (filas.length === 0) {
  console.log("No hay entidades para importar: el archivo solo tiene el encabezado.");
  process.exit(0);
}

const errores = [];
const datos = filas.map(({ texto, numero }) => {
  const campos = parsearLinea(texto);
  if (campos.length !== ENCABEZADO.length) {
    errores.push(`línea ${numero}: se esperaban ${ENCABEZADO.length} columnas y hay ${campos.length}`);
    return null;
  }
  errores.push(...validarFila(campos, numero));
  return campos;
});

if (errores.length > 0) {
  console.error("No se importó nada. Corrige estos errores:");
  errores.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const client = await pool.connect();
try {
  await client.query("BEGIN");
  let insertadas = 0;
  let omitidas = 0;
  for (const [nombre, tipo, ciudad, telefono, latitud, longitud, esAliada] of datos) {
    const { rowCount } = await client.query(
      "SELECT 1 FROM entidades WHERE nombre = $1 AND ciudad = $2",
      [nombre, ciudad]
    );
    if (rowCount > 0) {
      omitidas++;
      continue;
    }
    await client.query(
      `INSERT INTO entidades (nombre, tipo, ciudad, telefono, latitud, longitud, es_aliada)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        nombre,
        tipo,
        ciudad,
        telefono || null,
        latitud === "" ? null : Number(latitud),
        longitud === "" ? null : Number(longitud),
        esAliada.toLowerCase() === "si",
      ]
    );
    insertadas++;
  }
  await client.query("COMMIT");
  console.log(`Entidades importadas: ${insertadas}. Ya existían y se omitieron: ${omitidas}.`);
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Error al importar, no se guardó nada:", err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
