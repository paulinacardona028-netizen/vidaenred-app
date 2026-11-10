import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { api, ApiError } from "../services/api";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RecuperarContrasena">;

export function RecuperarContrasenaScreen({ navigation }: Props) {
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleEnviarCodigo() {
    if (!correo.trim()) {
      Alert.alert("Falta el correo", "Escribe el correo de tu cuenta.");
      return;
    }
    setCargando(true);
    try {
      const { mensaje } = await api.recuperarContrasena(correo.trim());
      Alert.alert("Revisa tu correo", mensaje);
      setPaso("codigo");
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "No se pudo enviar el código.");
    } finally {
      setCargando(false);
    }
  }

  async function handleRestablecer() {
    if (!codigo.trim() || contrasena.length < 6) {
      Alert.alert("Revisa los datos", "Escribe el código y una contraseña de al menos 6 caracteres.");
      return;
    }
    setCargando(true);
    try {
      const { mensaje } = await api.restablecerContrasena(correo.trim(), codigo.trim(), contrasena);
      Alert.alert("Listo", mensaje, [{ text: "Ingresar", onPress: () => navigation.replace("Login") }]);
    } catch (err) {
      Alert.alert("No se pudo restablecer", err instanceof ApiError ? err.message : "Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {paso === "correo" ? (
        <>
          <Text style={styles.titulo}>Recuperar contraseña</Text>
          <Text style={styles.texto}>Escribe el correo de tu cuenta y te enviaremos un código.</Text>
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            value={correo}
            onChangeText={setCorreo}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="nombre@correo.com"
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity style={styles.boton} onPress={handleEnviarCodigo} disabled={cargando}>
            <Text style={styles.botonTexto}>Enviar código</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.titulo}>Escribe el código</Text>
          <Text style={styles.texto}>Ingresa el código de 6 dígitos y tu nueva contraseña. Vence en 30 minutos.</Text>
          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput
            style={styles.input}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textLight}
          />
          <TouchableOpacity style={styles.boton} onPress={handleRestablecer} disabled={cargando}>
            <Text style={styles.botonTexto}>Cambiar contraseña</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPaso("correo")}>
            <Text style={styles.link}>Reenviar código</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: "center" },
  titulo: { fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 8 },
  texto: { fontSize: 14, color: colors.textLight, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 13, color: colors.textLight, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
    color: colors.text,
  },
  boton: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  botonTexto: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  link: { color: "#3366CC", fontSize: 14, textAlign: "center", marginTop: 16 },
});
