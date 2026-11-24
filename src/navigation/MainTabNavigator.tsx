
import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { MainTabParamList } from "../types/navigation";
import { HomeStackNavigator } from "./HomeStackNavigator";
import { CrearSolicitudScreen } from "../screens/CrearSolicitudScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { SolicitudesScreen } from "../screens/SolicitudesScreen";
import { EntidadesScreen } from "../screens/EntidadesScreen";
import { NotificacionesScreen } from "../screens/NotificacionesScreen";
import { colors } from "../styles/colors";
import { useApp } from "../context/AppContext";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  const { noLeidas } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,

        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 3,
        },

        tabBarIcon: ({ color, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap =
            "help-circle-outline";

          switch (route.name) {
            case "InicioTab":
              iconName = focused ? "home" : "home-outline";
              break;

            case "Solicitudes":
              iconName = focused
                ? "clipboard"
                : "clipboard-outline";
              break;

            case "Entidades":
              iconName = focused
                ? "business"
                : "business-outline";
              break;

            case "Avisos":
              iconName = focused
                ? "notifications"
                : "notifications-outline";
              break;

            case "Perfil":
              iconName = focused
                ? "person"
                : "person-outline";
              break;

            case "CrearSolicitud":
              iconName = "add-circle-outline";
              break;
          }

          return (
            <View
              style={[
                styles.iconContainer,
                focused && styles.iconActive,
              ]}
            >
              <Ionicons
                name={iconName}
                size={23}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="InicioTab"
        component={HomeStackNavigator}
        options={{ title: "Inicio" }}
      />

      <Tab.Screen
        name="Solicitudes"
        component={SolicitudesScreen}
        options={{
          title: "Solicitudes",
          headerShown: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Tab.Screen
        name="Entidades"
        component={EntidadesScreen}
        options={{
          title: "Entidades",
          headerShown: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <Tab.Screen
        name="Avisos"
        component={NotificacionesScreen}
        options={{
          title: "Avisos",
          headerShown: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },

          tabBarBadge:
            noLeidas > 0
              ? noLeidas > 9
                ? "9+"
                : noLeidas
              : undefined,

          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.white,
            fontSize: 10,
          },
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ title: "Perfil" }}
      />

      <Tab.Screen
        name="CrearSolicitud"
        component={CrearSolicitudScreen}
        options={{
          title: "Crear solicitud",
          headerShown: true,
          tabBarButton: () => null,
          tabBarItemStyle: {
            display: "none",
          },
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 47,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  iconActive: {
    backgroundColor: colors.urgent,
  },
});
