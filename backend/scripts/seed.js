// Carga datos de prueba. Solo inserta si las tablas están vacías.
// Contraseña de todas las cuentas de prueba: demo1234
import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

const CONTRASENA = "demo1234";

const donantes = [
  { nombre: "Juan Perez", correo: "juan.perez@correo.com", tipo: "O+", ciudad: "Medellin" },
  { nombre: "Maria Gomez", correo: "maria.gomez@correo.com", tipo: "A-", ciudad: "Medellin" },
  { nombre: "Carlos Ruiz", correo: "carlos.ruiz@correo.com", tipo: "O-", ciudad: "Medellin" },
  { nombre: "Laura Diaz", correo: "laura.diaz@correo.com", tipo: "B+", ciudad: "Envigado" },
];

const solicitudes = [
  { tipo: "O+", hospital: "Hosp. San Rafael", urgencia: "Alta", distancia: 1.2 },
  { tipo: "A-", hospital: "Banco de sangre central", urgencia: "Moderada", distancia: 3 },
  { tipo: "B+", hospital: "Clinica del Norte", urgencia: "Programada", distancia: 5 },
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
        `INSERT INTO donantes (nombre, correo, contrasena_hash, tipo_sangre, ciudad)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [d.nombre, d.correo, hash, d.tipo, d.ciudad]
      );
      ids[d.nombre] = rows[0].id;
    }

    const creadas = [];
    for (const s of solicitudes) {
      const { rows } = await client.query(
        `INSERT INTO solicitudes (tipo_sangre, hospital, ciudad, distancia_km, urgencia)
         VALUES ($1, $2, 'Medellin', $3, $4) RETURNING id`,
        [s.tipo, s.hospital, s.distancia, s.urgencia]
      );
      creadas.push(rows[0].id);
    }

    // Algunos donantes ya confirmaron, para que la app muestre datos reales
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
