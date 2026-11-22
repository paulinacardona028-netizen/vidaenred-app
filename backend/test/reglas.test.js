// Pruebas unitarias de las reglas de negocio. No necesitan base de datos.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  tiposCompatiblesCon,
  validarRegistro,
  validarSolicitud,
  validarFechaNacimiento,
  validarRespuestasElegibilidad,
  evaluarElegibilidad,
  formatearFecha,
  tiempoRelativo,
  esUUID,
  UMBRALES,
} from "../src/lib/reglas.js";
import { normalizarCiudad, ciudadValida, ciudadCanonica } from "../src/lib/ciudades.js";

const hoy = new Date();
const fechaAdulto = "1995-03-10";

// Respuestas válidas para el formulario de requisitos (cumple)
const respuestasCumple = () => ({
  tipoSangre: "O+",
  fechaNacimiento: fechaAdulto,
  pesoKg: 70,
  sexo: "M",
  condiciones: { vih: false, hepatitisBC: false, cancer: false, cardiaca: false, diabetesInsulina: false, drogasInyectadas: false },
});

describe("compatibilidad de sangre", () => {
  test("O- puede donar a todos los tipos", () => {
    assert.equal(tiposCompatiblesCon("O-").length, 8);
  });
  test("AB+ solo puede donar a AB+", () => {
    assert.deepEqual(tiposCompatiblesCon("AB+"), ["AB+"]);
  });
  test("un tipo desconocido no tiene compatibles", () => {
    assert.deepEqual(tiposCompatiblesCon("ZZ"), []);
  });
});

describe("validación de fecha de nacimiento", () => {
  test("acepta una fecha válida en formato AAAA-MM-DD", () => {
    assert.equal(validarFechaNacimiento("1995-03-10"), true);
  });
  test("rechaza formatos distintos", () => {
    assert.equal(validarFechaNacimiento("10/03/1995"), false);
  });
  test("rechaza fechas que no existen", () => {
    assert.equal(validarFechaNacimiento("1995-02-31"), false);
  });
  test("rechaza fechas futuras", () => {
    assert.equal(validarFechaNacimiento("2999-01-01"), false);
  });
  test("rechaza más de 120 años de antigüedad", () => {
    assert.equal(validarFechaNacimiento("1800-01-01"), false);
  });
});

describe("validación de ciudades", () => {
  test("ignora tildes y mayúsculas", () => {
    assert.equal(normalizarCiudad("MEDELLÍN"), "medellin");
    assert.equal(ciudadValida("Medellin"), true);
  });
  test("devuelve el nombre oficial con tildes", () => {
    assert.equal(ciudadCanonica("medellin"), "Medellín");
  });
  test("rechaza ciudades que no están en la lista", () => {
    assert.equal(ciudadValida("Ciudad Inventada"), false);
    assert.equal(ciudadCanonica("Ciudad Inventada"), null);
  });
});

describe("validación de registro", () => {
  const datos = () => ({ nombre: "Ana", correo: "ana@correo.com", contrasena: "secreto1", ciudad: "Medellín", fechaNacimiento: fechaAdulto });
  test("un registro completo no tiene errores", () => {
    assert.deepEqual(validarRegistro(datos()), []);
  });
  test("exige nombre", () => {
    assert.ok(validarRegistro({ ...datos(), nombre: "  " }).length > 0);
  });
  test("exige correo con formato válido", () => {
    assert.ok(validarRegistro({ ...datos(), correo: "no-es-correo" }).length > 0);
  });
  test("exige contraseña de al menos 6 caracteres", () => {
    assert.ok(validarRegistro({ ...datos(), contrasena: "12345" }).length > 0);
  });
  test("exige ciudad de la lista", () => {
    assert.ok(validarRegistro({ ...datos(), ciudad: "Narnia" }).length > 0);
  });
  test("exige fecha de nacimiento válida", () => {
    assert.ok(validarRegistro({ ...datos(), fechaNacimiento: undefined }).length > 0);
  });
  test("el tipo de sangre es opcional, pero si viene debe ser válido", () => {
    assert.deepEqual(validarRegistro({ ...datos(), tipoSangre: undefined }), []);
    assert.ok(validarRegistro({ ...datos(), tipoSangre: "X+" }).length > 0);
  });
});

