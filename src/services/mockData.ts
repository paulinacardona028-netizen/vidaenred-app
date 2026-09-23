import { Donante, SolicitudSangre } from "../types/models";

// Simula la respuesta de un backend (por ahora no hay backend real, solo mocks)
export const donanteMock: Donante = {
  nombre: "Juan Perez",
  correo: "juan.perez@correo.com",
  tipoSangre: "O+",
  ciudad: "Medellin",
  disponible: true,
  donacionesRealizadas: 4,
};

export const solicitudesMock: SolicitudSangre[] = [
  {
    id: "1",
    tipoSangre: "O+",
    hospital: "Hosp. San Rafael",
    ciudad: "Medellin",
    distanciaKm: 1.2,
    urgencia: "Alta",
    creadaHace: "hace 12 min",
    estado: "activa",
    donantesConfirmados: ["Maria Gomez", "Carlos Ruiz"],
  },
  {
    id: "2",
    tipoSangre: "A-",
    hospital: "Banco de sangre central",
    ciudad: "Medellin",
    distanciaKm: 3,
    urgencia: "Moderada",
    creadaHace: "hace 40 min",
    estado: "activa",
    donantesConfirmados: [],
  },
  {
    id: "3",
    tipoSangre: "B+",
    hospital: "Clinica del Norte",
    ciudad: "Medellin",
    distanciaKm: 5,
    urgencia: "Programada",
    creadaHace: "hace 2 h",
    estado: "activa",
    donantesConfirmados: ["Laura Diaz"],
  },
];
