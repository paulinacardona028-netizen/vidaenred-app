import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError } from "../services/api";
import { TIPOS_SANGRE, TipoSangre } from "../types/models";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { iniciarSesion, registrarse } = useApp();
  const [modo, setModo] = useState<"ingresar" | "registro">("ingresar");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tipoSangre, setTipoSangre] = useState<TipoSangre>("O+");
  const [cargando, setCargando] = useState(false);

  const esRegistro = modo === "registro";

  async function handleIngresar() {
    if (!correo.trim() || !contrasena) {
      Alert.alert("Faltan datos", "Escribe tu correo y contraseña.");
      return;
    }
    if (esRegistro && (!nombre.trim() || !ciudad.trim())) {
      Alert.alert("Faltan datos", "Escribe tu nombre y tu ciudad.");
      return;
    }

    setCargando(true);
    try {
      if (esRegistro) {
        await registrarse({
          nombre: nombre.trim(),
          correo: correo.trim(),
          contrasena,
          tipoSangre,
          ciudad: ciudad.trim(),
        });
      } else {
        await iniciarSesion(correo.trim(), contrasena);
      }
      navigation.replace("MainTabs");
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se pudo iniciar sesión.";
      Alert.alert(esRegistro ? "No se pudo crear la cuenta" : "Error al ingresar", mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <Ionicons name="water" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>VidaEnRed</Text>

          {esRegistro && (
            <>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor={colors.textLight}
                value={nombre}
                onChangeText={setNombre}
              />

              <Text style={styles.label}>Ciudad</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu ciudad"
                placeholderTextColor={colors.textLight}
                value={ciudad}
                onChangeText={setCiudad}
              />

              <Text style={styles.label}>Tipo de sangre</Text>
              <View style={styles.chipsRow}>
                {TIPOS_SANGRE.map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={[styles.chip, tipoSangre === tipo && styles.chipActivo]}
                    onPress={() => setTipoSangre(tipo)}
                  >
                    <Text style={[styles.chipTexto, tipoSangre === tipo && styles.chipTextoActivo]}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="nombre@correo.com"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder={esRegistro ? "Mínimo 6 caracteres" : "********"}
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={contrasena}
            onChangeText={setContrasena}
          />

          <TouchableOpacity
            style={[styles.button, cargando && styles.buttonDeshabilitado]}
            onPress={handleIngresar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{esRegistro ? "Crear cuenta" : "Ingresar"}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModo(esRegistro ? "ingresar" : "registro")}>
            <Text style={styles.link}>
              {esRegistro ? "Ya tengo cuenta, ingresar" : "No tengo cuenta, registrarme"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 24,
  },
  label: {
    alignSelf: "flex-start",
    color: colors.textLight,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
    color: colors.text,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextoActivo: { color: colors.white },
  button: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDeshabilitado: { opacity: 0.6 },
  buttonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    color: "#3366CC",
    fontSize: 14,
  },
});
