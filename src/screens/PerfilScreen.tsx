import React, { useState } from "react";
import { View, Text, Switch, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootStackParamList, MainTabParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError } from "../services/api";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Perfil">,
  NativeStackScreenProps<RootStackParamList>
>;

export function PerfilScreen({ navigation }: Props) {
  const { donante, cambiarDisponibilidad, cambiarRoles, cerrarSesion } = useApp();
  const [guardando, setGuardando] = useState(false);

  if (donante === null) return null;

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);
    try {
      await accion();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "No se pudo guardar el cambio.");
    } finally {
      setGuardando(false);
    }
  }

  function handleRolDonante(activar: boolean) {
    // Para activarlo hay que pasar por el formulario de requisitos
    if (activar) {
      navigation.navigate("Requisitos");
      return;
    }
    Alert.alert(
      "Dejar de donar",
      "Ya no verás solicitudes compatibles. Podrás volver a activarlo completando el formulario de requisitos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => ejecutar(() => cambiarRoles({ esDonante: false })),
        },
      ]
    );
  }

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
      <Text style={styles.tipoSangre}>
        {donante.tipoSangre ? `Tipo ${donante.tipoSangre}` : "Sin tipo de sangre registrado"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.tituloCard}>Mis roles</Text>

        <View style={styles.filaInfo}>
          <View style={styles.textoFila}>
            <Text style={styles.filaValor}>Puedo donar</Text>
            <Text style={styles.filaLabel}>
              {donante.esDonante ? "Activo" : "Completa el formulario de requisitos"}
            </Text>
          </View>
          <Switch
            value={donante.esDonante}
            onValueChange={handleRolDonante}
            disabled={guardando}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <View style={styles.filaInfo}>
          <View style={styles.textoFila}>
            <Text style={styles.filaValor}>Necesito sangre</Text>
            <Text style={styles.filaLabel}>Publica solicitudes para ti o un familiar</Text>
          </View>
          <Switch
            value={donante.esSolicitante}
            onValueChange={(v) => ejecutar(() => cambiarRoles({ esSolicitante: v }))}
            disabled={guardando}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.filaInfo}>
          <Text style={styles.filaLabel}>Ciudad</Text>
          <Text style={styles.filaValor}>{donante.ciudad}</Text>
        </View>
        <View style={styles.filaInfo}>
          <Text style={styles.filaLabel}>Donaciones</Text>
          <Text style={styles.filaValor}>{donante.donacionesRealizadas}</Text>
        </View>
        {donante.esDonante && (
          <View style={styles.filaInfo}>
            <Text style={styles.filaLabel}>Disponible para donar</Text>
            <Switch
              value={donante.disponible}
              onValueChange={(v) => ejecutar(() => cambiarDisponibilidad(v))}
              disabled={guardando}
              trackColor={{ true: colors.primary }}
            />
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.botonHistorial} onPress={() => navigation.navigate("Historial")}>
        <Text style={styles.botonHistorialTexto}>Mi historial de donaciones</Text>
      </TouchableOpacity>

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
    marginBottom: 12,
  },
  tituloCard: { fontSize: 14, fontWeight: "bold", color: colors.text, marginBottom: 4 },
  filaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  textoFila: { flex: 1 },
  filaLabel: { color: colors.textLight, fontSize: 13 },
  filaValor: { color: colors.text, fontSize: 14, fontWeight: "600" },
  botonHistorial: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  botonHistorialTexto: { color: colors.text, fontWeight: "600" },
  botonSalir: { marginTop: 12 },
  botonSalirTexto: { color: colors.urgentText, fontWeight: "600" },
});
