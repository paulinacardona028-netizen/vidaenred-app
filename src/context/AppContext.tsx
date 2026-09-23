import React, { createContext, useContext, useState, ReactNode } from "react";
import { donanteMock, solicitudesMock } from "../services/mockData";
import {
  COMPATIBILIDAD_DONANTE,
  Donante,
  NivelUrgencia,
  SolicitudSangre,
  TipoSangre,
} from "../types/models";

interface AppContextType {
  // sesion
  estaLogueado: boolean;
  iniciarSesion: (correo: string) => void;
  cerrarSesion: () => void;

  // donante
  donante: Donante;
  cambiarDisponibilidad: (disponible: boolean) => void;

  // solicitudes
  solicitudes: SolicitudSangre[];
  solicitudesCompatibles: SolicitudSangre[];
  crearSolicitud: (datos: {
    tipoSangre: TipoSangre;
    hospital: string;
    urgencia: NivelUrgencia;
  }) => void;
  confirmarDonacion: (solicitudId: string) => void;
  obtenerSolicitudPorId: (id: string) => SolicitudSangre | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [donante, setDonante] = useState<Donante>(donanteMock);
  const [solicitudes, setSolicitudes] =
    useState<SolicitudSangre[]>(solicitudesMock);

  function iniciarSesion(correo: string) {
    // Login simulado: no valida contra un backend, solo simula la sesion
    setDonante((prev) => ({ ...prev, correo }));
    setEstaLogueado(true);
  }

  function cerrarSesion() {
    setEstaLogueado(false);
  }

  function cambiarDisponibilidad(disponible: boolean) {
    setDonante((prev) => ({ ...prev, disponible }));
  }

  // Regla de negocio: el donante solo ve solicitudes de tipos de sangre
  // compatibles con el suyo (no todas)
  const tiposCompatibles = COMPATIBILIDAD_DONANTE[donante.tipoSangre];
  const solicitudesCompatibles = solicitudes.filter(
    (s) => s.estado === "activa" && tiposCompatibles.includes(s.tipoSangre)
  );

  function crearSolicitud(datos: {
    tipoSangre: TipoSangre;
    hospital: string;
    urgencia: NivelUrgencia;
  }) {
    const nuevaSolicitud: SolicitudSangre = {
      id: Date.now().toString(),
      tipoSangre: datos.tipoSangre,
      hospital: datos.hospital,
      ciudad: donante.ciudad,
      distanciaKm: 0,
      urgencia: datos.urgencia,
      creadaHace: "ahora",
      estado: "activa",
      donantesConfirmados: [],
    };
    setSolicitudes((prev) => [nuevaSolicitud, ...prev]);
  }

  function confirmarDonacion(solicitudId: string) {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === solicitudId && !s.donantesConfirmados.includes(donante.nombre)
          ? {
              ...s,
              donantesConfirmados: [...s.donantesConfirmados, donante.nombre],
            }
          : s
      )
    );
  }

  function obtenerSolicitudPorId(id: string) {
    return solicitudes.find((s) => s.id === id);
  }

  return (
    <AppContext.Provider
      value={{
        estaLogueado,
        iniciarSesion,
        cerrarSesion,
        donante,
        cambiarDisponibilidad,
        solicitudes,
        solicitudesCompatibles,
        crearSolicitud,
        confirmarDonacion,
        obtenerSolicitudPorId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook personalizado para consumir el contexto facilmente
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe usarse dentro de un AppProvider");
  }
  return context;
}
