
import React, { useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  RootStackParamList,
  MainTabParamList,
} from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError } from "../services/api";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Perfil">,
  NativeStackScreenProps<RootStackParamList>
>;

export function PerfilScreen({ navigation }: Props) {
  const {
    donante,
    modo,
    cambiarModo,
    cambiarDisponibilidad,
    cambiarRoles,
    cerrarSesion,
  } = useApp();

  const [guardando, setGuardando] = useState(false);

  if (!donante) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.subtitle}>
          Cargando tu perfil...
        </Text>
      </View>
    );
  }

  async function ejecutar(accion: () => Promise<void>) {
    setGuardando(true);

    try {
      await accion();
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof ApiError
          ? err.message
          : "No se pudo guardar el cambio."
      );
    } finally {
      setGuardando(false);
    }
  }

  function handleRolDonante(activar: boolean) {
    if (activar) {
      navigation.navigate("Requisitos");
      return;
    }

    Alert.alert(
      "Dejar de donar",
      "Ya no verás solicitudes compatibles. Podrás volver a activarlo completando los requisitos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () =>
            ejecutar(() =>
              cambiarRoles({ esDonante: false })
            ),
        },
      ]
    );
  }

  function handleCerrarSesion() {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: () => {
            cerrarSesion();

            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]
    );
  }

  const iniciales = donante.nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const ambosRoles =
    donante.esDonante && donante.esSolicitante;

  const roles = ambosRoles
    ? "Donante y solicitante"
    : donante.esDonante
    ? "Donante"
    : donante.esSolicitante
    ? "Solicitante"
    : "Sin roles activos";

  const modoActual =
    modo === "donar" ? "Donante" : "Solicitante";

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          TU ESPACIO PERSONAL
        </Text>

        <Text style={styles.title}>Mi perfil</Text>

        <Text style={styles.subtitle}>
          Administra tu información y tu participación
          en VidaEnRed.
        </Text>

        {/* Perfil principal */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {iniciales}
            </Text>
          </View>

          <Text style={styles.nombre}>
            {donante.nombre}
          </Text>

          <Text style={styles.correo}>
            {donante.correo}
          </Text>

          <View style={styles.bloodBadge}>
            <Ionicons
              name="water"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.bloodText}>
              {donante.tipoSangre
                ? `Tipo ${donante.tipoSangre}`
                : "Tipo de sangre sin registrar"}
            </Text>
          </View>
        </View>

        {/* Información personal */}
        <Text style={styles.sectionTitle}>
          Información personal
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="location-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Ciudad</Text>
              <Text style={styles.value}>
                {donante.ciudad}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="people-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>Roles</Text>
              <Text style={styles.value}>{roles}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="heart-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.label}>
                Modo actual
              </Text>

              <Text style={styles.value}>
                {donante.esDonante || donante.esSolicitante
                  ? modoActual
                  : "Sin modo activo"}
              </Text>
            </View>
          </View>
        </View>

        {/* Donaciones realizadas */}
        <View style={styles.statsCard}>
          <View style={styles.statsIcon}>
            <Ionicons
              name="heart"
              size={28}
              color={colors.white}
            />
          </View>

          <View style={styles.flex}>
            <Text style={styles.statsTitle}>
              Cada donación cuenta
            </Text>

            <Text style={styles.statsText}>
              Donaciones realizadas
            </Text>
          </View>

          <Text style={styles.statsNumber}>
            {donante.donacionesRealizadas}
          </Text>
        </View>

        {/* Roles */}
        <Text style={styles.sectionTitle}>
          Mis roles
        </Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="heart-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.value}>
                Puedo donar
              </Text>

              <Text style={styles.label}>
                {donante.esDonante
                  ? "Rol activo"
                  : "Completa los requisitos"}
              </Text>
            </View>

            <Switch
              value={donante.esDonante}
              onValueChange={handleRolDonante}
              disabled={guardando}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="water-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.value}>
                Necesito sangre
              </Text>

              <Text style={styles.label}>
                Publica solicitudes de sangre
              </Text>
            </View>

            <Switch
              value={donante.esSolicitante}
              onValueChange={(v) =>
                ejecutar(() =>
                  cambiarRoles({ esSolicitante: v })
                )
              }
              disabled={guardando}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Disponibilidad */}
        {donante.esDonante && (
          <>
            <Text style={styles.sectionTitle}>
              Mi disponibilidad
            </Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: donante.disponible
                        ? "#E4F3E6"
                        : colors.background,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={
                      donante.disponible
                        ? colors.success
                        : colors.textLight
                    }
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={styles.value}>
                    Disponible para donar
                  </Text>

                  <Text style={styles.label}>
                    {donante.disponible
                      ? "Disponibilidad activa"
                      : "No disponible"}
                  </Text>
                </View>

                <Switch
                  value={donante.disponible}
                  onValueChange={(v) =>
                    ejecutar(() =>
                      cambiarDisponibilidad(v)
                    )
                  }
                  disabled={guardando}
                  trackColor={{
                    false: colors.border,
                    true: colors.success,
                  }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          </>
        )}

        {/* Configuración */}
        <Text style={styles.sectionTitle}>
          Configuración
        </Text>

        <View style={styles.card}>
          {ambosRoles && (
            <>
              <TouchableOpacity
                style={styles.row}
                disabled={guardando}
                onPress={() =>
                  cambiarModo(
                    modo === "donar"
                      ? "solicitar"
                      : "donar"
                  )
                }
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={23}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.flex}>
                  <Text style={styles.value}>
                    Cambiar modo
                  </Text>

                  <Text style={styles.label}>
                    {modo === "donar"
                      ? "Pasar a solicitante"
                      : "Pasar a donante"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>

              <View style={styles.divider} />
            </>
          )}

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("Historial")
            }
          >
            <View style={styles.iconBox}>
              <Ionicons
                name="time-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.value}>
                Historial de donaciones
              </Text>

              <Text style={styles.label}>
                Consulta tu actividad
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              navigation.navigate("Requisitos")
            }
          >
            <View style={styles.iconBox}>
              <Ionicons
                name="clipboard-outline"
                size={23}
                color={colors.primary}
              />
            </View>

            <View style={styles.flex}>
              <Text style={styles.value}>
                Evaluar requisitos
              </Text>

              <Text style={styles.label}>
                Formulario de donación
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {guardando && (
          <View style={styles.saving}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.label}>
              Guardando cambios...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.logout}
          onPress={handleCerrarSesion}
          disabled={guardando}
        >
          <Ionicons
            name="log-out-outline"
            size={23}
            color={colors.primary}
          />

          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Ionicons
            name="heart"
            size={20}
            color={colors.primary}
          />

          <Text style={styles.brand}>VidaEnRed</Text>

          <Text style={styles.footerText}>
            JUNTOS HACEMOS LA DIFERENCIA
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: 20,
    paddingBottom: 35,
    gap: 15,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },

  subtitle: {
    color: colors.textLight,
    fontSize: 14,
    lineHeight: 21,
  },

  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },

  avatar: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  avatarText: {
    color: colors.primary,
    fontSize: 33,
    fontWeight: "800",
  },

  nombre: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },

  correo: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: "center",
  },

  bloodBadge: {
    backgroundColor: colors.urgent,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },

  bloodText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    marginTop: 5,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 5,
  },

  flex: {
    flex: 1,
    gap: 4,
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
  },

  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  statsCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  statsIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },

  statsText: {
    fontSize: 12,
    color: "#FFE5E7",
  },

  statsNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
  },

  saving: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  logout: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 17,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
  },

  footer: {
    alignItems: "center",
    gap: 7,
    paddingVertical: 20,
  },

  brand: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800",
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
});
