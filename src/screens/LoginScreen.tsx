
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
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError } from "../services/api";
import { colors } from "../styles/colors";
import { SelectorCiudad } from "../components/SelectorCiudad";
import { SelectorFecha } from "../components/SelectorFecha";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { iniciarSesion, registrarse } = useApp();

  const [modo, setModo] = useState<
    "bienvenida" | "ingresar" | "registro"
  >("bienvenida");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const esRegistro = modo === "registro";

  async function handleIngresar() {
    if (!correo.trim() || !contrasena) {
      Alert.alert("Faltan datos", "Escribe tu correo y contraseña.");
      return;
    }

    if (esRegistro && (!nombre.trim() || !ciudad || !fechaNacimiento)) {
      Alert.alert(
        "Faltan datos",
        "Escribe tu nombre, elige tu ciudad y tu fecha de nacimiento."
      );
      return;
    }

    setCargando(true);

    try {
      if (esRegistro) {
        await registrarse({
          nombre: nombre.trim(),
          correo: correo.trim(),
          contrasena,
          ciudad,
          fechaNacimiento,
        });
      } else {
        await iniciarSesion(correo.trim(), contrasena);
      }

      navigation.replace("MainTabs");
    } catch (err) {
      const mensaje =
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar sesión.";

      Alert.alert(
        esRegistro ? "No se pudo crear la cuenta" : "Error al ingresar",
        mensaje
      );
    } finally {
      setCargando(false);
    }
  }

  if (modo === "bienvenida") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <ScrollView contentContainerStyle={styles.welcomeScroll}>
          <View style={styles.brand}>
            <Ionicons name="water" size={30} color={colors.primary} />
            <Text style={styles.brandText}>VidaEnRed</Text>
          </View>

          <View style={styles.hero}>
            <View style={styles.heroRing}>
              <View style={styles.heroCircle}>
                <Ionicons
                  name="water"
                  size={105}
                  color={colors.primary}
                />
              </View>
            </View>

            <View style={[styles.floatingIcon, styles.heartIcon]}>
              <Ionicons
                name="heart-outline"
                size={27}
                color={colors.primary}
              />
            </View>

            <View style={[styles.floatingIcon, styles.peopleIcon]}>
              <Ionicons
                name="people-outline"
                size={27}
                color={colors.primary}
              />
            </View>

            <View style={[styles.floatingIcon, styles.medicalIcon]}>
              <Ionicons
                name="medical-outline"
                size={24}
                color={colors.primary}
              />
            </View>
          </View>

          <Text style={styles.eyebrow}>
            JUNTOS HACEMOS LA DIFERENCIA
          </Text>

          <Text style={styles.welcomeTitle}>
            Una conexión puede cambiarlo todo.
          </Text>

          <Text style={styles.description}>
            Conectamos personas que necesitan sangre con quienes
            pueden salvar vidas.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setModo("ingresar")}
            >
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => setModo("registro")}
            >
              <Text style={styles.outlineText}>Crear cuenta</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Ionicons
                name="heart-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.footerText}>
                Cada donación cuenta.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.formScroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setModo("bienvenida")}
            disabled={cargando}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.formBrand}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="water"
                size={38}
                color={colors.primary}
              />
            </View>

            <Text style={styles.brandText}>VidaEnRed</Text>
          </View>

          <Text style={styles.formTitle}>
            {esRegistro
              ? "Únete a VidaEnRed"
              : "Qué bueno verte de nuevo"}
          </Text>

          <Text style={styles.formDescription}>
            {esRegistro
              ? "Una pequeña acción puede salvar una vida."
              : "Inicia sesión para continuar salvando vidas."}
          </Text>

          {esRegistro && (
            <>
              <Text style={styles.label}>Nombre completo</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.textLight}
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              <SelectorCiudad
                valor={ciudad}
                onChange={setCiudad}
              />

              <SelectorFecha
                valor={fechaNacimiento}
                onChange={setFechaNacimiento}
              />
            </>
          )}

          <Text style={styles.label}>Correo electrónico</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="nombre@correo.com"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={correo}
              onChangeText={setCorreo}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder={
                esRegistro ? "Mínimo 6 caracteres" : "Tu contraseña"
              }
              placeholderTextColor={colors.textLight}
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
              value={contrasena}
              onChangeText={setContrasena}
            />

            <TouchableOpacity
              onPress={() => setMostrarContrasena(!mostrarContrasena)}
              accessibilityLabel={
                mostrarContrasena
                  ? "Ocultar contraseña"
                  : "Mostrar contraseña"
              }
            >
              <Ionicons
                name={mostrarContrasena ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {!esRegistro && (
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() =>
                navigation.navigate("RecuperarContrasena")
              }
            >
              <Text style={styles.link}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              cargando && styles.buttonDeshabilitado,
            ]}
            onPress={handleIngresar}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>
                {esRegistro ? "Crear cuenta" : "Iniciar sesión"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.footerText}>
              {esRegistro
                ? "¿Ya tienes una cuenta?"
                : "¿No tienes cuenta?"}
            </Text>

            <TouchableOpacity
              disabled={cargando}
              onPress={() =>
                setModo(esRegistro ? "ingresar" : "registro")
              }
            >
              <Text style={styles.link}>
                {esRegistro ? "Inicia sesión" : "Crear cuenta"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  welcomeScroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 24,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },

  brandText: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.8,
  },

  hero: {
    height: 260,
    backgroundColor: colors.urgent,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    overflow: "hidden",
  },

  heroRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#FAD5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  heroCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  floatingIcon: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#B71C1C",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  heartIcon: {
    top: 30,
    left: 22,
  },

  peopleIcon: {
    bottom: 25,
    right: 20,
  },

  medicalIcon: {
    top: 22,
    right: 25,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  welcomeTitle: {
    color: colors.text,
    fontSize: 35,
    fontWeight: "800",
    lineHeight: 41,
    letterSpacing: -1.3,
    marginBottom: 14,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textLight,
    marginBottom: 28,
  },

  actions: {
    marginTop: "auto",
    gap: 12,
  },

  button: {
    width: "100%",
    minHeight: 54,
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },

  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  buttonDeshabilitado: {
    opacity: 0.6,
  },

  outlineButton: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  outlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },

  footerText: {
    fontSize: 13,
    color: colors.textLight,
  },

  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 30,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  formBrand: {
    alignItems: "center",
    marginBottom: 28,
    gap: 10,
  },

  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  formTitle: {
    fontSize: 29,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
    marginBottom: 10,
  },

  formDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLight,
    marginBottom: 30,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 55,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.background,
    marginBottom: 20,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 14,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },

  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },

  switchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 24,
  },
});
