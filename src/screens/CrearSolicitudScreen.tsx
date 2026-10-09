import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useApp } from "../context/AppContext";
import { NivelUrgencia, TIPOS_SANGRE, TipoSangre } from "../types/models";
import { colors } from "../styles/colors";
import { ApiError } from "../services/api";

const NIVELES_URGENCIA: NivelUrgencia[] = ["Alta", "Moderada", "Programada"];

export function CrearSolicitudScreen() {
  const { crearSolicitud } = useApp();
  const [tipoSangre, setTipoSangre] = useState<TipoSangre>("O+");
  const [hospital, setHospital] = useState("");
  const [urgencia, setUrgencia] = useState<NivelUrgencia>("Alta");
  const [publicando, setPublicando] = useState(false);

  async function handlePublicar() {
    // Validacion de campos obligatorios (regla de negocio del proyecto)
    if (!hospital.trim()) {
      Alert.alert("Falta información", "Escribe el nombre del hospital.");
      return;
    }

    setPublicando(true);
    try {
      await crearSolicitud({ tipoSangre, hospital: hospital.trim(), urgencia });
      Alert.alert("Solicitud publicada", "Se notificará a donantes compatibles cercanos.");
      setHospital("");
      setUrgencia("Alta");
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se pudo publicar la solicitud.";
      Alert.alert("Error", mensaje);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Nueva solicitud</Text>

      <Text style={styles.label}>Tipo de sangre</Text>
      <View style={styles.chipsRow}>
        {TIPOS_SANGRE.map((tipo) => (
          <TouchableOpacity
            key={tipo}
            style={[styles.chip, tipoSangre === tipo && styles.chipActivo]}
            onPress={() => setTipoSangre(tipo)}
          >
            <Text
              style={[
                styles.chipTexto,
                tipoSangre === tipo && styles.chipTextoActivo,
              ]}
            >
              {tipo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Hospital</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del hospital"
        placeholderTextColor={colors.textLight}
        value={hospital}
        onChangeText={setHospital}
      />

      <Text style={styles.label}>Urgencia</Text>
      <View style={styles.chipsRow}>
        {NIVELES_URGENCIA.map((nivel) => (
          <TouchableOpacity
            key={nivel}
            style={[styles.chip, urgencia === nivel && styles.chipActivo]}
            onPress={() => setUrgencia(nivel)}
          >
            <Text
              style={[
                styles.chipTexto,
                urgencia === nivel && styles.chipTextoActivo,
              ]}
            >
              {nivel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.boton, publicando && { opacity: 0.6 }]}
        onPress={handlePublicar}
        disabled={publicando}
      >
        <Text style={styles.botonTexto}>
          {publicando ? "Publicando..." : "Publicar solicitud"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, color: colors.textLight, marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 15,
    color: colors.text,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextoActivo: { color: colors.white },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  botonTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
});
