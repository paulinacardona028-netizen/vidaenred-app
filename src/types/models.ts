// Tipos de sangre válidos (regla de negocio del proyecto)
export type TipoSangre = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export const TIPOS_SANGRE: TipoSangre[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export type NivelUrgencia = "Alta" | "Moderada" | "Programada";

// Una solicitud de sangre publicada por un familiar / hospital / banco de sangre
export interface SolicitudSangre {
  id: string;
  tipoSangre: TipoSangre;
  hospital: string;
  ciudad: string;
  distanciaKm: number | null; // null cuando no se conoce la distancia
  urgencia: NivelUrgencia;
  creadaHace: string; // texto calculado por el servidor, ej. "hace 12 min"
  estado: "activa" | "resuelta";
  donantesConfirmados: string[]; // nombres de donantes que confirmaron
  yaConfirmo: boolean; // si el donante logueado ya confirmó esta solicitud
}

// Perfil del donante (usuario logueado)
export interface Donante {
  id: string;
  nombre: string;
  correo: string;
  tipoSangre: TipoSangre;
  ciudad: string;
  disponible: boolean;
  donacionesRealizadas: number;
}
