// Stack raiz de la app: Login -> MainTabs, y pantallas que se abren encima de las pestañas
export type RootStackParamList = {
  Login: undefined;
  RecuperarContrasena: undefined;
  MainTabs: undefined;
  Requisitos: undefined;
  Historial: undefined;
  Notificaciones: undefined;
};

// Pestanas principales (bottom tabs) que ve el usuario ya logueado
export type MainTabParamList = {
  InicioTab: undefined;
  CrearSolicitud: undefined;
  Perfil: undefined;
};

// Stack interno de la pestana "Inicio": la lista, el detalle y la confirmación
export type HomeStackParamList = {
  Inicio: undefined;
  DetalleSolicitud: { solicitudId: string };
  ConfirmacionDonacion: { solicitudId: string };
};
