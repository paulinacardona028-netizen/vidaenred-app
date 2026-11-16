import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { RequisitosScreen } from "../screens/RequisitosScreen";
import { RecuperarContrasenaScreen } from "../screens/RecuperarContrasenaScreen";
import { HistorialScreen } from "../screens/HistorialScreen";
import { NotificacionesScreen } from "../screens/NotificacionesScreen";
import { colors } from "../styles/colors";
import { useApp } from "../context/AppContext";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { estaLogueado, cargandoSesion } = useApp();

  // Mientras se restaura la sesión guardada no se muestra ninguna pantalla
  if (cargandoSesion) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={estaLogueado ? "MainTabs" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="Requisitos"
          component={RequisitosScreen}
          options={{
            headerShown: true,
            title: "Requisitos para donar",
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="RecuperarContrasena"
          component={RecuperarContrasenaScreen}
          options={{
            headerShown: true,
            title: "Recuperar contraseña",
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="Historial"
          component={HistorialScreen}
          options={{
            headerShown: true,
            title: "Mi historial",
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="Notificaciones"
          component={NotificacionesScreen}
          options={{
            headerShown: true,
            title: "Notificaciones",
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
