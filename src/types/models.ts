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
  distanciaKm: number;
  urgencia: NivelUrgencia;
  creadaHace: string; // texto simple tipo "hace 12 min" (mock)
  estado: "activa" | "resuelta";
  donantesConfirmados: string[]; // nombres de donantes que confirmaron
}

// Perfil del donante (usuario logueado)
export interface Donante {
  nombre: string;
  correo: string;
  tipoSangre: TipoSangre;
  ciudad: string;
  disponible: boolean;
  donacionesRealizadas: number;
}

// Compatibilidad simple donante -> puede donar a estos tipos
// (regla de compatibilidad de banco de sangre, simplificada para el proyecto)
export const COMPATIBILIDAD_DONANTE: Record<TipoSangre, TipoSangre[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // donante universal
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};
