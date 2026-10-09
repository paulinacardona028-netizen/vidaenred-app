import { Donante, NivelUrgencia, SolicitudSangre, TipoSangre } from "../types/models";

// En el celular o emulador, "localhost" apunta al propio dispositivo.
// Define EXPO_PUBLIC_API_URL con la IP de tu computador, ej. http://192.168.1.20:3000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

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
    throw new ApiError("No se pudo conectar con el servidor. Revisa tu conexión.", 0);
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
  tipoSangre: TipoSangre;
  ciudad: string;
}

interface RespuestaSesion {
  token: string;
  donante: Donante;
}

export const api = {
  registrar: (datos: DatosRegistro) =>
    peticion<RespuestaSesion>("/auth/registro", { method: "POST", body: datos }),

  login: (correo: string, contrasena: string) =>
    peticion<RespuestaSesion>("/auth/login", {
      method: "POST",
      body: { correo, contrasena },
    }),

  obtenerDonante: () => peticion<Donante>("/donante"),

  cambiarDisponibilidad: (disponible: boolean) =>
    peticion<Donante>("/donante/disponibilidad", { method: "PATCH", body: { disponible } }),

  listarCompatibles: () => peticion<SolicitudSangre[]>("/solicitudes/compatibles"),

  obtenerSolicitud: (id: string) => peticion<SolicitudSangre>(`/solicitudes/${id}`),

  crearSolicitud: (datos: { tipoSangre: TipoSangre; hospital: string; urgencia: NivelUrgencia }) =>
    peticion<SolicitudSangre>("/solicitudes", { method: "POST", body: datos }),

  confirmarDonacion: (id: string) =>
    peticion<SolicitudSangre>(`/solicitudes/${id}/donaciones`, { method: "POST" }),
};
