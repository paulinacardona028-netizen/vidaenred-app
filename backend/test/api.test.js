// Pruebas de integración de la API contra una base de datos de PRUEBA desechable.
// Se ejecutan solo si TEST_DATABASE_URL está definida. Borran y recrean las tablas.
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const URL_PRUEBA = process.env.TEST_DATABASE_URL;
const carpeta = path.dirname(fileURLToPath(import.meta.url));
const raizBackend = path.join(carpeta, "..");

if (!URL_PRUEBA) {
  test("pruebas de API omitidas: define TEST_DATABASE_URL", { skip: true }, () => {});
} else {
  // Configurar el entorno ANTES de importar la app (el pool de PostgreSQL lo lee al cargarse)
  process.env.DATABASE_URL = URL_PRUEBA;
  process.env.JWT_SECRET = "clave-de-pruebas-de-al-menos-32-caracteres";
  process.env.CORS_ORIGIN = "*";

  const { crearApp } = await import("../src/app.js");
  const { pool } = await import("../src/db.js");

  let servidor;
  let base;

  before(async () => {
    // Reconstruye el esquema desde cero en la base de pruebas
    await pool.query(`
      DROP SCHEMA public CASCADE; CREATE SCHEMA public;
    `);
    execFileSync("node", ["scripts/migrar.js"], { cwd: raizBackend, env: process.env, stdio: "ignore" });
    await new Promise((resolver) => {
      servidor = crearApp().listen(0, "127.0.0.1", () => {
        base = `http://127.0.0.1:${servidor.address().port}/api`;
        resolver();
      });
    });
  });

  after(async () => {
    await new Promise((resolver) => servidor.close(resolver));
    await pool.end();
  });

  const peticion = async (ruta, { metodo = "GET", token, cuerpo, crudo } = {}) => {
    const cabeceras = {};
    if (cuerpo !== undefined || crudo) cabeceras["Content-Type"] = "application/json";
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    const r = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: crudo ?? (cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined),
    });
    const datos = await r.json().catch(() => null);
    return { status: r.status, datos };
  };

  const registrar = (correo, extra = {}) =>
    peticion("/auth/registro", {
      metodo: "POST",
      cuerpo: { nombre: "Persona Prueba", correo, contrasena: "secreto1", ciudad: "Medellín", fechaNacimiento: "1995-03-10", ...extra },
    });

  describe("estado y catálogos", () => {
    test("GET /api/health responde ok", async () => {
      const r = await peticion("/health");
      assert.equal(r.status, 200);
      assert.deepEqual(r.datos, { ok: true });
    });

    test("GET /api/ciudades devuelve la lista ordenada", async () => {
      const r = await peticion("/ciudades");
      assert.equal(r.status, 200);
      assert.ok(r.datos.includes("Medellín"));
    });

    test("ruta inexistente responde 404", async () => {
      const r = await peticion("/no-existe");
      assert.equal(r.status, 404);
    });

    test("cuerpo que no es JSON responde 400", async () => {
      const r = await peticion("/auth/login", { metodo: "POST", crudo: "{esto no es json" });
      assert.equal(r.status, 400);
    });
  });

  describe("autenticación", () => {
    test("registro sin fecha de nacimiento responde 400", async () => {
      const r = await peticion("/auth/registro", {
        metodo: "POST",
        cuerpo: { nombre: "Sin Fecha", correo: "sin.fecha@correo.com", contrasena: "secreto1", ciudad: "Medellín" },
      });
      assert.equal(r.status, 400);
    });

    test("registro válido responde 201 con token y sin contraseña", async () => {
      const r = await registrar("ana.prueba@correo.com");
      assert.equal(r.status, 201);
      assert.ok(r.datos.token);
      assert.equal(r.datos.donante.fechaNacimiento, "1995-03-10");
      assert.equal(r.datos.donante.contrasena_hash, undefined);
    });

    test("correo repetido responde 409", async () => {
      const r = await registrar("ana.prueba@correo.com");
      assert.equal(r.status, 409);
    });

    test("login con contraseña incorrecta responde 401", async () => {
      const r = await peticion("/auth/login", { metodo: "POST", cuerpo: { correo: "ana.prueba@correo.com", contrasena: "otra-clave" } });
      assert.equal(r.status, 401);
    });

    test("login correcto responde 200 con token", async () => {
      const r = await peticion("/auth/login", { metodo: "POST", cuerpo: { correo: "ana.prueba@correo.com", contrasena: "secreto1" } });
      assert.equal(r.status, 200);
      assert.ok(r.datos.token);
    });

    test("ruta protegida sin token responde 401", async () => {
      const r = await peticion("/donante");
      assert.equal(r.status, 401);
    });

    test("recuperar contraseña responde igual exista o no el correo", async () => {
      const a = await peticion("/auth/recuperar", { metodo: "POST", cuerpo: { correo: "ana.prueba@correo.com" } });
      const b = await peticion("/auth/recuperar", { metodo: "POST", cuerpo: { correo: "nadie@correo.com" } });
      assert.equal(a.status, 200);
      assert.equal(a.datos.mensaje, b.datos.mensaje);
    });

    test("restablecer con código incorrecto responde 400", async () => {
      const r = await peticion("/auth/restablecer", { metodo: "POST", cuerpo: { correo: "ana.prueba@correo.com", codigo: "000000", contrasena: "nueva123" } });
      assert.equal(r.status, 400);
    });
  });

  describe("donante y roles", () => {
    let tokenAna;
    let tokenMaria;

    before(async () => {
      tokenAna = (await registrar("ana.roles@correo.com")).datos.token;
      tokenMaria = (await registrar("maria.roles@correo.com")).datos.token;
    });

    test("GET /api/donante devuelve el perfil", async () => {
      const r = await peticion("/donante", { token: tokenAna });
      assert.equal(r.status, 200);
      assert.equal(r.datos.esDonante, false);
      assert.equal(r.datos.esSolicitante, true);
    });

    test("una cuenta que no es donante no puede ver compatibles (403)", async () => {
      const r = await peticion("/solicitudes/compatibles", { token: tokenAna });
      assert.equal(r.status, 403);
    });

    test("no se puede activar el rol de donante saltándose el formulario (400)", async () => {
      const r = await peticion("/donante/roles", { metodo: "PATCH", token: tokenAna, cuerpo: { esDonante: true } });
      assert.equal(r.status, 400);
    });

    test("el formulario de requisitos activa el rol de donante cuando cumple", async () => {
      const r = await peticion("/donante/evaluacion", {
        metodo: "POST",
        token: tokenMaria,
        cuerpo: {
          tipoSangre: "O+", fechaNacimiento: "1995-03-10", pesoKg: 65, sexo: "F",
          condiciones: { vih: false, hepatitisBC: false, cancer: false, cardiaca: false, diabetesInsulina: false, drogasInyectadas: false },
        },
      });
      assert.equal(r.status, 200);
      assert.equal(r.datos.cumple, true);
      assert.equal(r.datos.donante.esDonante, true);
      assert.equal(r.datos.donante.tipoSangre, "O+");
    });

    test("un donante compatible ve solicitudes compatibles", async () => {
      const r = await peticion("/solicitudes/compatibles", { token: tokenMaria });
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.datos));
    });
  });

  describe("solicitudes y entidades", () => {
    let tokenSolicitante;
    let tokenDonante;
    let solicitudId;

    before(async () => {
      tokenSolicitante = (await registrar("solicitante.prueba@correo.com")).datos.token;
      tokenDonante = (await registrar("donante.prueba@correo.com")).datos.token;
      await peticion("/donante/evaluacion", {
        metodo: "POST",
        token: tokenDonante,
        cuerpo: {
          tipoSangre: "O+", fechaNacimiento: "1990-01-01", pesoKg: 70, sexo: "M",
          condiciones: { vih: false, hepatitisBC: false, cancer: false, cardiaca: false, diabetesInsulina: false, drogasInyectadas: false },
        },
      });
    });

    test("publicar una solicitud sin hospital ni entidad responde 400", async () => {
      const r = await peticion("/solicitudes", { metodo: "POST", token: tokenSolicitante, cuerpo: { tipoSangre: "O+", urgencia: "Alta" } });
      assert.equal(r.status, 400);
    });

    test("publicar una solicitud válida responde 201 y no devuelve el teléfono de contacto", async () => {
      const r = await peticion("/solicitudes", {
        metodo: "POST",
        token: tokenSolicitante,
        cuerpo: { tipoSangre: "O+", urgencia: "Alta", hospital: "Hospital de prueba", contactoTelefono: "3001234567" },
      });
      assert.equal(r.status, 201);
      assert.equal(r.datos.contactoTelefono, undefined);
      solicitudId = r.datos.id;
    });

    test("el donante compatible puede confirmar la donación", async () => {
      const r = await peticion(`/solicitudes/${solicitudId}/donaciones`, { metodo: "POST", token: tokenDonante });
      assert.equal(r.status, 200);
      assert.equal(r.datos.yaConfirmo, true);
    });

    test("confirmar dos veces responde 409", async () => {
      const r = await peticion(`/solicitudes/${solicitudId}/donaciones`, { metodo: "POST", token: tokenDonante });
      assert.equal(r.status, 409);
    });

    test("solo quien publicó puede cerrar la solicitud (403 para otros)", async () => {
      const r = await peticion(`/solicitudes/${solicitudId}/resolver`, { metodo: "POST", token: tokenDonante, cuerpo: { donantesIds: [] } });
      assert.equal(r.status, 403);
    });

    test("el dueño cierra la solicitud y el donante queda en el historial", async () => {
      const yo = await peticion("/donante", { token: tokenDonante });
      const r = await peticion(`/solicitudes/${solicitudId}/resolver`, {
        metodo: "POST",
        token: tokenSolicitante,
        cuerpo: { donantesIds: [yo.datos.id] },
      });
      assert.equal(r.status, 200);
      assert.equal(r.datos.estado, "resuelta");
      const historial = await peticion("/donante/historial", { token: tokenDonante });
      assert.equal(historial.datos.length, 1);
    });

    test("las entidades se filtran por ciudad ignorando tildes", async () => {
      await pool.query(
        `INSERT INTO entidades (nombre, tipo, ciudad, es_aliada) VALUES
         ('Clínica de prueba', 'Clínica', 'Medellín', TRUE),
         ('Hospital de Cartagena', 'Hospital', 'Cartagena', TRUE)`
      );
      const r = await peticion("/entidades?ciudad=medellin");
      assert.equal(r.status, 200);
      assert.ok(r.datos.some((e) => e.nombre === "Clínica de prueba"));
      assert.ok(!r.datos.some((e) => e.nombre === "Hospital de Cartagena"));
    });

    test("un tipo de entidad inválido responde 400", async () => {
      const r = await peticion("/entidades?tipo=Farmacia");
      assert.equal(r.status, 400);
    });
  });
}
