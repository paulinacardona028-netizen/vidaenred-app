import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Entidad, TipoEntidad } from "../types/models";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
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

// Carrusel de entidades aliadas de la ciudad del usuario, con filtro por tipo
export function CarruselEntidades() {
  const { donante } = useApp();
  const ciudad = donante?.ciudad ?? "";
  const [filtro, setFiltro] = useState<TipoEntidad | undefined>(undefined);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ciudad) return;
    let activo = true;
    setCargando(true);
    setError(false);
    api
      .listarEntidades({ tipo: filtro, ciudad })
      .then((lista) => activo && setEntidades(lista))
      .catch(() => activo && setError(true))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [filtro, ciudad]);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Entidades aliadas en {ciudad || "tu ciudad"}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
        {FILTROS.map((f) => {
          const activo = f.valor === filtro;
          return (
            <TouchableOpacity
              key={f.texto}
              style={[styles.chip, activo && styles.chipActivo]}
              onPress={() => setFiltro(f.valor)}
            >
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{f.texto}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {cargando ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.vacio}>No se pudieron cargar las entidades. Revisa tu conexión.</Text>
      ) : entidades.length === 0 ? (
        <Text style={styles.vacio}>
          Todavía no hay entidades aliadas en {ciudad || "tu ciudad"}
          {filtro ? ` de tipo ${filtro.toLowerCase()}` : ""}.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
          {entidades.map((item) => (
            <View key={item.id} style={styles.tarjeta}>
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
                  onPress={() => abrirEnGoogleMaps(item.nombre, item.latitud, item.longitud, item.ciudad)}
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
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingTop: 12, paddingBottom: 8 },
  titulo: { fontSize: 15, fontWeight: "bold", color: colors.text, paddingHorizontal: 16, marginBottom: 8 },
  filtros: { paddingHorizontal: 16, gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13 },
  chipTextoActivo: { color: colors.white, fontWeight: "600" },
  estado: { height: 150, alignItems: "center", justifyContent: "center" },
  carrusel: { paddingHorizontal: 16, paddingVertical: 12 },
  tarjeta: {
    width: ANCHO_TARJETA,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.background,
    marginRight: 12,
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
  badge: { alignSelf: "flex-start", backgroundColor: "#E3F4EA", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 8 },
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
  accionSecundaria: { width: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  vacio: { color: colors.textLight, paddingHorizontal: 16, paddingVertical: 12 },
});