describe("validación de solicitudes", () => {
  test("acepta una solicitud con entidad", () => {
    assert.deepEqual(validarSolicitud({ tipoSangre: "O+", urgencia: "Alta", entidadId: "x" }), []);
  });
  test("exige entidad u hospital", () => {
    assert.ok(validarSolicitud({ tipoSangre: "O+", urgencia: "Alta" }).length > 0);
  });
  test("rechaza urgencias no válidas", () => {
    assert.ok(validarSolicitud({ tipoSangre: "O+", urgencia: "Quizás", hospital: "X" }).length > 0);
  });
});

describe("formulario de requisitos para donar", () => {
  test("una persona sana y adulta cumple", () => {
    const r = evaluarElegibilidad(respuestasCumple(), hoy);
    assert.equal(r.cumple, true);
    assert.equal(r.motivos.length, 0);
    assert.equal(r.reintentarEn, null);
  });

  test("menor de 18 años no cumple (excluyente)", () => {
    const r = evaluarElegibilidad({ ...respuestasCumple(), fechaNacimiento: "2015-01-01" }, hoy);
    assert.equal(r.cumple, false);
    assert.equal(r.motivos[0].tipo, "excluyente");
    assert.equal(r.reintentarEn, null);
  });

  test("peso menor al mínimo no cumple", () => {
    const r = evaluarElegibilidad({ ...respuestasCumple(), pesoKg: UMBRALES.pesoMinimoKg - 1 }, hoy);
    assert.equal(r.cumple, false);
  });

  test("una condición de salud excluyente no cumple", () => {
    const base = respuestasCumple();
    const r = evaluarElegibilidad({ ...base, condiciones: { ...base.condiciones, vih: true } }, hoy);
    assert.equal(r.cumple, false);
    assert.equal(r.motivos.some((m) => m.tipo === "excluyente"), true);
  });

  test("tatuaje reciente es temporal y da fecha de reintento", () => {
    const r = evaluarElegibilidad({ ...respuestasCumple(), tatuajeOPiercingReciente: true }, hoy);
    assert.equal(r.cumple, false);
    assert.equal(r.motivos[0].tipo, "temporal");
    assert.match(r.reintentarEn, /^\d{4}-\d{2}-\d{2}$/);
  });

  test("donación reciente exige esperar el intervalo mínimo", () => {
    const ultima = new Date(hoy.getTime() - 10 * 86400000).toISOString().slice(0, 10);
    const r = evaluarElegibilidad({ ...respuestasCumple(), fechaUltimaDonacion: ultima }, hoy);
    assert.equal(r.cumple, false);
    assert.equal(r.motivos[0].tipo, "temporal");
  });

  test("una donación antigua no impide donar", () => {
    const r = evaluarElegibilidad({ ...respuestasCumple(), fechaUltimaDonacion: "2000-01-01" }, hoy);
    assert.equal(r.cumple, true);
  });

  test("embarazo o lactancia es temporal y no da fecha", () => {
    const r = evaluarElegibilidad({ ...respuestasCumple(), sexo: "F", embarazoOLactancia: true }, hoy);
    assert.equal(r.cumple, false);
    assert.equal(r.reintentarEn, null);
  });

  test("valida los datos antes de evaluar", () => {
    assert.ok(validarRespuestasElegibilidad({ ...respuestasCumple(), sexo: "X" }).length > 0);
    assert.deepEqual(validarRespuestasElegibilidad(respuestasCumple()), []);
  });
});

describe("utilidades", () => {
  test("formatea fechas como AAAA-MM-DD", () => {
    assert.equal(formatearFecha(new Date(1995, 2, 10)), "1995-03-10");
    assert.equal(formatearFecha("1995-03-10T00:00:00Z"), "1995-03-10");
    assert.equal(formatearFecha(null), null);
  });
  test("tiempo relativo en minutos, horas y días", () => {
    const ahora = new Date("2026-01-01T12:00:00Z");
    assert.equal(tiempoRelativo(new Date("2026-01-01T11:55:00Z"), ahora), "hace 5 min");
    assert.equal(tiempoRelativo(new Date("2026-01-01T09:00:00Z"), ahora), "hace 3 h");
    assert.equal(tiempoRelativo(new Date("2025-12-30T12:00:00Z"), ahora), "hace 2 d");
  });
  test("reconoce UUID válidos", () => {
    assert.equal(esUUID("00000000-0000-0000-0000-000000000000"), true);
    assert.equal(esUUID("abc"), false);
  });
});
