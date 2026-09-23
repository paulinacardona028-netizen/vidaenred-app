import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { MainTabParamList } from "../types/navigation";
import { HomeStackNavigator } from "./HomeStackNavigator";
import { CrearSolicitudScreen } from "../screens/CrearSolicitudScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { colors } from "../styles/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTintColor: colors.text,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "help-circle-outline";
          if (route.name === "InicioTab") iconName = "home-outline";
          if (route.name === "CrearSolicitud") iconName = "add-circle-outline";
          if (route.name === "Perfil") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="InicioTab"
        component={HomeStackNavigator}
        options={{ title: "Inicio", headerShown: false }}
      />
      <Tab.Screen
        name="CrearSolicitud"
        component={CrearSolicitudScreen}
        options={{ title: "Crear solicitud" }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ title: "Perfil" }}
      />
    </Tab.Navigator>
  );
}
