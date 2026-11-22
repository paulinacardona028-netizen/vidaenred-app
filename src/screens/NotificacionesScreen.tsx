import React, { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { Notificacion } from "../types/models";
import { colors } from "../styles/colors";

export function NotificacionesScreen() {
  const { refrescarNoLeidas } = useApp();
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      api
        .notificaciones()
        .then(async (datos) => {
          if (!activo) return;
          setLista(datos);
          // Al verlas, quedan como leídas
          await api.marcarNotificacionesLeidas();
          await refrescarNoLeidas();
        })
        .catch(() => activo && setError(true));
      return () => {
        activo = false;
      };
    }, [refrescarNoLeidas])
  );

  return (
    <FlatList
      style={styles.container}
      data={lista}
      keyExtractor={(n) => n.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      renderItem={({ item }) => (
        <View style={[styles.card, !item.leida && styles.noLeida]}>
          <Text style={styles.mensaje}>{item.mensaje}</Text>
          <Text style={styles.fecha}>{new Date(item.creadaEn).toLocaleString("es-CO")}</Text>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.vacio}>
          {error ? "No se pudieron cargar las notificaciones." : "No tienes notificaciones."}
        </Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  noLeida: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  mensaje: { fontSize: 14, color: colors.text, lineHeight: 20 },
  fecha: { fontSize: 12, color: colors.textLight, marginTop: 6 },
  vacio: { textAlign: "center", color: colors.textLight, marginTop: 40 },
});
