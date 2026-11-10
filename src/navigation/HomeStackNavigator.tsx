import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { InicioScreen } from "../screens/InicioScreen";
import { DetalleSolicitudScreen } from "../screens/DetalleSolicitudScreen";
import { ConfirmacionDonacionScreen } from "../screens/ConfirmacionDonacionScreen";
import { colors } from "../styles/colors";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Inicio"
        component={InicioScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DetalleSolicitud"
        component={DetalleSolicitudScreen}
        options={{ title: "Detalle de solicitud" }}
      />
      <Stack.Screen
        name="ConfirmacionDonacion"
        component={ConfirmacionDonacionScreen}
        options={{ title: "Confirmación" }}
      />
    </Stack.Navigator>
  );
}
