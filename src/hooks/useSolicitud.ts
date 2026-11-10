import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { SolicitudSangre } from "../types/models";

// Devuelve la solicitud desde memoria o, si no está, la pide al servidor
export function useSolicitud(id: string) {
  const { obtenerSolicitudPorId } = useApp();
  const enMemoria = obtenerSolicitudPorId(id);
  const [remota, setRemota] = useState<SolicitudSangre | null>(null);
  const [cargando, setCargando] = useState(!enMemoria);
  const [noEncontrada, setNoEncontrada] = useState(false);

  useEffect(() => {
    if (enMemoria) {
      setCargando(false);
      return;
    }
    let activo = true;
    api
      .obtenerSolicitud(id)
      .then((s) => activo && setRemota(s))
      .catch(() => activo && setNoEncontrada(true))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [id, enMemoria]);

  return { solicitud: enMemoria ?? remota, cargando, noEncontrada };
}
