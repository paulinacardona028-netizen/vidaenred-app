
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../types/navigation";
import { useSolicitud } from "../hooks/useSolicitud";
import { abrirEnGoogleMaps } from "../utils/mapas";
import { colors } from "../styles/colors";

type Props = NativeStackScreenProps<
  HomeStackParamList,
  "ConfirmacionDonacion"
>;

export function ConfirmacionDonacionScreen({
  route,
  navigation,
}: Props) {
  const { solicitud, cargando } = useSolicitud(
    route.params.solicitudId
  );

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Confirmación */}
      <View style={styles.hero}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Ionicons
              name="checkmark"
              size={52}
              color={colors.white}
            />
          </View>
        </View>

        <View style={styles.successBadge}>
          <Ionicons
            name="checkmark-circle-outline"
            size={16}
            color={colors.success}
          />

          <Text style={styles.successBadgeText}>
            DISPONIBILIDAD CONFIRMADA
          </Text>
        </View>

        <Text style={styles.titulo}>
          ¡Gracias por estar ahí!
        </Text>

        <Text style={styles.descripcion}>
          Tu disponibilidad ha sido registrada.
          Estás un paso más cerca de salvar una vida.
        </Text>
      </View>

      {/* Entidad médica */}
      {solicitud && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            ENTIDAD MÉDICA
          </Text>

          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
              <Ionicons
                name="business-outline"
                size={28}
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

          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <Text style={styles.textoSuave}>
                Tipo requerido
              </Text>

              <Text style={styles.bloodType}>
                {solicitud.tipoSangre}
              </Text>
            </View>

            <View style={styles.detailBox}>
              <Text style={styles.textoSuave}>
                Urgencia
              </Text>

              <Text style={styles.urgencia}>
                {solicitud.urgencia}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Información */}
      <View style={styles.messageCard}>
        <Ionicons
          name="heart-outline"
          size={25}
          color={colors.primary}
        />

        <View style={styles.infoContent}>
          <Text style={styles.messageTitle}>
            Cada gesto cuenta
          </Text>

          <Text style={styles.messageText}>
            Se avisó al solicitante. Recuerda que
            confirmar tu disponibilidad no significa
            que la donación ya se haya realizado.
          </Text>
        </View>
      </View>

      {/* Acciones */}
      {solicitud && (
        <TouchableOpacity
          style={styles.botonPrimario}
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
            size={22}
            color={colors.white}
          />

          <Text style={styles.botonPrimarioTexto}>
            Ver ubicación
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.botonSecundario}
        onPress={() => navigation.popToTop()}
      >
        <Ionicons
          name="home-outline"
          size={21}
          color={colors.primary}
        />

        <Text style={styles.botonSecundarioTexto}>
          Volver al inicio
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        JUNTOS HACEMOS LA DIFERENCIA
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 35,
    gap: 18,
  },

  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    alignItems: "center",
    paddingVertical: 15,
    gap: 14,
  },

  outerCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#E4F3E6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  innerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },

  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E4F3E6",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  successBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  titulo: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.8,
  },

  descripcion: {
    color: colors.textLight,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.textLight,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    gap: 5,
  },

  hospital: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },

  smallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  textoSuave: {
    fontSize: 13,
    color: colors.textLight,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  detailsRow: {
    flexDirection: "row",
    gap: 12,
  },

  detailBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 13,
    gap: 6,
  },

  bloodType: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },

  urgencia: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700",
  },

  messageCard: {
    backgroundColor: colors.urgent,
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  messageTitle: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "800",
  },

  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.primaryDark,
  },

  botonPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  botonPrimarioTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  botonSecundario: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  botonSecundarioTexto: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.textLight,
    marginTop: 10,
  },
});
