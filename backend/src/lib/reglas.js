// Reglas de negocio de VidaEnRed. Viven en el servidor para que la app
// no pueda saltárselas.

export const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const URGENCIAS = ["Alta", "Moderada", "Programada"];

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

export function validarRegistro(datos) {
  const errores = [];
  if (!datos.nombre || !datos.nombre.trim()) errores.push("El nombre es obligatorio.");
  if (!datos.correo || !CORREO_REGEX.test(datos.correo)) errores.push("El correo no es válido.");
  if (!datos.contrasena || datos.contrasena.length < 6)
    errores.push("La contraseña debe tener al menos 6 caracteres.");
  if (!TIPOS_SANGRE.includes(datos.tipoSangre)) errores.push("El tipo de sangre no es válido.");
  if (!datos.ciudad || !datos.ciudad.trim()) errores.push("La ciudad es obligatoria.");
  return errores;
}

export function validarSolicitud(datos) {
  const errores = [];
  if (!TIPOS_SANGRE.includes(datos.tipoSangre)) errores.push("El tipo de sangre no es válido.");
  if (!datos.hospital || !datos.hospital.trim()) errores.push("El hospital es obligatorio.");
  if (!URGENCIAS.includes(datos.urgencia)) errores.push("La urgencia no es válida.");
  return errores;
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

// Forma pública de un donante (nunca se devuelve el hash de la contraseña)
export function serializarDonante(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    tipoSangre: fila.tipo_sangre,
    ciudad: fila.ciudad,
    disponible: fila.disponible,
    donacionesRealizadas: fila.donaciones_realizadas,
  };
}

// Forma pública de una solicitud, con la misma estructura que usa la app
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
    donantesConfirmados: fila.donantes_confirmados ?? [],
    yaConfirmo: Boolean(fila.ya_confirmo),
  };
}
