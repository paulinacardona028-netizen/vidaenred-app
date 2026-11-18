import { ciudadValida } from "./ciudades.js";
// Reglas de negocio de VidaEnRed. Viven en el servidor para que la app
// no pueda saltárselas.

export const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const URGENCIAS = ["Alta", "Moderada", "Programada"];
export const TIPOS_ENTIDAD = ["Hospital", "Urgencias", "Banco de sangre", "Clínica"];

// Qué tipos de sangre puede recibir cada donante (simplificado para el proyecto)
export const COMPATIBILIDAD_DONANTE = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

export function tiposCompatiblesCon(tipoDonante) {
  return COMPATIBILIDAD_DONANTE[tipoDonante] ?? [];
}

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUUID(valor) {
  return typeof valor === "string" && UUID_REGEX.test(valor);
}

// Fecha en formato AAAA-MM-DD, no futura y no anterior a 120 años
export function validarFechaNacimiento(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(fecha + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) return false;
  const hoy = new Date();
  const hace120 = new Date(Date.UTC(hoy.getUTCFullYear() - 120, hoy.getUTCMonth(), hoy.getUTCDate()));
  return d <= hoy && d >= hace120;
}

export function validarRegistro(datos) {
  const errores = [];
  if (!datos.nombre || !datos.nombre.trim()) errores.push("El nombre es obligatorio.");
  if (!datos.correo || !CORREO_REGEX.test(datos.correo)) errores.push("El correo no es válido.");
  if (!datos.contrasena || datos.contrasena.length < 6)
    errores.push("La contraseña debe tener al menos 6 caracteres.");
  // El tipo de sangre es opcional al registrarse: se pide al activar el rol de donante
  if (datos.tipoSangre != null && !TIPOS_SANGRE.includes(datos.tipoSangre))
    errores.push("El tipo de sangre no es válido.");
  if (!datos.ciudad || !ciudadValida(datos.ciudad)) errores.push("Selecciona una ciudad de la lista.");
  if (!validarFechaNacimiento(datos.fechaNacimiento)) errores.push("La fecha de nacimiento no es válida.");
  return errores;
}

export function validarSolicitud(datos) {
  const errores = [];
  if (!TIPOS_SANGRE.includes(datos.tipoSangre)) errores.push("El tipo de sangre no es válido.");
  if (!datos.entidadId && (!datos.hospital || !datos.hospital.trim()))
    errores.push("Indica el hospital o selecciona una entidad.");
  if (!URGENCIAS.includes(datos.urgencia)) errores.push("La urgencia no es válida.");
  return errores;
}

// ── Formulario de requisitos para donar ──────────────────────────────
// PENDIENTE DE VALIDAR: estos valores deben confirmarse con el protocolo de
// un banco de sangre antes de usar la app con personas reales.
export const UMBRALES = {
  edadMinima: 18,
  edadMaxima: 65,
  pesoMinimoKg: 50,
  diasEntreDonacionesHombre: 90,
  diasEntreDonacionesMujer: 120,
  diasPorTatuajeOPiercing: 120,
  diasPorAntibioticos: 14,
  diasPorFiebre: 7,
};

const CONDICIONES_EXCLUYENTES = {
  vih: "Tener VIH.",
  hepatitisBC: "Tener hepatitis B o C.",
  cancer: "Haber tenido cáncer.",
  cardiaca: "Tener una enfermedad cardíaca.",
  diabetesInsulina: "Tener diabetes tratada con insulina.",
  drogasInyectadas: "Consumir drogas inyectadas.",
};

export function validarRespuestasElegibilidad(r) {
  const errores = [];
  if (!TIPOS_SANGRE.includes(r.tipoSangre)) errores.push("El tipo de sangre no es válido.");
  if (!r.fechaNacimiento || Number.isNaN(new Date(r.fechaNacimiento).getTime()))
    errores.push("La fecha de nacimiento no es válida.");
  if (typeof r.pesoKg !== "number" || r.pesoKg <= 0) errores.push("El peso no es válido.");
  if (!["F", "M"].includes(r.sexo)) errores.push("El sexo no es válido.");
  if (r.fechaUltimaDonacion && Number.isNaN(new Date(r.fechaUltimaDonacion).getTime()))
    errores.push("La fecha de la última donación no es válida.");
  return errores;
}

function edadEn(fechaNacimiento, ahora) {
  const n = new Date(fechaNacimiento);
  let edad = ahora.getUTCFullYear() - n.getUTCFullYear();
  const mes = ahora.getUTCMonth() - n.getUTCMonth();
  if (mes < 0 || (mes === 0 && ahora.getUTCDate() < n.getUTCDate())) edad--;
  return edad;
}

