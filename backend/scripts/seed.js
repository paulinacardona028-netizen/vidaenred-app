// Carga datos de prueba. Solo inserta si las tablas están vacías.
// Contraseña de todas las cuentas de prueba: demo1234
// NOTA: teléfonos y coordenadas son de ejemplo; verificar antes de usar en producción.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const CONTRASENA = "demo1234";

const donantes = [
  { nombre: "Juan Perez", correo: "juan.perez@correo.com", tipo: "O+", ciudad: "Medellin", esDonante: true },
  { nombre: "Maria Gomez", correo: "maria.gomez@correo.com", tipo: "A-", ciudad: "Medellin", esDonante: true },
  { nombre: "Carlos Ruiz", correo: "carlos.ruiz@correo.com", tipo: "O-", ciudad: "Medellin", esDonante: true },
  { nombre: "Laura Diaz", correo: "laura.diaz@correo.com", tipo: "B+", ciudad: "Envigado", esDonante: true },
];

const entidades = [
  { nombre: "Hospital San Rafael", tipo: "Hospital", telefono: "604 000 0001", lat: 6.2442, lng: -75.5812, aliada: true },
  { nombre: "Urgencias Clínica del Norte", tipo: "Urgencias", telefono: "604 000 0002", lat: 6.2750, lng: -75.5680, aliada: true },
  { nombre: "Banco de sangre central", tipo: "Banco de sangre", telefono: "604 000 0003", lat: 6.2480, lng: -75.5700, aliada: true },
  { nombre: "Clínica del Norte", tipo: "Clínica", telefono: "604 000 0004", lat: 6.2750, lng: -75.5680, aliada: true },
  { nombre: "Clínica sin convenio", tipo: "Clínica", telefono: "604 000 0005", lat: 6.2600, lng: -75.5900, aliada: false },
];

const solicitudes = [
  { tipo: "O+", entidad: "Hospital San Rafael", urgencia: "Alta", distancia: 1.2 },
  { tipo: "A-", entidad: "Banco de sangre central", urgencia: "Moderada", distancia: 3 },
  { tipo: "B+", entidad: "Clínica del Norte", urgencia: "Programada", distancia: 5 },
];

const client = await pool.connect();
try {
  await client.query("BEGIN");

  const { rows: conteo } = await client.query("SELECT COUNT(*)::int AS n FROM donantes");
  if (conteo[0].n > 0) {
    console.log("La base ya tiene datos; no se carga nada.");
    await client.query("ROLLBACK");
  } else {
    const hash = await bcrypt.hash(CONTRASENA, 10);
    const ids = {};
    for (const d of donantes) {
      const { rows } = await client.query(
        `INSERT INTO donantes (nombre, correo, contrasena_hash, tipo_sangre, ciudad, es_donante, es_solicitante)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING id`,
        [d.nombre, d.correo, hash, d.tipo, d.ciudad, d.esDonante]
      );
      ids[d.nombre] = rows[0].id;
    }

    // Donante solo solicitante (no cumplió requisitos): para probar los permisos
    await client.query(
      `INSERT INTO donantes (nombre, correo, contrasena_hash, tipo_sangre, ciudad, es_donante, es_solicitante)
       VALUES ('Pedro Solicitante', 'pedro.solicitante@correo.com', $1, NULL, 'Medellin', FALSE, TRUE)`,
      [hash]
    );

    const idsEntidad = {};
    for (const e of entidades) {
      const { rows } = await client.query(
        `INSERT INTO entidades (nombre, tipo, ciudad, telefono, latitud, longitud, es_aliada)
         VALUES ($1, $2, 'Medellín', $3, $4, $5, $6) RETURNING id`,
        [e.nombre, e.tipo, e.telefono, e.lat, e.lng, e.aliada]
      );
      idsEntidad[e.nombre] = rows[0].id;
    }

    const creadas = [];
    for (const s of solicitudes) {
      const { rows } = await client.query(
        `INSERT INTO solicitudes (tipo_sangre, hospital, ciudad, distancia_km, urgencia, entidad_id)
         VALUES ($1, $2, 'Medellín', $3, $4, $5) RETURNING id`,
        [s.tipo, s.entidad, s.distancia, s.urgencia, idsEntidad[s.entidad]]
      );
      creadas.push(rows[0].id);
    }

    const confirmaciones = [
      [creadas[0], ids["Maria Gomez"]],
      [creadas[0], ids["Carlos Ruiz"]],
      [creadas[2], ids["Laura Diaz"]],
    ];
    for (const [solicitudId, donanteId] of confirmaciones) {
      await client.query(
        "INSERT INTO donaciones_confirmadas (solicitud_id, donante_id) VALUES ($1, $2)",
        [solicitudId, donanteId]
      );
    }

    await client.query("COMMIT");
    console.log(`Datos de prueba cargados. Contraseña de todas las cuentas: ${CONTRASENA}`);
  }
} catch (err) {
  await client.query("ROLLBACK");
  console.error("Error al cargar datos de prueba:", err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
