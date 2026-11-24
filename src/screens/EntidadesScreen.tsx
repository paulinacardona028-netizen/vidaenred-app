
import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CarruselEntidades } from "../components/CarruselEntidades";
import { colors } from "../styles/colors";

export function EntidadesScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Entidades aliadas</Text>

      <Text style={styles.subtitle}>
        Encuentra hospitales y centros de donación
        donde puedes salvar vidas.
      </Text>

      <View style={styles.banner}>
        <View style={styles.iconBox}>
          <Ionicons
            name="business-outline"
            size={32}
            color={colors.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>
            Una red que salva vidas
          </Text>

          <Text style={styles.bannerText}>
            Conoce las entidades de salud de tu ciudad.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Centros de donación
      </Text>

      <CarruselEntidades />

      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={23}
          color={colors.primary}
        />

        <Text style={styles.noticeText}>
          Antes de acudir, consulta los horarios y
          requisitos de donación de cada entidad.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textLight,
    marginTop: 8,
    marginBottom: 24,
  },
  banner: {
    backgroundColor: colors.urgent,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 26,
  },
  iconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  bannerText: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 15,
  },
  notice: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
  },
});