function sumarDias(fecha, dias) {
  const d = new Date(fecha);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function sumarDiasDesdeAhora(ahora, dias) {
  return sumarDias(ahora, dias);
}

// Devuelve { cumple, motivos: [{ tipo: "excluyente"|"temporal", mensaje }], reintentarEn }
// reintentarEn es la fecha más lejana entre los impedimentos temporales con fecha conocida.
export function evaluarElegibilidad(r, ahora = new Date()) {
  const motivos = [];
  const temporal = (mensaje, fechaReintento = null) =>
    motivos.push({ tipo: "temporal", mensaje, fechaReintento });
  const excluyente = (mensaje) => motivos.push({ tipo: "excluyente", mensaje });

  const edad = edadEn(r.fechaNacimiento, ahora);
  if (edad < UMBRALES.edadMinima || edad > UMBRALES.edadMaxima) {
    excluyente(`La edad debe estar entre ${UMBRALES.edadMinima} y ${UMBRALES.edadMaxima} años.`);
  }
  if (r.pesoKg < UMBRALES.pesoMinimoKg) {
    excluyente(`El peso mínimo para donar es ${UMBRALES.pesoMinimoKg} kg.`);
  }

  for (const [clave, mensaje] of Object.entries(CONDICIONES_EXCLUYENTES)) {
    if (r.condiciones?.[clave] === true) excluyente(mensaje);
  }

  if (r.sexo === "F" && r.embarazoOLactancia === true) {
    temporal("No puedes donar durante el embarazo ni la lactancia.");
  }
  if (r.tatuajeOPiercingReciente === true) {
    temporal(
      "Tatuaje o piercing reciente.",
      sumarDiasDesdeAhora(ahora, UMBRALES.diasPorTatuajeOPiercing)
    );
  }
  if (r.antibioticosRecientes === true) {
    temporal(
      "Antibióticos recientes.",
      sumarDiasDesdeAhora(ahora, UMBRALES.diasPorAntibioticos)
    );
  }
  if (r.fiebreHoy === true) {
    temporal("Fiebre o síntomas de gripa hoy.", sumarDiasDesdeAhora(ahora, UMBRALES.diasPorFiebre));
  }

  if (r.fechaUltimaDonacion) {
    const minimo =
      r.sexo === "M" ? UMBRALES.diasEntreDonacionesHombre : UMBRALES.diasEntreDonacionesMujer;
    const dias = Math.floor((ahora - new Date(r.fechaUltimaDonacion)) / 86400000);
    if (dias < minimo) {
      temporal(
        "Aún no ha pasado el tiempo mínimo desde tu última donación.",
        sumarDias(r.fechaUltimaDonacion, minimo)
      );
    }
  }

  const hayExcluyente = motivos.some((m) => m.tipo === "excluyente");
  const fechas = motivos.map((m) => m.fechaReintento).filter(Boolean).sort();
  return {
    cumple: motivos.length === 0,
    motivos: motivos.map(({ tipo, mensaje }) => ({ tipo, mensaje })),
    reintentarEn: hayExcluyente || fechas.length === 0 ? null : fechas[fechas.length - 1],
  };
}

// Convierte la fecha de creación en texto legible ("hace 12 min")
export function tiempoRelativo(fecha, ahora = new Date()) {
  const minutos = Math.floor((ahora - new Date(fecha)) / 60000);
  if (minutos < 1) return "ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

// La columna DATE llega como Date; se devuelve como AAAA-MM-DD
export function formatearFecha(valor) {
  if (!valor) return null;
  if (typeof valor === "string") return valor.slice(0, 10);
  const y = valor.getFullYear();
  const m = String(valor.getMonth() + 1).padStart(2, "0");
  const d = String(valor.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Forma pública de un donante (nunca se devuelve el hash de la contraseña)
export function serializarDonante(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    tipoSangre: fila.tipo_sangre,
    ciudad: fila.ciudad,
    fechaNacimiento: formatearFecha(fila.fecha_nacimiento),
    disponible: fila.disponible,
    donacionesRealizadas: fila.donaciones_realizadas,
    esDonante: fila.es_donante,
    esSolicitante: fila.es_solicitante,
  };
}

// Forma pública de una solicitud, con la misma estructura que usa la app.
// El teléfono de contacto nunca se incluye aquí.
export function serializarSolicitud(fila) {
  return {
    id: fila.id,
    tipoSangre: fila.tipo_sangre,
    hospital: fila.hospital,
    ciudad: fila.ciudad,
    distanciaKm: fila.distancia_km === null ? null : Number(fila.distancia_km),
    urgencia: fila.urgencia,
    creadaHace: tiempoRelativo(fila.creada_en),
    estado: fila.estado,
    entidadId: fila.entidad_id ?? null,
    latitud: fila.latitud === null || fila.latitud === undefined ? null : Number(fila.latitud),
    longitud: fila.longitud === null || fila.longitud === undefined ? null : Number(fila.longitud),
    donantesConfirmados: fila.donantes_confirmados ?? [],
    donantesIds: fila.donantes_ids ?? [],
    yaConfirmo: Boolean(fila.ya_confirmo),
    esMia: Boolean(fila.es_mia),
  };
}

export function serializarEntidad(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    ciudad: fila.ciudad,
    telefono: fila.telefono,
    latitud: fila.latitud === null ? null : Number(fila.latitud),
    longitud: fila.longitud === null ? null : Number(fila.longitud),
    esAliada: fila.es_aliada,
  };
}
