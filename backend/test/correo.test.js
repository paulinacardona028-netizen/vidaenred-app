// Pruebas unitarias del envío de correos (sin llamar a Resend real).
import { test, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { enviarCodigoRecuperacion } from "../src/lib/correo.js";

const original = { ...process.env };
beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
});
afterEach(() => {
  process.env = { ...original };
  mock.restoreAll();
});

test("sin RESEND_API_KEY no envía nada y devuelve false", async () => {
  process.env.NODE_ENV = "development";
  const fetchEspia = mock.method(globalThis, "fetch", async () => new Response("", { status: 200 }));
  mock.method(console, "log", () => {});
  assert.equal(await enviarCodigoRecuperacion("a@b.co", "123456"), false);
  assert.equal(fetchEspia.mock.callCount(), 0);
});

test("en producción sin configuración registra un error sin revelar el código", async () => {
  process.env.NODE_ENV = "production";
  const errores = [];
  mock.method(console, "error", (...args) => errores.push(args.join(" ")));
  assert.equal(await enviarCodigoRecuperacion("a@b.co", "654321"), false);
  assert.equal(errores.length, 1);
  assert.ok(!errores[0].includes("654321"));
});

test("con configuración llama a Resend con la clave y el remitente", async () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_FROM = "VidaEnRed <no-reply@ejemplo.com>";
  const llamada = mock.method(globalThis, "fetch", async () => new Response("{}", { status: 200 }));
  assert.equal(await enviarCodigoRecuperacion("a@b.co", "111222"), true);
  const [url, opciones] = llamada.mock.calls[0].arguments;
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(opciones.headers.Authorization, "Bearer re_test");
  const cuerpo = JSON.parse(opciones.body);
  assert.equal(cuerpo.from, "VidaEnRed <no-reply@ejemplo.com>");
  assert.deepEqual(cuerpo.to, ["a@b.co"]);
  assert.ok(cuerpo.html.includes("111222"));
});

test("si Resend responde con error, devuelve false", async () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.MAIL_FROM = "x@y.co";
  mock.method(globalThis, "fetch", async () => new Response("", { status: 422 }));
  mock.method(console, "error", () => {});
  assert.equal(await enviarCodigoRecuperacion("a@b.co", "333444"), false);
});
