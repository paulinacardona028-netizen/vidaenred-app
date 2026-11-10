import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { DonacionHistorial } from "../types/models";
import { colors } from "../styles/colors";

export function HistorialScreen() {
  const { donante } = useApp();
  const [donaciones, setDonaciones] = useState<DonacionHistorial[]>([]);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .historial()
        .then((lista) => {
          setDonaciones(lista);
          setError(false);
        })
        .catch(() => setError(true));
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.resumen}>
        <Text style={styles.numero}>{donante?.donacionesRealizadas ?? 0}</Text>
        <Text style={styles.resumenTexto}>donaciones realizadas</Text>
      </View>

      <FlatList
        data={donaciones}
        keyExtractor={(d) => d.solicitudId + d.completadaEn}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.fila}>
              <Text style={styles.hospital}>{item.hospital}</Text>
              <Text style={styles.fecha}>{new Date(item.completadaEn).toLocaleDateString("es-CO")}</Text>
            </View>
            <Text style={styles.detalle}>
              Tipo {item.tipoSangre} · Urgencia {item.urgencia}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {error
              ? "No se pudo cargar el historial."
              : "Aún no tienes donaciones registradas. Cuando el solicitante cierre una solicitud en la que donaste, aparecerá aquí."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  resumen: { alignItems: "center", paddingVertical: 24, backgroundColor: colors.surface },
  numero: { fontSize: 40, fontWeight: "bold", color: colors.primary },
  resumenTexto: { fontSize: 14, color: colors.textLight, marginTop: 2 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hospital: { fontSize: 15, fontWeight: "bold", color: colors.text, flex: 1 },
  fecha: { fontSize: 12, color: colors.textLight },
  detalle: { fontSize: 13, color: colors.textLight, marginTop: 4 },
  vacio: { textAlign: "center", color: colors.textLight, marginTop: 24, paddingHorizontal: 24 },
});
