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
  entidadId: string | null;
  latitud: number | null;
  longitud: number | null;
  donantesConfirmados: string[]; // nombres de donantes que confirmaron
  donantesIds: string[]; // ids de esos mismos donantes (para cerrar la solicitud)
  yaConfirmo: boolean; // si el donante logueado ya confirmó esta solicitud
  esMia: boolean; // si la solicitud la publicó la cuenta logueada
}

// Cuenta del usuario. Puede ser donante, solicitante o ambos.
export interface Donante {
  id: string;
  nombre: string;
  correo: string;
  tipoSangre: TipoSangre | null; // null si nunca completó el formulario de donante
  ciudad: string;
  disponible: boolean;
  donacionesRealizadas: number;
  esDonante: boolean;
  esSolicitante: boolean;
}

// Formulario de requisitos para donar (espejo de POST /api/donante/evaluacion)
export interface CondicionesEvaluacion {
  vih: boolean;
  hepatitisBC: boolean;
  cancer: boolean;
  cardiaca: boolean;
  diabetesInsulina: boolean;
  drogasInyectadas: boolean;
}

export interface RespuestasEvaluacion {
  tipoSangre: TipoSangre;
  fechaNacimiento: string; // AAAA-MM-DD
  pesoKg: number;
  sexo: "F" | "M";
  fechaUltimaDonacion?: string; // AAAA-MM-DD, opcional
  embarazoOLactancia?: boolean;
  tatuajeOPiercingReciente?: boolean;
  antibioticosRecientes?: boolean;
  fiebreHoy?: boolean;
  condiciones: CondicionesEvaluacion;
}

export interface MotivoEvaluacion {
  tipo: "excluyente" | "temporal";
  mensaje: string;
}

export interface ResultadoEvaluacion {
  cumple: boolean;
  motivos: MotivoEvaluacion[];
  reintentarEn: string | null; // AAAA-MM-DD cuando el impedimento es temporal
  donante: Donante;
}

// Entidad del catálogo: hospital, urgencias, banco de sangre o clínica
export type TipoEntidad = "Hospital" | "Urgencias" | "Banco de sangre" | "Clínica";

export interface Entidad {
  id: string;
  nombre: string;
  tipo: TipoEntidad;
  ciudad: string;
  telefono: string | null;
  latitud: number | null;
  longitud: number | null;
  esAliada: boolean;
}

// Donación completada que aparece en el historial del donante
export interface DonacionHistorial {
  solicitudId: string;
  hospital: string;
  tipoSangre: TipoSangre;
  urgencia: NivelUrgencia;
  completadaEn: string;
}

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  solicitudId: string | null;
  leida: boolean;
  creadaEn: string;
}
