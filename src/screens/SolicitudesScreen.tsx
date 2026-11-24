
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { MainTabParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { colors } from "../styles/colors";

type Props = BottomTabScreenProps<
  MainTabParamList,
  "Solicitudes"
>;

export function SolicitudesScreen({ navigation }: Props) {
  const {
    donante,
    modo,
    solicitudesCompatibles,
    misSolicitudes,
    refrescarSolicitudes,
    refrescarMisSolicitudes,
  } = useApp();

  const [filtro, setFiltro] = useState<
    "Todas" | "Mi grupo" | "Urgentes"
  >("Todas");

  const esDonante = modo === "donar";

  useFocusEffect(
    useCallback(() => {
      if (esDonante) {
        refrescarSolicitudes().catch(() => {});
      } else {
        refrescarMisSolicitudes().catch(() => {});
      }
    }, [
      esDonante,
      refrescarSolicitudes,
      refrescarMisSolicitudes,
    ])
  );

  const solicitudes = esDonante
    ? solicitudesCompatibles
    : misSolicitudes;

  const datos = solicitudes.filter((item) => {
    if (filtro === "Mi grupo") {
      return item.tipoSangre === donante?.tipoSangre;
    }

    if (filtro === "Urgentes") {
      return item.urgencia === "Alta" &&
        item.estado === "activa";
    }

    return true;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitudes</Text>

      <Text style={styles.subtitle}>
        {esDonante
          ? "Encuentra personas que necesitan tu ayuda."
          : "Consulta y administra tus solicitudes."}
      </Text>

      {!esDonante && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CrearSolicitud")}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={colors.white}
          />
          <Text style={styles.createText}>
            Nueva solicitud
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.filters}>
        {(["Todas", "Mi grupo", "Urgentes"] as const).map(
          (opcion) => (
            <TouchableOpacity
              key={opcion}
              style={[
                styles.filter,
                filtro === opcion && styles.filterActive,
              ]}
              onPress={() => setFiltro(opcion)}
            >
              <Text
                style={[
                  styles.filterText,
                  filtro === opcion && styles.filterTextActive,
                ]}
              >
                {opcion}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Text style={styles.results}>
        {datos.length} solicitudes
      </Text>

      <FlatList
        data={datos}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const urgente =
            item.urgencia === "Alta" &&
            item.estado === "activa";

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("InicioTab", {
                  screen: "DetalleSolicitud",
                  params: { solicitudId: item.id },
                })
              }
            >
              <View style={styles.cardTop}>
                <View style={styles.blood}>
                  <Ionicons
                    name="water"
                    size={18}
                    color={colors.primary}
                  />

                  <Text style={styles.bloodText}>
                    {item.tipoSangre}
                  </Text>
                </View>

                <View style={styles.info}>
                  <View
                    style={[
                      styles.badge,
                      urgente && styles.urgentBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        urgente && styles.urgentText,
                      ]}
                    >
                      {urgente
                        ? "Urgente"
                        : `Prioridad ${item.urgencia.toLowerCase()}`}
                    </Text>
                  </View>

                  <Text style={styles.hospital}>
                    {item.hospital}
                  </Text>

                  <View style={styles.detailRow}>
                    <Ionicons
                      name="time-outline"
                      size={15}
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
                        size={15}
                        color={colors.textLight}
                      />

                      <Text style={styles.detailText}>
                        {item.distanciaKm} km
                      </Text>
                    </View>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textLight}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <Text style={styles.cardBottomText}>
                  {item.estado === "activa"
                    ? "Solicitud activa"
                    : "Solicitud resuelta"}
                </Text>

                <Text style={styles.detailLink}>
                  Ver detalles →
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="clipboard-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No hay solicitudes
            </Text>

            <Text style={styles.emptyText}>
              No encontramos solicitudes con este filtro.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.8,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textLight,
    marginTop: 7,
    marginBottom: 22,
  },

  filters: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 20,
  },

  filter: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textLight,
  },

  filterTextActive: {
    color: colors.white,
  },

  results: {
    color: colors.textLight,
    fontSize: 13,
    marginBottom: 14,
  },

  list: {
    gap: 14,
    paddingBottom: 25,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  blood: {
    width: 66,
    height: 76,
    borderRadius: 18,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  bloodText: {
    fontSize: 25,
    fontWeight: "800",
    color: colors.primary,
  },

  info: {
    flex: 1,
    gap: 6,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF2E2",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },

  urgentBadge: {
    backgroundColor: colors.urgent,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A46B24",
  },

  urgentText: {
    color: colors.primary,
  },

  hospital: {
    fontSize: 16,
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

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardBottomText: {
    color: colors.textLight,
    fontSize: 12,
  },

  detailLink: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
    marginBottom: 20,
  },

  createText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  empty: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
  },
});
