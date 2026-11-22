import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainTabParamList, RootStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError, api } from "../services/api";
import { Entidad, NivelUrgencia, TIPOS_SANGRE, TipoSangre } from "../types/models";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CrearSolicitud">,
  NativeStackScreenProps<RootStackParamList>
>;

const NIVELES_URGENCIA: NivelUrgencia[] = ["Alta", "Moderada", "Programada"];

export function CrearSolicitudScreen({ navigation }: Props) {
  const { donante, crearSolicitud } = useApp();
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [entidadId, setEntidadId] = useState<string | null>(null);
  const [tipoSangre, setTipoSangre] = useState<TipoSangre>(donante?.tipoSangre ?? "O+");
  const [urgencia, setUrgencia] = useState<NivelUrgencia>("Alta");
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [publicando, setPublicando] = useState(false);

  // Solo se ofrecen entidades aliadas de la ciudad del solicitante
  useEffect(() => {
    if (!donante?.ciudad) return;
    api
      .listarEntidades({ ciudad: donante.ciudad })
      .then(setEntidades)
      .catch(() => setEntidades([]));
  }, [donante?.ciudad]);

  if (donante && !donante.esSolicitante) {
    return (
      <View style={styles.bloqueado}>
        <Text style={styles.bloqueadoTexto}>
          Para publicar solicitudes activa el rol "Necesito sangre" en tu perfil.
        </Text>
        <TouchableOpacity style={styles.boton} onPress={() => navigation.navigate("Perfil")}>
          <Text style={styles.botonTexto}>Ir a mi perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handlePublicar() {
    if (!entidadId) {
      Alert.alert("Falta información", "Selecciona el hospital o banco de sangre.");
      return;
    }
    setPublicando(true);
    try {
      await crearSolicitud({
        tipoSangre,
        urgencia,
        entidadId,
        pacienteNombre: pacienteNombre.trim() || undefined,
        contactoTelefono: contactoTelefono.trim() || undefined,
      });
      Alert.alert("Solicitud publicada", "Avisamos a los donantes compatibles cercanos.");
      setEntidadId(null);
      setPacienteNombre("");
      setContactoTelefono("");
      setUrgencia("Alta");
      navigation.navigate("InicioTab");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "No se pudo publicar la solicitud.");
    } finally {
      setPublicando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Hospital o banco de sangre en {donante?.ciudad}</Text>
      <View style={styles.fila}>
        {entidades.map((e) => (
          <TouchableOpacity
            key={e.id}
            style={[styles.chip, entidadId === e.id && styles.chipActivo]}
            onPress={() => setEntidadId(e.id)}
          >
            <Text style={[styles.chipTexto, entidadId === e.id && styles.chipTextoActivo]}>{e.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {entidades.length === 0 && (
        <Text style={styles.ayuda}>Todavía no hay entidades aliadas en {donante?.ciudad}.</Text>
      )}

      <Text style={styles.label}>Tipo de sangre requerido</Text>
      <View style={styles.fila}>
        {TIPOS_SANGRE.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, tipoSangre === t && styles.chipActivo]}
            onPress={() => setTipoSangre(t)}
          >
            <Text style={[styles.chipTexto, tipoSangre === t && styles.chipTextoActivo]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Urgencia</Text>
      <View style={styles.fila}>
        {NIVELES_URGENCIA.map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.chip, urgencia === n && styles.chipActivo]}
            onPress={() => setUrgencia(n)}
          >
            <Text style={[styles.chipTexto, urgencia === n && styles.chipTextoActivo]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nombre del paciente (opcional)</Text>
      <TextInput
        style={styles.input}
        value={pacienteNombre}
        onChangeText={setPacienteNombre}
        placeholder="Ej. Ana Gómez"
        placeholderTextColor={colors.textLight}
      />

      <Text style={styles.label}>Teléfono de contacto (opcional)</Text>
      <TextInput
        style={styles.input}
        value={contactoTelefono}
        onChangeText={setContactoTelefono}
        placeholder="300 000 0000"
        placeholderTextColor={colors.textLight}
        keyboardType="phone-pad"
      />
      <Text style={styles.ayuda}>Tu teléfono no se muestra a los donantes en la lista.</Text>

      <TouchableOpacity
        style={[styles.boton, publicando && styles.botonDeshabilitado]}
        onPress={handlePublicar}
        disabled={publicando}
      >
        <Text style={styles.botonTexto}>{publicando ? "Publicando..." : "Publicar solicitud"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 40 },
  bloqueado: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background },
  bloqueadoTexto: { textAlign: "center", color: colors.text, fontSize: 15, marginBottom: 16 },
  label: { fontSize: 13, color: colors.textLight, marginTop: 16, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colors.textLight, marginTop: 6 },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13 },
  chipTextoActivo: { color: colors.white, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  boton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
});
