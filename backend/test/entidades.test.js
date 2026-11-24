// Pruebas unitarias del campo logoUrl de las entidades aliadas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { serializarEntidad } from "../src/lib/reglas.js";

const filaBase = {
  id: "11111111-1111-1111-1111-111111111111",
  nombre: "Hospital de prueba",
  tipo: "Hospital",
  ciudad: "Bello",
  telefono: "6040000",
  latitud: "6.3376",
  longitud: "-75.5575",
  es_aliada: true,
};

test("serializarEntidad expone logoUrl cuando la entidad tiene logo", () => {
  const e = serializarEntidad({ ...filaBase, logo_url: "https://ejemplo.com/logo.png" });
  assert.equal(e.logoUrl, "https://ejemplo.com/logo.png");
});

test("serializarEntidad devuelve logoUrl null cuando no hay logo", () => {
  assert.equal(serializarEntidad({ ...filaBase, logo_url: null }).logoUrl, null);
  assert.equal(serializarEntidad({ ...filaBase }).logoUrl, null);
});
