import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { api, ApiError, DatosNuevaSolicitud, DatosRegistro, setToken } from "../services/api";
import {
  Donante,
  RespuestasEvaluacion,
  ResultadoEvaluacion,
  SolicitudSangre,
} from "../types/models";

export type Modo = "donar" | "solicitar";

interface AppContextType {
  // sesión
  estaLogueado: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  registrarse: (datos: DatosRegistro) => Promise<void>;
  cerrarSesion: () => void;

  // donante (null mientras no hay sesión)
  donante: Donante | null;
  cambiarDisponibilidad: (disponible: boolean) => Promise<void>;
  cambiarRoles: (cambios: { esDonante?: boolean; esSolicitante?: boolean }) => Promise<void>;
  evaluarRequisitos: (respuestas: RespuestasEvaluacion) => Promise<ResultadoEvaluacion>;

  // modo activo: solo cambia de verdad si la cuenta tiene los dos roles
  modo: Modo;
  cambiarModo: (modo: Modo) => void;

  // solicitudes
  solicitudesCompatibles: SolicitudSangre[];
  refrescarSolicitudes: () => Promise<void>;
  misSolicitudes: SolicitudSangre[];
  refrescarMisSolicitudes: () => Promise<void>;
  crearSolicitud: (datos: DatosNuevaSolicitud) => Promise<SolicitudSangre>;
  confirmarDonacion: (solicitudId: string) => Promise<SolicitudSangre>;
  cerrarSolicitud: (solicitudId: string, donantesIds: string[]) => Promise<void>;
  obtenerSolicitudPorId: (id: string) => SolicitudSangre | undefined;

  // notificaciones
  noLeidas: number;
  refrescarNoLeidas: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Algunas listas responden 403 si la cuenta no tiene el rol. Eso significa "lista vacía".
async function listaTolerante<T>(pedir: () => Promise<T[]>): Promise<T[]> {
  try {
    return await pedir();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return [];
    throw err;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [estaLogueado, setEstaLogueado] = useState(false);
  const [donante, setDonante] = useState<Donante | null>(null);
  const [modoElegido, setModoElegido] = useState<Modo | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudSangre[]>([]);
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudSangre[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const refrescarSolicitudes = useCallback(async () => {
    setSolicitudes(await listaTolerante(() => api.listarCompatibles()));
  }, []);

  const refrescarMisSolicitudes = useCallback(async () => {
    setMisSolicitudes(await listaTolerante(() => api.listarMisSolicitudes()));
  }, []);

  const refrescarNoLeidas = useCallback(async () => {
    try {
      const lista = await api.notificaciones();
      setNoLeidas(lista.filter((n) => !n.leida).length);
    } catch {
      setNoLeidas(0);
    }
  }, []);

  async function cargarDatosIniciales() {
    await Promise.all([refrescarSolicitudes(), refrescarMisSolicitudes(), refrescarNoLeidas()]);
  }

  async function iniciarSesion(correo: string, contrasena: string) {
    const { token, donante: perfil } = await api.login(correo, contrasena);
    setToken(token);
    setDonante(perfil);
    setModoElegido(null);
    setEstaLogueado(true);
    await cargarDatosIniciales();
  }

  async function registrarse(datos: DatosRegistro) {
    const { token, donante: perfil } = await api.registrar(datos);
    setToken(token);
    setDonante(perfil);
    setModoElegido(null);
    setEstaLogueado(true);
    await cargarDatosIniciales();
  }

  function cerrarSesion() {
    setToken(null);
    setDonante(null);
    setModoElegido(null);
    setSolicitudes([]);
    setMisSolicitudes([]);
    setNoLeidas(0);
    setEstaLogueado(false);
  }

  // Modo efectivo: si la cuenta solo tiene un rol, ese es el único modo posible
  let modo: Modo = "solicitar";
  if (donante) {
    if (donante.esDonante && donante.esSolicitante) modo = modoElegido ?? "donar";
    else modo = donante.esDonante ? "donar" : "solicitar";
  }

  function cambiarModo(nuevo: Modo) {
    setModoElegido(nuevo);
  }

  async function cambiarDisponibilidad(disponible: boolean) {
    setDonante(await api.cambiarDisponibilidad(disponible));
    await refrescarSolicitudes();
  }

  async function cambiarRoles(cambios: { esDonante?: boolean; esSolicitante?: boolean }) {
    setDonante(await api.cambiarRoles(cambios));
    await cargarDatosIniciales();
  }

  async function evaluarRequisitos(respuestas: RespuestasEvaluacion) {
    const resultado = await api.evaluarRequisitos(respuestas);
    setDonante(resultado.donante);
    await cargarDatosIniciales();
    return resultado;
  }

  async function crearSolicitud(datos: DatosNuevaSolicitud) {
    const creada = await api.crearSolicitud(datos);
    await refrescarMisSolicitudes();
    return creada;
  }

  async function confirmarDonacion(solicitudId: string) {
    const actualizada = await api.confirmarDonacion(solicitudId);
    setSolicitudes((prev) => prev.map((s) => (s.id === actualizada.id ? actualizada : s)));
    return actualizada;
  }

  async function cerrarSolicitud(solicitudId: string, donantesIds: string[]) {
    await api.cerrarSolicitud(solicitudId, donantesIds);
    await refrescarMisSolicitudes();
  }

  function obtenerSolicitudPorId(id: string) {
    return (
      solicitudes.find((s) => s.id === id) ?? misSolicitudes.find((s) => s.id === id)
    );
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
        modo,
        cambiarModo,
        solicitudesCompatibles: solicitudes,
        refrescarSolicitudes,
        misSolicitudes,
        refrescarMisSolicitudes,
        crearSolicitud,
        confirmarDonacion,
        cerrarSolicitud,
        obtenerSolicitudPorId,
        noLeidas,
        refrescarNoLeidas,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp debe usarse dentro de un AppProvider");
  }
  return context;
}
