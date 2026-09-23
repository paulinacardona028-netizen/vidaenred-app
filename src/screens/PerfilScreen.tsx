import React from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootStackParamList, MainTabParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Perfil">,
  NativeStackScreenProps<RootStackParamList>
>;

export function PerfilScreen({ navigation }: Props) {
  const { donante, cambiarDisponibilidad, cerrarSesion } = useApp();

  function handleCerrarSesion() {
    cerrarSesion();
    navigation.getParent()?.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  }

  const iniciales = donante.nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarTexto}>{iniciales}</Text>
      </View>
      <Text style={styles.nombre}>{donante.nombre}</Text>
      <Text style={styles.tipoSangre}>Tipo {donante.tipoSangre}</Text>

      <View style={styles.card}>
        <View style={styles.filaInfo}>
          <Text style={styles.filaLabel}>Ciudad</Text>
          <Text style={styles.filaValor}>{donante.ciudad}</Text>
        </View>
        <View style={styles.filaInfo}>
          <Text style={styles.filaLabel}>Donaciones</Text>
          <Text style={styles.filaValor}>{donante.donacionesRealizadas}</Text>
        </View>
        <View style={styles.filaInfo}>
          <Text style={styles.filaLabel}>Disponible para donar</Text>
          <Switch
            value={donante.disponible}
            onValueChange={cambiarDisponibilidad}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.botonSalir} onPress={handleCerrarSesion}>
        <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: "center", padding: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#CFE0F5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  avatarTexto: { fontSize: 20, fontWeight: "bold", color: "#3366CC" },
  nombre: { fontSize: 18, fontWeight: "bold", color: colors.text, marginTop: 12 },
  tipoSangre: { fontSize: 14, color: colors.textLight, marginBottom: 20 },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
  filaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  filaLabel: { color: colors.textLight, fontSize: 14 },
  filaValor: { color: colors.text, fontSize: 14, fontWeight: "600" },
  botonSalir: { marginTop: 24 },
  botonSalirTexto: { color: colors.urgentText, fontWeight: "600" },
});
