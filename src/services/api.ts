import Constants from "expo-constants";
import {
  Donante,
  DonacionHistorial,
  Entidad,
  Notificacion,
  NivelUrgencia,
  RespuestasEvaluacion,
  ResultadoEvaluacion,
  SolicitudSangre,
  TipoEntidad,
  TipoSangre,
} from "../types/models";

const PUERTO_API = 3000;

// En desarrollo, Expo ya sabe la IP de la Mac desde la que se abre la app.
// Así la API se encuentra sola, sin escribir ninguna IP a mano.
function direccionDesarrollo(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? "";
  const host = hostUri.split(":")[0];
  const esIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  return esIp ? `http://${host}:${PUERTO_API}/api` : `http://localhost:${PUERTO_API}/api`;
}

// Prioridad: EXPO_PUBLIC_API_URL (si se define) > detección automática en desarrollo
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? (__DEV__ ? direccionDesarrollo() : "");

// Una versión de producción nunca debe quedar sin dirección de API
if (!__DEV__ && !BASE_URL) {
  throw new Error("Falta EXPO_PUBLIC_API_URL: define la dirección de la API en eas.json.");
}

let token: string | null = null;

export function setToken(nuevoToken: string | null) {
  token = nuevoToken;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface OpcionesPeticion {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
}

async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: opciones.method ?? "GET",
      headers,
      body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
    });
  } catch {
    throw new ApiError(
      `No se pudo conectar con el servidor en ${BASE_URL}. Revisa que el backend esté encendido (npm run diagnostico).`,
      0
    );
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ApiError(datos.error ?? "Ocurrió un error inesperado.", respuesta.status);
  }
  return datos as T;
}

export interface DatosRegistro {
  nombre: string;
  correo: string;
  contrasena: string;
  ciudad: string;
  fechaNacimiento: string; // AAAA-MM-DD
  tipoSangre?: TipoSangre; // opcional: se completa al activar el rol de donante
}

export interface DatosNuevaSolicitud {
  tipoSangre: TipoSangre;
  urgencia: NivelUrgencia;
  entidadId: string;
  pacienteNombre?: string;
  contactoTelefono?: string;
}

interface RespuestaSesion {
  token: string;
  donante: Donante;
}

export const api = {
  // ── Sesión y cuenta ──
  registrar: (datos: DatosRegistro) =>
    peticion<RespuestaSesion>("/auth/registro", { method: "POST", body: datos }),

  login: (correo: string, contrasena: string) =>
    peticion<RespuestaSesion>("/auth/login", { method: "POST", body: { correo, contrasena } }),

  recuperarContrasena: (correo: string) =>
    peticion<{ mensaje: string }>("/auth/recuperar", { method: "POST", body: { correo } }),

  restablecerContrasena: (correo: string, codigo: string, contrasena: string) =>
    peticion<{ mensaje: string }>("/auth/restablecer", {
      method: "POST",
      body: { correo, codigo, contrasena },
    }),

  obtenerDonante: () => peticion<Donante>("/donante"),

  cambiarDisponibilidad: (disponible: boolean) =>
    peticion<Donante>("/donante/disponibilidad", { method: "PATCH", body: { disponible } }),

  cambiarRoles: (cambios: { esDonante?: boolean; esSolicitante?: boolean }) =>
    peticion<Donante>("/donante/roles", { method: "PATCH", body: cambios }),

  evaluarRequisitos: (respuestas: RespuestasEvaluacion) =>
    peticion<ResultadoEvaluacion>("/donante/evaluacion", { method: "POST", body: respuestas }),

  historial: () => peticion<DonacionHistorial[]>("/donante/historial"),

  notificaciones: () => peticion<Notificacion[]>("/donante/notificaciones"),

  marcarNotificacionesLeidas: () =>
    peticion<{ ok: boolean }>("/donante/notificaciones/leer", { method: "POST" }),

  // ── Catálogo de entidades (público) ──
  listarEntidades: (filtros: { tipo?: TipoEntidad; ciudad?: string } = {}) => {
    const params: string[] = [];
    if (filtros.tipo) params.push(`tipo=${encodeURIComponent(filtros.tipo)}`);
    if (filtros.ciudad) params.push(`ciudad=${encodeURIComponent(filtros.ciudad)}`);
    return peticion<Entidad[]>(`/entidades${params.length ? `?${params.join("&")}` : ""}`);
  },

  // ── Ciudades (catálogo público) ──
  listarCiudades: () => peticion<string[]>("/ciudades"),

  // ── Solicitudes ──
  listarCompatibles: () => peticion<SolicitudSangre[]>("/solicitudes/compatibles"),

  listarMisSolicitudes: () => peticion<SolicitudSangre[]>("/solicitudes/mias"),

  obtenerSolicitud: (id: string) => peticion<SolicitudSangre>(`/solicitudes/${id}`),

  crearSolicitud: (datos: DatosNuevaSolicitud) =>
    peticion<SolicitudSangre>("/solicitudes", { method: "POST", body: datos }),

  confirmarDonacion: (id: string) =>
    peticion<SolicitudSangre>(`/solicitudes/${id}/donaciones`, { method: "POST" }),

  cerrarSolicitud: (id: string, donantesIds: string[]) =>
    peticion<SolicitudSangre>(`/solicitudes/${id}/resolver`, {
      method: "POST",
      body: { donantesIds },
    }),
};
