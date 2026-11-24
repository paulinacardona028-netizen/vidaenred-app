
import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  Login: undefined;
  RecuperarContrasena: undefined;
  MainTabs: undefined;
  Requisitos: undefined;
  Historial: undefined;
  Notificaciones: undefined;
};

// Pestañas principales
export type MainTabParamList = {
  InicioTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  Solicitudes: undefined;
  Entidades: undefined;
  Avisos: undefined;
  CrearSolicitud: undefined;
  Perfil: undefined;
};

// Stack interno de Inicio
export type HomeStackParamList = {
  Inicio: undefined;
  DetalleSolicitud: { solicitudId: string };
  ConfirmacionDonacion: { solicitudId: string };
};
