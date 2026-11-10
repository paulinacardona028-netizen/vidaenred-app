import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { api, ApiError, DatosRegistro, setToken } from "../services/api";
import {
  Donante,
  NivelUrgencia,
  RespuestasEvaluacion,
  ResultadoEvaluacion,
  SolicitudSangre,
  TipoSangre,
} from "../types/models";

interface AppContextType {
  // sesion
  estaLogueado: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => void;

  // donante (null mientras no hay sesion)
  donante: Donante | null;
  cambiarDisponibilidad: (disponible: boolean) => Promise<void>;
  cambiarRoles: (cambios: { esDonante?: boolean; esSolicitante?: boolean }) => Promise<void>;
  evaluarRequisitos: (respuestas: RespuestasEvaluacion) => Promise<ResultadoEvaluacion>;

  // solicitudes compatibles con el tipo del donante
  solicitudesCompatibles: SolicitudSangre[];
  refrescarSolicitudes: () => Promise<void>;
  crearSolicitud: (datos: {
    tipoSangre: TipoSangre;
    hospital: string;
    urgencia: NivelUrgencia;
  }) => Promise<void>;
  confirmarDonacion: (solicitudId: string) => Promise<void>;
  obtenerSolicitudPorId: (id: string) => SolicitudSangre | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [donante, setDonante] = useState<Donante | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudSangre[]>([]);

  const refrescarSolicitudes = useCallback(async () => {
    try {
      setSolicitudes(await api.listarCompatibles());
    } catch (err) {
      // Un solicitante que no es donante recibe 403: simplemente no hay lista que mostrar
      if (err instanceof ApiError && err.status === 403) {
        setSolicitudes([]);
        return;
      }
      throw err;
    }
  }, []);

  async function iniciarSesion(correo: string, contrasena: string) {
    const { token, donante: perfil } = await api.login(correo, contrasena);
    setToken(token);
    setDonante(perfil);
    setEstaLogueado(true);
    await refrescarSolicitudes();
  }

  async function registrarse(datos: DatosRegistro) {
    const { token, donante: perfil } = await api.registrar(datos);
    setToken(token);
    setDonante(perfil);
    setEstaLogueado(true);
    await refrescarSolicitudes();
  }

  function cerrarSesion() {
    setToken(null);
    setDonante(null);
    setSolicitudes([]);
    setEstaLogueado(false);
  }

  async function cambiarDisponibilidad(disponible: boolean) {
    const actualizado = await api.cambiarDisponibilidad(disponible);
    setDonante(actualizado);
  }

  async function cambiarRoles(cambios: { esDonante?: boolean; esSolicitante?: boolean }) {
    const actualizado = await api.cambiarRoles(cambios);
    setDonante(actualizado);
    await refrescarSolicitudes();
  }

  async function evaluarRequisitos(respuestas: RespuestasEvaluacion) {
    const resultado = await api.evaluarRequisitos(respuestas);
    setDonante(resultado.donante);
    if (resultado.cumple) await refrescarSolicitudes();
    return resultado;
  }

  async function crearSolicitud(datos: {
    tipoSangre: TipoSangre;
    hospital: string;
    urgencia: NivelUrgencia;
  }) {
    await api.crearSolicitud(datos);
    // Si la solicitud es compatible con el donante, aparecerá en la lista
    await refrescarSolicitudes();
  }

  async function confirmarDonacion(solicitudId: string) {
    const actualizada = await api.confirmarDonacion(solicitudId);
    setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)));
  }

  function obtenerSolicitudPorId(id: string) {
    return solicitudes.find((s) => s.id === id);
  }

  return (
    <AppContext.Provider
      value={{
        estaLogueado,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        donante,
        cambiarDisponibilidad,
        cambiarRoles,
        evaluarRequisitos,
        solicitudesCompatibles: solicitudes,
        refrescarSolicitudes,
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
