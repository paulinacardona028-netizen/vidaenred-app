import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from "react-native";
import { colors } from "../styles/colors";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const diasEnMes = (anio: number, mes: number) => new Date(anio, mes, 0).getDate();

const formatear = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

interface Props {
  valor: string; // AAAA-MM-DD o ""
  onChange: (fecha: string) => void;
  etiqueta?: string;
}

// Calendario de fecha de nacimiento: se elige el año, el mes y el día
export function SelectorFecha({ valor, onChange, etiqueta = "Fecha de nacimiento" }: Props) {
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const anios = Array.from({ length: 111 }, (_, i) => anioActual - i); // hasta 110 años atrás

  const [abierto, setAbierto] = useState(false);
  const inicial = valor ? valor.split("-").map(Number) : [anioActual - 25, 1, 1];
  const [anio, setAnio] = useState(inicial[0]);
  const [mes, setMes] = useState(inicial[1]);
  const [dia, setDia] = useState(inicial[2]);

  const maxDia = diasEnMes(anio, mes);
  const diaValido = Math.min(dia, maxDia);

  function abrir() {
    const v = valor ? valor.split("-").map(Number) : [anioActual - 25, 1, 1];
    setAnio(v[0]);
    setMes(v[1]);
    setDia(v[2]);
    setAbierto(true);
  }

  function confirmar() {
    onChange(formatear(anio, mes, diaValido));
    setAbierto(false);
  }

  const etiquetaFecha = valor
    ? valor.split("-").reverse().join("/")
    : "Selecciona tu fecha de nacimiento";

  return (
    <View style={styles.raiz}>
      <Text style={styles.label}>{etiqueta}</Text>
      <TouchableOpacity style={styles.campo} onPress={abrir}>
        <Text style={valor ? styles.valor : styles.placeholder}>{etiquetaFecha}</Text>
      </TouchableOpacity>

      <Modal visible={abierto} animationType="slide" transparent onRequestClose={() => setAbierto(false)}>
        <View style={styles.fondo}>
          <View style={styles.panel}>
            <Text style={styles.titulo}>Fecha de nacimiento</Text>
            <Text style={styles.resumen}>
              {diaValido} de {MESES[mes - 1]} de {anio}
            </Text>

            <Text style={styles.seccion}>Año</Text>
            <ScrollView style={styles.listaAnios} nestedScrollEnabled>
              <View style={styles.fila}>
                {anios.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, a === anio && styles.chipActivo]}
                    onPress={() => setAnio(a)}
                  >
                    <Text style={[styles.chipTexto, a === anio && styles.chipTextoActivo]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.seccion}>Mes</Text>
            <View style={styles.fila}>
              {MESES.map((nombre, i) => (
                <TouchableOpacity
                  key={nombre}
                  style={[styles.chipMes, i + 1 === mes && styles.chipActivo]}
                  onPress={() => setMes(i + 1)}
                >
                  <Text style={[styles.chipTexto, i + 1 === mes && styles.chipTextoActivo]}>
                    {nombre.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.seccion}>Día</Text>
            <View style={styles.fila}>
              {Array.from({ length: maxDia }, (_, i) => i + 1).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chipDia, d === diaValido && styles.chipActivo]}
                  onPress={() => setDia(d)}
                >
                  <Text style={[styles.chipTexto, d === diaValido && styles.chipTextoActivo]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.acciones}>
              <TouchableOpacity style={styles.botonSecundario} onPress={() => setAbierto(false)}>
                <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonPrimario} onPress={confirmar}>
                <Text style={styles.botonPrimarioTexto}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  valor: { fontSize: 15, color: colors.text },
  placeholder: { fontSize: 15, color: colors.textLight },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: "88%",
  },
  titulo: { fontSize: 17, fontWeight: "bold", color: colors.text },
  resumen: { fontSize: 14, color: colors.primary, marginTop: 4, marginBottom: 6 },
  seccion: { fontSize: 13, fontWeight: "600", color: colors.textLight, marginTop: 12, marginBottom: 6 },
  listaAnios: { maxHeight: 110 },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipMes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 58,
    alignItems: "center",
  },
  chipDia: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    width: 40,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 13 },
  chipTextoActivo: { color: colors.white, fontWeight: "600" },
  acciones: { flexDirection: "row", gap: 10, marginTop: 18 },
  botonSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  botonSecundarioTexto: { color: colors.text, fontWeight: "600" },
  botonPrimario: { flex: 1, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  botonPrimarioTexto: { color: colors.white, fontWeight: "bold" },
});
