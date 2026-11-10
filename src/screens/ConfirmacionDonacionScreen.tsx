import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { useSolicitud } from "../hooks/useSolicitud";
import { abrirEnGoogleMaps } from "../utils/mapas";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<HomeStackParamList, "ConfirmacionDonacion">;

export function ConfirmacionDonacionScreen({ route, navigation }: Props) {
  const { solicitud, cargando } = useSolicitud(route.params.solicitudId);

  if (cargando) {
    return (
      <View style={styles.contenedor}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.check}>
        <Ionicons name="checkmark" size={36} color={colors.success} />
      </View>
      <Text style={styles.titulo}>¡Gracias por tu disposición!</Text>
      <Text style={styles.texto}>
        Se avisó al solicitante. Te contactarán pronto para coordinar la donación.
      </Text>

      {solicitud && (
        <View style={styles.card}>
          <Text style={styles.hospital}>{solicitud.hospital}</Text>
          <Text style={styles.detalle}>
            Tipo {solicitud.tipoSangre} · Urgencia {solicitud.urgencia}
          </Text>
          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => abrirEnGoogleMaps(solicitud.hospital, solicitud.latitud, solicitud.longitud)}
          >
            <Ionicons name="navigate-outline" size={18} color={colors.text} />
            <Text style={styles.botonSecundarioTexto}>Ver la ruta</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.botonPrimario} onPress={() => navigation.navigate("Inicio")}>
        <Text style={styles.botonPrimarioTexto}>Volver al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colors.background, padding: 24, alignItems: "center", justifyContent: "center" },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E3F4EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  titulo: { fontSize: 20, fontWeight: "bold", color: colors.text, textAlign: "center" },
  texto: { fontSize: 14, color: colors.textLight, textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  hospital: { fontSize: 16, fontWeight: "bold", color: colors.text },
  detalle: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  botonSecundarioTexto: { color: colors.text, fontWeight: "600" },
  botonPrimario: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  botonPrimarioTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
});
