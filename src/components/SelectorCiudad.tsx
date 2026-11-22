import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../services/api";
import { colors } from "../styles/colors";

interface Props {
  valor: string;
  onChange: (ciudad: string) => void;
  etiqueta?: string;
}

// Normaliza para buscar sin importar tildes ni mayúsculas
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Muestra la lista de ciudades del servidor y deja buscar entre ellas
export function SelectorCiudad({ valor, onChange, etiqueta = "Ciudad" }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .listarCiudades()
      .then(setCiudades)
      .catch(() => setError(true));
  }, []);

  const filtradas = useMemo(
    () => ciudades.filter((c) => normalizar(c).includes(normalizar(busqueda))),
    [ciudades, busqueda]
  );

  return (
    <View style={styles.raiz}>
      <Text style={styles.label}>{etiqueta}</Text>
      <TouchableOpacity style={styles.campo} onPress={() => setAbierto(true)}>
        <Text style={valor ? styles.valor : styles.placeholder}>
          {valor || "Selecciona tu ciudad"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textLight} />
      </TouchableOpacity>

      <Modal visible={abierto} animationType="slide" onRequestClose={() => setAbierto(false)}>
        <View style={styles.modal}>
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Selecciona tu ciudad</Text>
            <TouchableOpacity onPress={() => setAbierto(false)}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.buscador}
            placeholder="Buscar ciudad"
            placeholderTextColor={colors.textLight}
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
          />

          {error && <Text style={styles.vacio}>No se pudieron cargar las ciudades. Revisa tu conexión.</Text>}

          <FlatList
            data={filtradas}
            keyExtractor={(c) => c}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.fila}
                onPress={() => {
                  onChange(item);
                  setBusqueda("");
                  setAbierto(false);
                }}
              >
                <Text style={[styles.filaTexto, item === valor && styles.filaTextoActiva]}>{item}</Text>
                {item === valor && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignSelf: "stretch", width: "100%" },
  label: { fontSize: 13, color: colors.textLight, marginBottom: 6, marginTop: 10, textAlign: "left", alignSelf: "stretch" },
  campo: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  valor: { fontSize: 15, color: colors.text },
  placeholder: { fontSize: 15, color: colors.textLight },
  modal: { flex: 1, backgroundColor: colors.background, paddingTop: 56, paddingHorizontal: 20 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  titulo: { fontSize: 18, fontWeight: "bold", color: colors.text },
  buscador: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filaTexto: { fontSize: 16, color: colors.text },
  filaTextoActiva: { color: colors.primary, fontWeight: "600" },
  vacio: { color: colors.urgentText, marginVertical: 10 },
});
