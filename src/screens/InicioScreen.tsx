import React, { useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { HomeStackParamList, MainTabParamList, RootStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { SolicitudSangre } from "../types/models";
import { CarruselEntidades } from "../components/CarruselEntidades";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, "Inicio">,
  CompositeScreenProps<BottomTabScreenProps<MainTabParamList>, NativeStackScreenProps<RootStackParamList>>
>;

export function InicioScreen({ navigation }: Props) {
  const {
    donante,
    modo,
    cambiarModo,
    solicitudesCompatibles,
    misSolicitudes,
    refrescarSolicitudes,
    refrescarMisSolicitudes,
    refrescarNoLeidas,
    noLeidas,
  } = useApp();

  const tieneAmbosRoles = Boolean(donante?.esDonante && donante?.esSolicitante);

  useFocusEffect(
    useCallback(() => {
      refrescarNoLeidas().catch(() => {});
      if (modo === "donar") refrescarSolicitudes().catch(() => {});
      else refrescarMisSolicitudes().catch(() => {});
    }, [modo, refrescarSolicitudes, refrescarMisSolicitudes, refrescarNoLeidas])
  );

  const cabecera = (
    <View>
      {tieneAmbosRoles && (
        <View style={styles.selector}>
          {(["donar", "solicitar"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.opcion, modo === m && styles.opcionActiva]}
              onPress={() => cambiarModo(m)}
            >
              <Text style={[styles.opcionTexto, modo === m && styles.opcionTextoActiva]}>
                {m === "donar" ? "Donar" : "Solicitar"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Las entidades aliadas de la ciudad se muestran en ambos modos */}
      <CarruselEntidades />
      {modo === "solicitar" && (
        <TouchableOpacity
          style={styles.botonNueva}
          onPress={() => navigation.navigate("CrearSolicitud")}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.botonNuevaTexto}>Nueva solicitud</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const datos: SolicitudSangre[] = modo === "donar" ? solicitudesCompatibles : misSolicitudes;

  function renderItem({ item }: { item: SolicitudSangre }) {
    const esUrgente = item.urgencia === "Alta" && item.estado === "activa";
    return (
      <TouchableOpacity
        style={[styles.card, esUrgente && styles.cardUrgente]}
        onPress={() => navigation.navigate("DetalleSolicitud", { solicitudId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.tipoSangre, esUrgente && styles.tipoSangreUrgente]}>
            {item.tipoSangre} {item.urgencia.toLowerCase()}
          </Text>
          {modo === "solicitar" ? (
            <Text style={item.estado === "activa" ? styles.estadoActiva : styles.estadoResuelta}>
              {item.estado === "activa" ? "Activa" : "Resuelta"}
            </Text>
          ) : (
            item.donantesConfirmados.length > 0 && (
              <Text style={styles.confirmados}>{item.donantesConfirmados.length} confirmados</Text>
            )
          )}
        </View>
        <Text style={styles.hospital}>
          {item.hospital}
          {item.distanciaKm !== null ? ` · ${item.distanciaKm} km` : ""}
        </Text>
        <Text style={styles.tiempo}>{item.creadaHace}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>
            {modo === "donar" ? "Solicitudes cerca" : "Mis solicitudes"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {modo === "donar"
              ? `Compatibles con tu tipo ${donante?.tipoSangre ?? "—"}`
              : "Lo que has publicado para ti o un familiar"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Notificaciones")} style={styles.campana}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {noLeidas > 0 && (
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>{noLeidas > 9 ? "9+" : noLeidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={datos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={cabecera}
        contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            {modo === "donar"
              ? "No hay solicitudes compatibles con tu tipo de sangre por ahora."
              : "Aún no has publicado solicitudes."}
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
  campana: { padding: 4 },
  contador: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  contadorTexto: { color: colors.white, fontSize: 10, fontWeight: "bold" },
  selector: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  opcion: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  opcionActiva: { backgroundColor: colors.background },
  opcionTexto: { color: colors.textLight, fontWeight: "600" },
  opcionTextoActiva: { color: colors.text },
  botonNueva: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  botonNuevaTexto: { color: colors.white, fontWeight: "600", fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  cardUrgente: { backgroundColor: colors.urgent },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tipoSangre: { fontSize: 16, fontWeight: "bold", color: colors.text },
  tipoSangreUrgente: { color: colors.urgentText },
  confirmados: { fontSize: 12, color: colors.success, fontWeight: "600" },
  estadoActiva: { fontSize: 12, color: colors.success, fontWeight: "600" },
  estadoResuelta: { fontSize: 12, color: colors.textLight, fontWeight: "600" },
  hospital: { fontSize: 14, color: colors.text, marginTop: 4 },
  tiempo: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  vacio: { textAlign: "center", color: colors.textLight, marginTop: 24, paddingHorizontal: 24 },
});
