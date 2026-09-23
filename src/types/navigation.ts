// Stack raiz de la app: Login -> MainTabs
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
};

// Pestanas principales (bottom tabs) que ve el usuario ya logueado
export type MainTabParamList = {
  InicioTab: undefined;
  CrearSolicitud: undefined;
  Perfil: undefined;
};

// Stack interno de la pestana "Inicio": la lista y su detalle
export type HomeStackParamList = {
  Inicio: undefined;
  DetalleSolicitud: { solicitudId: string };
};
