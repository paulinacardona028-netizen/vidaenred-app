import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { LoginScreen } from "../screens/LoginScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { RequisitosScreen } from "../screens/RequisitosScreen";
import { colors } from "../styles/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
