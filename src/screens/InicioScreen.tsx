import React, { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { HomeStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { SolicitudSangre } from "../types/models";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<HomeStackParamList, "Inicio">;

export function InicioScreen({ navigation }: Props) {
  const { solicitudesCompatibles, donante, refrescarSolicitudes } = useApp();

  // Recarga las solicitudes cada vez que el usuario vuelve a esta pantalla
  useFocusEffect(
    useCallback(() => {
      refrescarSolicitudes().catch(() => {});
    }, [refrescarSolicitudes])
  );

  function renderItem({ item }: { item: SolicitudSangre }) {
    const esUrgente = item.urgencia === "Alta";
    return (
      <TouchableOpacity
        style={[styles.card, esUrgente && styles.cardUrgente]}
        onPress={() =>
          navigation.navigate("DetalleSolicitud", { solicitudId: item.id })
        }
      >
        <View style={styles.cardHeader}>
          <Text
            style={[styles.tipoSangre, esUrgente && styles.tipoSangreUrgente]}
          >
            {item.tipoSangre} {item.urgencia.toLowerCase()}
          </Text>
          {item.donantesConfirmados.length > 0 && (
            <Text style={styles.confirmados}>
              {item.donantesConfirmados.length} confirmados
            </Text>
          )}
        </View>
        <Text style={styles.hospital}>
          {item.hospital}{item.distanciaKm !== null ? ` · ${item.distanciaKm} km` : ""}
        </Text>
        <Text style={styles.tiempo}>{item.creadaHace}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Solicitudes cerca</Text>
          <Text style={styles.headerSubtitle}>
            Compatibles con tu tipo {donante?.tipoSangre ?? ""}
          </Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color={colors.text} />
      </View>

      <FlatList
        data={solicitudesCompatibles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            No hay solicitudes compatibles con tu tipo de sangre por ahora.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  cardUrgente: {
    backgroundColor: colors.urgent,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tipoSangre: { fontSize: 16, fontWeight: "bold", color: colors.text },
  tipoSangreUrgente: { color: colors.urgentText },
  confirmados: { fontSize: 12, color: colors.success, fontWeight: "600" },
  hospital: { fontSize: 14, color: colors.text, marginTop: 4 },
  tiempo: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  vacio: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: 40,
    paddingHorizontal: 24,
  },
});
