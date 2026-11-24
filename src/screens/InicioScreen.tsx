
import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  CompositeScreenProps,
  useFocusEffect,
} from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
} from "../types/navigation";
import { useApp } from "../context/AppContext";
import { SolicitudSangre } from "../types/models";
import { CarruselEntidades } from "../components/CarruselEntidades";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, "Inicio">,
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
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

  const esDonante = modo === "donar";

  const tieneAmbosRoles = Boolean(
    donante?.esDonante && donante?.esSolicitante
  );

  const primerNombre =
    donante?.nombre?.trim().split(" ")[0] || "Bienvenido";

  useFocusEffect(
    useCallback(() => {
      refrescarNoLeidas().catch(() => {});

      if (modo === "donar") {
        refrescarSolicitudes().catch(() => {});
      } else {
        refrescarMisSolicitudes().catch(() => {});
      }
    }, [
      modo,
      refrescarSolicitudes,
      refrescarMisSolicitudes,
      refrescarNoLeidas,
    ])
  );

  const datos: SolicitudSangre[] = esDonante
    ? solicitudesCompatibles
    : misSolicitudes;

  const cabecera = (
    <View style={styles.headerContent}>
      <View style={styles.headerRow}>
        <View style={styles.greeting}>
          <Text style={styles.modeLabel}>
            {esDonante ? "MODO DONANTE" : "MODO SOLICITANTE"}
          </Text>

          <Text style={styles.headerTitle}>
            Hola, {primerNombre} 👋
          </Text>

          <Text style={styles.headerSubtitle}>
            {esDonante
              ? "Hoy puedes salvar una vida."
              : "Estamos aquí para ayudarte."}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.campana}
          onPress={() => navigation.navigate("Notificaciones")}
          accessibilityLabel="Notificaciones"
        >
          <Ionicons
            name="notifications-outline"
            size={25}
            color={colors.text}
          />

          {noLeidas > 0 && (
            <View style={styles.contador}>
              <Text style={styles.contadorTexto}>
                {noLeidas > 9 ? "9+" : noLeidas}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {tieneAmbosRoles && (
        <View style={styles.selector}>
          {(["donar", "solicitar"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.opcion,
                modo === m && styles.opcionActiva,
              ]}
              onPress={() => cambiarModo(m)}
            >
              <Text
                style={[
                  styles.opcionTexto,
                  modo === m && styles.opcionTextoActiva,
                ]}
              >
                {m === "donar" ? "Donar" : "Solicitar"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {esDonante ? (
        <>
          <View style={styles.bloodCard}>
            <View style={styles.bloodIcon}>
              <Ionicons
                name="water"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.bloodType}>
                {donante?.tipoSangre ?? "—"}
              </Text>
            </View>

            <View style={styles.bloodInfo}>
              <Text style={styles.cardTitle}>
                Tu grupo sanguíneo
              </Text>

              <Text style={styles.cardSubtitle}>
                Un tipo de sangre, muchas vidas.
              </Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.decorCircle} />
            <View style={styles.decorCircleSmall} />

            <View style={styles.heroHeader}>
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>
                  Tu ayuda importa
                </Text>

                <Text style={styles.heroDescription}>
                  Descubre si cumples los requisitos para donar
                  sangre.
                </Text>
              </View>

              <View style={styles.heroIcon}>
                <Ionicons
                  name="heart-outline"
                  size={35}
                  color={colors.white}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => navigation.navigate("Requisitos")}
            >
              <Text style={styles.heroButtonText}>
                Evaluar requisitos
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.availabilityCard}
            onPress={() => navigation.navigate("Requisitos")}
          >
            <View style={styles.availabilityIcon}>
              <Ionicons
                name="heart-circle-outline"
                size={28}
                color={colors.success}
              />
            </View>

            <View style={styles.bloodInfo}>
              <Text style={styles.cardTitle}>
                Tu disponibilidad
              </Text>

              <Text style={styles.cardSubtitle}>
                Consulta si puedes donar.
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.hero}>
          <View style={styles.decorCircle} />

          <Text style={styles.heroTitle}>
            No estás solo
          </Text>

          <Text style={styles.heroDescription}>
            Encuentra personas dispuestas a ayudar cuando más
            lo necesitas.
          </Text>

          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => navigation.navigate("CrearSolicitud")}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />

            <Text style={styles.heroButtonText}>
              Nueva solicitud
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {esDonante
            ? "Solicitudes compatibles"
            : "Mis solicitudes"}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {esDonante
            ? "Personas que necesitan tu ayuda"
            : "Consulta tus solicitudes publicadas"}
        </Text>
      </View>
    </View>
  );

  function renderItem({ item }: { item: SolicitudSangre }) {
    const esUrgente =
      item.urgencia === "Alta" && item.estado === "activa";

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() =>
          navigation.navigate("DetalleSolicitud", {
            solicitudId: item.id,
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.requestBlood}>
          <Ionicons
            name="water"
            size={16}
            color={colors.primary}
          />

          <Text style={styles.requestBloodText}>
            {item.tipoSangre}
          </Text>
        </View>

        <View style={styles.requestInfo}>
          <View style={styles.requestHeader}>
            <View
              style={[
                styles.urgencyBadge,
                esUrgente && styles.urgentBadge,
              ]}
            >
              <Text
                style={[
                  styles.urgencyText,
                  esUrgente && styles.urgentText,
                ]}
              >
                {esUrgente
                  ? "Urgente"
                  : `Prioridad ${item.urgencia.toLowerCase()}`}
              </Text>
            </View>
          </View>

          <Text style={styles.hospital}>
            {item.hospital}
          </Text>

          <View style={styles.detailRow}>
            <Ionicons
              name="time-outline"
              size={13}
              color={colors.textLight}
            />

            <Text style={styles.detailText}>
              {item.creadaHace}
            </Text>
          </View>

          {item.distanciaKm !== null && (
            <View style={styles.detailRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textLight}
              />

              <Text style={styles.detailText}>
                {item.distanciaKm} km de distancia
              </Text>
            </View>
          )}

          {!esDonante ? (
            <Text
              style={
                item.estado === "activa"
                  ? styles.confirmados
                  : styles.detailText
              }
            >
              {item.estado === "activa"
                ? "Solicitud activa"
                : "Solicitud resuelta"}
            </Text>
          ) : (
            item.donantesConfirmados.length > 0 && (
              <Text style={styles.confirmados}>
                {item.donantesConfirmados.length} confirmados
              </Text>
            )
          )}
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textLight}
        />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={datos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={cabecera}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="heart-outline"
                size={32}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {esDonante
                ? "Todo al día"
                : "Aún no tienes solicitudes"}
            </Text>

            <Text style={styles.emptyDescription}>
              {esDonante
                ? "Por ahora no hay solicitudes compatibles con tu grupo sanguíneo."
                : "Tus solicitudes aparecerán aquí cuando las publiques."}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.entitiesSection}>
            <Text style={styles.sectionTitle}>
              Entidades aliadas
            </Text>

            <Text style={styles.sectionSubtitle}>
              Encuentra lugares donde puedes ayudar.
            </Text>

            <CarruselEntidades />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    gap: 12,
  },

  headerContent: {
    gap: 18,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  greeting: {
    flex: 1,
    paddingRight: 10,
  },

  modeLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: 7,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.9,
  },

  headerSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 5,
  },

  campana: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  contador: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  contadorTexto: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "bold",
  },

  selector: {
    flexDirection: "row",
    backgroundColor: "#E9EBEF",
    borderRadius: 14,
    padding: 4,
  },

  opcion: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 11,
  },

  opcionActiva: {
    backgroundColor: colors.white,
  },

  opcionTexto: {
    color: colors.textLight,
    fontWeight: "600",
  },

  opcionTextoActiva: {
    color: colors.primary,
    fontWeight: "700",
  },

  bloodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 15,
    gap: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },

  bloodIcon: {
    width: 68,
    height: 68,
    backgroundColor: colors.urgent,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  bloodType: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.primary,
  },

  bloodInfo: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  cardSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textLight,
    marginTop: 5,
  },

  hero: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    padding: 22,
    overflow: "hidden",
  },

  decorCircle: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -65,
    right: -65,
  },

  decorCircleSmall: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -70,
    left: -30,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: -0.7,
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#FFE5E5",
  },

  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroButton: {
    backgroundColor: colors.white,
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 20,
    gap: 10,
  },

  heroButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },

  availabilityCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  availabilityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E4F3E6",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 5,
    marginBottom: 3,
  },

  requestCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  requestBlood: {
    width: 58,
    height: 64,
    borderRadius: 15,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  requestBloodText: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },

  requestInfo: {
    flex: 1,
    gap: 5,
  },

  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  urgencyBadge: {
    backgroundColor: "#FFF2E2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  urgentBadge: {
    backgroundColor: colors.urgent,
  },

  urgencyText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A46B24",
  },

  urgentText: {
    color: colors.primary,
  },

  hospital: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  detailText: {
    fontSize: 12,
    color: colors.textLight,
  },

  confirmados: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textLight,
    textAlign: "center",
  },

  entitiesSection: {
    marginTop: 12,
    gap: 8,
  },
});
