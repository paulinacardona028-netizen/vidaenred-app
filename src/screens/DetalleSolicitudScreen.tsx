import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { useSolicitud } from "../hooks/useSolicitud";
import { ApiError } from "../services/api";
import { abrirEnGoogleMaps } from "../utils/mapas";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<HomeStackParamList, "DetalleSolicitud">;

export function DetalleSolicitudScreen({ route, navigation }: Props) {
  const { solicitudId } = route.params;
  const { confirmarDonacion, cerrarSolicitud } = useApp();
  const { solicitud, cargando, noEncontrada } = useSolicitud(solicitudId);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!solicitud || noEncontrada) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacio}>Esta solicitud ya no está disponible.</Text>
      </View>
    );
  }

  const esUrgente = solicitud.urgencia === "Alta" && solicitud.estado === "activa";
  const activa = solicitud.estado === "activa";

  function toggleDonante(id: string) {
    setSeleccionados((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handlePuedoDonar() {
    setEnviando(true);
    try {
      await confirmarDonacion(solicitud!.id);
      navigation.navigate("ConfirmacionDonacion", { solicitudId: solicitud!.id });
    } catch (err) {
      Alert.alert("No se pudo confirmar", err instanceof ApiError ? err.message : "Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function handleCerrar() {
    Alert.alert(
      "Cerrar solicitud",
      seleccionados.length === 0
        ? "Nadie quedará registrado como donante. ¿Cerrar la solicitud?"
        : `Se registrará la donación de ${seleccionados.length} persona(s) en su historial. ¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: async () => {
            setEnviando(true);
            try {
              await cerrarSolicitud(solicitud!.id, seleccionados);
              Alert.alert("Solicitud cerrada", "Gracias por usar VidaEnRed.");
              navigation.goBack();
            } catch (err) {
              Alert.alert("No se pudo cerrar", err instanceof ApiError ? err.message : "Inténtalo de nuevo.");
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.tipoRequerido}>Tipo requerido: {solicitud.tipoSangre}</Text>
      <Text style={styles.hospital}>
        {solicitud.hospital} · {solicitud.creadaHace}
      </Text>

      <View style={styles.fila}>
        {esUrgente && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Urgente</Text>
          </View>
        )}
        <View style={[styles.badge, !activa ? styles.badgeGris : styles.badgeVerde]}>
          <Text style={[styles.badgeText, !activa ? styles.textoGris : styles.textoVerde]}>
            {activa ? "Activa" : "Cerrada"}
          </Text>
        </View>
      </View>

      <Text style={styles.confirmados}>
        {solicitud.donantesConfirmados.length} donantes ya confirmaron
      </Text>

      {/* Vista del solicitante: elegir quién donó y cerrar */}
      {solicitud.esMia && (
        <View style={styles.seccion}>
          <Text style={styles.subtitulo}>Donantes que confirmaron</Text>
          {solicitud.donantesConfirmados.length === 0 && (
            <Text style={styles.textoSuave}>Aún nadie ha confirmado. Puedes cerrar la solicitud cuando quieras.</Text>
          )}
          {solicitud.donantesConfirmados.map((nombre, i) => {
            const id = solicitud.donantesIds[i];
            const marcado = seleccionados.includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={styles.filaDonante}
                disabled={!activa}
                onPress={() => toggleDonante(id)}
              >
                <Ionicons
                  name={marcado ? "checkbox" : "square-outline"}
                  size={22}
                  color={marcado ? colors.primary : colors.textLight}
                />
                <Text style={styles.nombreDonante}>{nombre}</Text>
              </TouchableOpacity>
            );
          })}
          {activa && (
            <TouchableOpacity style={styles.botonPrimario} onPress={handleCerrar} disabled={enviando}>
              <Text style={styles.botonPrimarioTexto}>Cerrar solicitud</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Vista del donante: confirmar que puede donar */}
      {!solicitud.esMia && activa && (
        <TouchableOpacity
          style={[styles.botonPrimario, (solicitud.yaConfirmo || enviando) && styles.botonDeshabilitado]}
          onPress={handlePuedoDonar}
          disabled={solicitud.yaConfirmo || enviando}
        >
          <Text style={styles.botonPrimarioTexto}>{solicitud.yaConfirmo ? "Ya confirmaste" : "Puedo donar"}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => abrirEnGoogleMaps(solicitud.hospital, solicitud.latitud, solicitud.longitud)}
      >
        <Ionicons name="navigate-outline" size={18} color={colors.text} />
        <Text style={styles.botonSecundarioTexto}>Cómo llegar en Google Maps</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 40 },
  centrado: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 20 },
  tipoRequerido: { fontSize: 18, fontWeight: "bold", color: colors.text },
  hospital: { fontSize: 14, color: colors.textLight, marginTop: 4 },
  fila: { flexDirection: "row", gap: 8, marginTop: 12 },
  badge: { backgroundColor: colors.urgent, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeVerde: { backgroundColor: "#E3F4EA" },
  badgeGris: { backgroundColor: colors.surface },
  badgeText: { color: colors.urgentText, fontWeight: "600", fontSize: 12 },
  textoVerde: { color: colors.success },
  textoGris: { color: colors.textLight },
  confirmados: { marginTop: 16, color: colors.text, fontSize: 14 },
  seccion: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  subtitulo: { fontSize: 15, fontWeight: "bold", color: colors.text, marginBottom: 8 },
  textoSuave: { color: colors.textLight, fontSize: 13, marginBottom: 8 },
  filaDonante: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  nombreDonante: { fontSize: 15, color: colors.text },
  botonPrimario: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  botonDeshabilitado: { backgroundColor: colors.textLight },
  botonPrimarioTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 12,
  },
  botonSecundarioTexto: { color: colors.text, fontWeight: "600", fontSize: 15 },
  vacio: { textAlign: "center", color: colors.textLight },
});
