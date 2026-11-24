import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Entidad } from "../types/models";
import { api } from "../services/api";
import { useApp } from "../context/AppContext";
import { abrirEnGoogleMaps, llamar } from "../utils/mapas";
import { colors } from "../styles/colors";

const ANCHO_TARJETA = Dimensions.get("window").width * 0.78;

// Cuántas entidades muestra el carrusel: solo las más conocidas de la ciudad
const LIMITE = 3;

// Iniciales del nombre: "Hospital San Vicente" -> "HS"
function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((p) => p.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

// Logo de la entidad. Si no hay URL, o la imagen no carga, muestra las iniciales.
function LogoEntidad({ entidad }: { entidad: Entidad }) {
  const [fallo, setFallo] = useState(false);
  if (entidad.logoUrl && !fallo) {
    return (
      <Image
        source={{ uri: entidad.logoUrl }}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel={`Logo de ${entidad.nombre}`}
        onError={() => setFallo(true)}
      />
    );
  }
  return (
    <View style={styles.iconoCirculo}>
      <Text style={styles.iniciales}>{iniciales(entidad.nombre)}</Text>
    </View>
  );
}

// Las tres entidades más conocidas de la ciudad del usuario (aliadas o no)
export function CarruselEntidades() {
  const { donante } = useApp();
  const ciudad = donante?.ciudad ?? "";
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ciudad) return;
    let activo = true;
    setCargando(true);
    setError(false);
    api
      .listarEntidades({ ciudad, limite: LIMITE, incluirNoAliadas: true })
      .then((lista) => activo && setEntidades(lista))
      .catch(() => activo && setError(true))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [ciudad]);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Lo más conocido en {ciudad || "tu ciudad"}</Text>


      {cargando ? (
        <View style={styles.estado}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <Text style={styles.vacio}>No se pudieron cargar las entidades. Revisa tu conexión.</Text>
      ) : entidades.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay entidades registradas en {ciudad || "tu ciudad"}.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrusel}>
          {entidades.map((item) => (
            <View key={item.id} style={styles.tarjeta}>
              <LogoEntidad entidad={item} />
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iniciales: { color: colors.white, fontWeight: "bold", fontSize: 14 },
  logo: { width: 40, height: 40, borderRadius: 8, marginBottom: 10, backgroundColor: colors.white },
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
