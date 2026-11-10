import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Entidad, TipoEntidad } from "../types/models";
import { api } from "../services/api";
import { abrirEnGoogleMaps, llamar } from "../utils/mapas";
import { colors } from "../styles/colors";

const ANCHO_TARJETA = Dimensions.get("window").width * 0.78;

const FILTROS: { valor: TipoEntidad | undefined; texto: string }[] = [
  { valor: undefined, texto: "Todas" },
  { valor: "Hospital", texto: "Hospitales" },
  { valor: "Urgencias", texto: "Urgencias" },
  { valor: "Banco de sangre", texto: "Bancos de sangre" },
  { valor: "Clínica", texto: "Clínicas" },
];

const ICONOS: Record<TipoEntidad, keyof typeof Ionicons.glyphMap> = {
  Hospital: "medkit-outline",
  Urgencias: "flash-outline",
  "Banco de sangre": "water-outline",
  Clínica: "medical-outline",
};

// Carrusel horizontal de entidades aliadas, con filtro por tipo
export function CarruselEntidades() {
  const [filtro, setFiltro] = useState<TipoEntidad | undefined>(undefined);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    setError(false);
    api
      .listarEntidades(filtro)
      .then((lista) => activo && setEntidades(lista))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [filtro]);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Entidades aliadas</Text>

      <FlatList
        horizontal
        data={FILTROS}
        keyExtractor={(f) => f.texto}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
        renderItem={({ item }) => {
          const activo = item.valor === filtro;
          return (
            <TouchableOpacity
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => setFiltro(item.valor)}
            >
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{item.texto}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {error ? (
        <Text style={styles.vacio}>No se pudieron cargar las entidades.</Text>
      ) : entidades.length === 0 ? (
        <Text style={styles.vacio}>No hay entidades de este tipo por ahora.</Text>
      ) : (
        <FlatList
          horizontal
          data={entidades}
          keyExtractor={(e) => e.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={ANCHO_TARJETA + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.carrusel}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <View style={styles.iconoCirculo}>
                <Ionicons name={ICONOS[item.tipo]} size={22} color={colors.primary} />
              </View>
              <Text style={styles.nombre} numberOfLines={2}>
                {item.nombre}
              </Text>
              <Text style={styles.detalle}>
                {item.tipo} · {item.ciudad}
              </Text>
              {item.esAliada && (
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto}>Aliada</Text>
                </View>
              )}
              <View style={styles.acciones}>
                <TouchableOpacity
                  style={styles.accion}
                  onPress={() => abrirEnGoogleMaps(item.nombre, item.latitud, item.longitud)}
                >
                  <Ionicons name="navigate-outline" size={16} color={colors.white} />
                  <Text style={styles.accionTexto}>Cómo llegar</Text>
                </TouchableOpacity>
                {item.telefono && (
                  <TouchableOpacity style={styles.accionSecundaria} onPress={() => llamar(item.telefono!)}>
                    <Ionicons name="call-outline" size={16} color={colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingTop: 12, paddingBottom: 8 },
  titulo: { fontSize: 15, fontWeight: "bold", color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  filtros: { paddingHorizontal: 16, gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13 },
  chipTextoActivo: { color: colors.white, fontWeight: "600" },
  carrusel: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  tarjeta: {
    width: ANCHO_TARJETA,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.background,
  },
  iconoCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  nombre: { fontSize: 15, fontWeight: "bold", color: colors.text },
  detalle: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E3F4EA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  badgeTexto: { color: colors.success, fontSize: 11, fontWeight: "600" },
  acciones: { flexDirection: "row", gap: 8, marginTop: 12 },
  accion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
  },
  accionTexto: { color: colors.white, fontWeight: "600", fontSize: 13 },
  accionSecundaria: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  vacio: { color: colors.textLight, paddingHorizontal: 16, paddingVertical: 12 },
});
