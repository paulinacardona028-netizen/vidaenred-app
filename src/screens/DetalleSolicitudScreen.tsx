import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<HomeStackParamList, "DetalleSolicitud">;

export function DetalleSolicitudScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { obtenerSolicitudPorId, confirmarDonacion, donante } = useApp();
  const solicitud = obtenerSolicitudPorId(solicitudId);

  if (solicitud === undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.vacio}>Esta solicitud ya no está disponible.</Text>
      </View>
    );
  }

  const solicitudActual = solicitud;
  const yaConfirmo = solicitudActual.donantesConfirmados.includes(donante.nombre);
  const esUrgente = solicitudActual.urgencia === "Alta";

  function handlePuedoDonar() {
    confirmarDonacion(solicitudActual.id);
    Alert.alert(
      "¡Gracias!",
      "Se notificó al solicitante que puedes donar. Te contactarán pronto."
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.tipoRequerido}>
        Tipo requerido: {solicitudActual.tipoSangre}
      </Text>
      <Text style={styles.hospital}>
        {solicitudActual.hospital} · {solicitudActual.creadaHace}
      </Text>

      {esUrgente && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Urgente</Text>
        </View>
      )}

      <Text style={styles.confirmados}>
        {solicitudActual.donantesConfirmados.length} donantes ya confirmaron
      </Text>

      <TouchableOpacity
        style={[styles.botonPrimario, yaConfirmo && styles.botonDeshabilitado]}
        onPress={handlePuedoDonar}
        disabled={yaConfirmo}
      >
        <Text style={styles.botonPrimarioTexto}>
          {yaConfirmo ? "Ya confirmaste" : "Puedo donar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() =>
          Alert.alert(
            "Ubicación",
            `${solicitudActual.hospital}, ${solicitudActual.ciudad} (${solicitudActual.distanciaKm} km)`
          )
        }
      >
        <Text style={styles.botonSecundarioTexto}>Ver ubicación</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  tipoRequerido: { fontSize: 18, fontWeight: "bold", color: colors.text },
  hospital: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  badge: {
    backgroundColor: colors.urgent,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 12,
  },
  badgeText: { color: colors.urgentText, fontWeight: "600", fontSize: 12 },
  confirmados: { marginTop: 20, color: colors.text, fontSize: 14 },
  botonPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  botonDeshabilitado: { backgroundColor: colors.textLight },
  botonPrimarioTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  botonSecundario: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  botonSecundarioTexto: { color: colors.text, fontWeight: "600", fontSize: 15 },
  vacio: { textAlign: "center", color: colors.textLight, marginTop: 40 },
});
