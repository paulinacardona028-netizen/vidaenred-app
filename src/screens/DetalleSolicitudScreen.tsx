
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { useSolicitud } from "../hooks/useSolicitud";
import { ApiError } from "../services/api";
import { abrirEnGoogleMaps } from "../utils/mapas";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<
  HomeStackParamList,
  "DetalleSolicitud"
>;

export function DetalleSolicitudScreen({
  route,
  navigation,
}: Props) {
  const { solicitudId } = route.params;
  const { confirmarDonacion, cerrarSolicitud } = useApp();

  const { solicitud, cargando, noEncontrada } =
    useSolicitud(solicitudId);

  const [seleccionados, setSeleccionados] =
    useState<string[]>([]);

  const [enviando, setEnviando] = useState(false);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
        <Text style={styles.textoSuave}>
          Cargando solicitud...
        </Text>
      </View>
    );
  }

  if (!solicitud || noEncontrada) {
    return (
      <View style={styles.centrado}>
        <Ionicons
          name="document-text-outline"
          size={48}
          color={colors.textLight}
        />

        <Text style={styles.textoSuave}>
          Esta solicitud ya no está disponible.
        </Text>

        <TouchableOpacity
          style={styles.botonPrimario}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.botonPrimarioTexto}>
            Volver
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activa = solicitud.estado === "activa";

  const esUrgente =
    solicitud.urgencia === "Alta" && activa;

  function toggleDonante(id: string) {
    setSeleccionados((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function handlePuedoDonar() {
    setEnviando(true);

    try {
      await confirmarDonacion(solicitudId);

      navigation.navigate("ConfirmacionDonacion", {
        solicitudId,
      });
    } catch (err) {
      Alert.alert(
        "No se pudo confirmar",
        err instanceof ApiError
          ? err.message
          : "Inténtalo de nuevo."
      );
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
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar",
          style: "destructive",
          onPress: async () => {
            setEnviando(true);

            try {
              await cerrarSolicitud(
                solicitudId,
                seleccionados
              );

              Alert.alert(
                "Solicitud cerrada",
                "Gracias por usar VidaEnRed."
              );

              navigation.goBack();
            } catch (err) {
              Alert.alert(
                "No se pudo cerrar",
                err instanceof ApiError
                  ? err.message
                  : "Inténtalo de nuevo."
              );
            } finally {
              setEnviando(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.etiqueta}>
        DETALLE DE SOLICITUD
      </Text>

      <Text style={styles.titulo}>
        {solicitud.esMia
          ? "Tu solicitud"
          : "Tu ayuda puede salvar una vida"}
      </Text>

      <Text style={styles.descripcion}>
        {solicitud.esMia
          ? "Consulta y administra tu solicitud de sangre."
          : "Conoce los detalles y confirma si puedes ayudar."}
      </Text>

      {/* Tipo de sangre */}
      <View style={styles.hero}>
        <View style={styles.bloodIcon}>
          <Ionicons
            name="water"
            size={36}
            color={colors.primary}
          />
        </View>

        <Text style={styles.heroLabel}>
          TIPO DE SANGRE REQUERIDO
        </Text>

        <Text style={styles.bloodType}>
          {solicitud.tipoSangre}
        </Text>

        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              esUrgente
                ? styles.badgeUrgente
                : styles.badgeNormal,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={
                esUrgente
                  ? colors.primary
                  : "#A46B24"
              }
            />

            <Text
              style={[
                styles.badgeText,
                {
                  color: esUrgente
                    ? colors.primary
                    : "#A46B24",
                },
              ]}
            >
              {esUrgente
                ? "Solicitud urgente"
                : `Urgencia ${solicitud.urgencia}`}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: activa
                  ? "#E4F3E6"
                  : "#E5E7EB",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: activa
                    ? colors.success
                    : colors.textLight,
                },
              ]}
            >
              {activa ? "Activa" : "Cerrada"}
            </Text>
          </View>
        </View>
      </View>

      {/* Entidad médica */}
      <Text style={styles.sectionTitle}>
        Entidad médica
      </Text>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <Ionicons
              name="business-outline"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.hospital}>
              {solicitud.hospital}
            </Text>

            <View style={styles.smallRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.textLight}
              />

              <Text style={styles.textoSuave}>
                {solicitud.ciudad}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.smallRow}>
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.textLight}
          />

          <Text style={styles.textoSuave}>
            {solicitud.creadaHace}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() =>
            abrirEnGoogleMaps(
              solicitud.hospital,
              solicitud.latitud,
              solicitud.longitud,
              solicitud.ciudad
            )
          }
        >
          <Ionicons
            name="navigate-outline"
            size={19}
            color={colors.primary}
          />

          <Text style={styles.botonSecundarioTexto}>
            Ver ubicación
          </Text>
        </TouchableOpacity>
      </View>

      {/* Donantes confirmados */}
      <View style={styles.confirmadosCard}>
        <View style={styles.iconBox}>
          <Ionicons
            name="people-outline"
            size={25}
            color={colors.primary}
          />
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.confirmadosNumero}>
            {solicitud.donantesConfirmados.length}
          </Text>

          <Text style={styles.textoSuave}>
            Personas han confirmado su disponibilidad
          </Text>
        </View>
      </View>

      {/* Vista del solicitante */}
      {solicitud.esMia && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Donantes que confirmaron
          </Text>

          <Text style={styles.textoSuave}>
            Selecciona únicamente a las personas
            que realizaron la donación.
          </Text>

          {solicitud.donantesConfirmados.length === 0 && (
            <Text style={styles.textoSuave}>
              Aún nadie ha confirmado.
            </Text>
          )}

          {solicitud.donantesConfirmados.map(
            (nombre, i) => {
              const id = solicitud.donantesIds[i];
              const marcado = seleccionados.includes(id);

              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.filaDonante,
                    marcado && styles.filaSeleccionada,
                  ]}
                  disabled={!activa || enviando}
                  onPress={() => toggleDonante(id)}
                >
                  <Ionicons
                    name={
                      marcado
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      marcado
                        ? colors.primary
                        : colors.textLight
                    }
                  />

                  <Text style={styles.nombreDonante}>
                    {nombre}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}

          {activa && (
            <TouchableOpacity
              style={[
                styles.botonPrimario,
                enviando && styles.botonDeshabilitado,
              ]}
              onPress={handleCerrar}
              disabled={enviando}
            >
              {enviando ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.botonPrimarioTexto}>
                  Cerrar solicitud
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Vista del donante */}
      {!solicitud.esMia && activa && (
        <>
          <TouchableOpacity
            style={[
              styles.botonPrimario,
              (solicitud.yaConfirmo || enviando) &&
                styles.botonDeshabilitado,
            ]}
            onPress={handlePuedoDonar}
            disabled={solicitud.yaConfirmo || enviando}
          >
            {enviando ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons
                  name={
                    solicitud.yaConfirmo
                      ? "checkmark-circle-outline"
                      : "heart-outline"
                  }
                  size={23}
                  color={colors.white}
                />

                <Text style={styles.botonPrimarioTexto}>
                  {solicitud.yaConfirmo
                    ? "Ya confirmaste"
                    : "Puedo donar"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#A46B24"
            />

            <Text style={styles.noticeText}>
              Confirmar tu disponibilidad no equivale
              a realizar una donación. La entidad médica
              evaluará si cumples los requisitos.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: 24,
    gap: 15,
  },

  etiqueta: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
  },

  descripcion: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 21,
    marginTop: -8,
  },

  hero: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  bloodIcon: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  heroLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textLight,
    letterSpacing: 1,
  },

  bloodType: {
    fontSize: 58,
    fontWeight: "800",
    color: colors.primary,
    marginVertical: 6,
  },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  badgeUrgente: {
    backgroundColor: colors.urgent,
  },

  badgeNormal: {
    backgroundColor: "#FFF2E2",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  infoContent: {
    flex: 1,
    gap: 5,
  },

  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  hospital: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  smallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  textoSuave: {
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  confirmadosCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },

  confirmadosNumero: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
  },

  filaDonante: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.background,
  },

  filaSeleccionada: {
    backgroundColor: colors.urgent,
  },

  nombreDonante: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },

  botonPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 17,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },

  botonDeshabilitado: {
    backgroundColor: colors.textLight,
  },

  botonPrimarioTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,
    paddingVertical: 13,
  },

  botonSecundarioTexto: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  notice: {
    backgroundColor: "#FFF2E2",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  noticeText: {
    flex: 1,
    color: "#94611F",
    fontSize: 12,
    lineHeight: 19,
  },
});
