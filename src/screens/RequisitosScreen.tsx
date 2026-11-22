import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError } from "../services/api";
import {
  CondicionesEvaluacion,
  RespuestasEvaluacion,
  ResultadoEvaluacion,
  TIPOS_SANGRE,
  TipoSangre,
} from "../types/models";
import { colors } from "../styles/colors";
import { SelectorFecha } from "../components/SelectorFecha";

type Props = NativeStackScreenProps<RootStackParamList, "Requisitos">;

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const CONDICIONES: { clave: keyof CondicionesEvaluacion; texto: string }[] = [
  { clave: "vih", texto: "Tienes VIH" },
  { clave: "hepatitisBC", texto: "Tienes hepatitis B o C" },
  { clave: "cancer", texto: "Has tenido cáncer" },
  { clave: "cardiaca", texto: "Tienes una enfermedad cardíaca" },
  { clave: "diabetesInsulina", texto: "Tienes diabetes tratada con insulina" },
  { clave: "drogasInyectadas", texto: "Consumes drogas inyectadas" },
];

interface Formulario {
  tipoSangre: TipoSangre;
  fechaNacimiento: string;
  pesoKg: string;
  sexo: "F" | "M";
  fechaUltimaDonacion: string;
  embarazoOLactancia: boolean;
  tatuajeOPiercingReciente: boolean;
  antibioticosRecientes: boolean;
  fiebreHoy: boolean;
  condiciones: CondicionesEvaluacion;
}

const INICIAL: Formulario = {
  tipoSangre: "O+",
  fechaNacimiento: "",
  pesoKg: "",
  sexo: "F",
  fechaUltimaDonacion: "",
  embarazoOLactancia: false,
  tatuajeOPiercingReciente: false,
  antibioticosRecientes: false,
  fiebreHoy: false,
  condiciones: {
    vih: false,
    hepatitisBC: false,
    cancer: false,
    cardiaca: false,
    diabetesInsulina: false,
    drogasInyectadas: false,
  },
};

export function RequisitosScreen({ navigation }: Props) {
  const { donante, evaluarRequisitos } = useApp();
  const [form, setForm] = useState<Formulario>({
    ...INICIAL,
    tipoSangre: donante?.tipoSangre ?? INICIAL.tipoSangre,
    fechaNacimiento: donante?.fechaNacimiento ?? "",
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);

  function cambiar<K extends keyof Formulario>(clave: K, valor: Formulario[K]) {
    setForm((prev) => ({ ...prev, [clave]: valor }));
  }

  function cambiarCondicion(clave: keyof CondicionesEvaluacion, valor: boolean) {
    setForm((prev) => ({ ...prev, condiciones: { ...prev.condiciones, [clave]: valor } }));
  }

  async function handleEnviar() {
    const errores: string[] = [];
    const peso = Number(form.pesoKg.replace(",", "."));
    if (!FECHA_REGEX.test(form.fechaNacimiento)) errores.push("Elige tu fecha de nacimiento en el calendario.");
    if (!peso || peso <= 0) errores.push("Escribe un peso válido en kilogramos.");
    if (form.fechaUltimaDonacion && !FECHA_REGEX.test(form.fechaUltimaDonacion)) {
      errores.push("La fecha de la última donación debe tener formato AAAA-MM-DD.");
    }
    if (errores.length > 0) {
      Alert.alert("Revisa el formulario", errores.join("\n"));
      return;
    }

    const respuestas: RespuestasEvaluacion = {
      tipoSangre: form.tipoSangre,
      fechaNacimiento: form.fechaNacimiento,
      pesoKg: peso,
      sexo: form.sexo,
      fechaUltimaDonacion: form.fechaUltimaDonacion || undefined,
      embarazoOLactancia: form.sexo === "F" ? form.embarazoOLactancia : false,
      tatuajeOPiercingReciente: form.tatuajeOPiercingReciente,
      antibioticosRecientes: form.antibioticosRecientes,
      fiebreHoy: form.fiebreHoy,
      condiciones: form.condiciones,
    };

    setEnviando(true);
    try {
      setResultado(await evaluarRequisitos(respuestas));
    } catch (err) {
      Alert.alert("Error", err instanceof ApiError ? err.message : "No se pudo enviar el formulario.");
    } finally {
      setEnviando(false);
    }
  }

  // Pantalla de resultado: se muestra después de enviar el formulario
  if (resultado) {
    const cumple = resultado.cumple;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.badge, { backgroundColor: cumple ? "#E3F4EA" : colors.urgent }]}>
          <Text style={[styles.badgeTexto, { color: cumple ? colors.success : colors.urgentText }]}>
            {cumple ? "Cumples los requisitos" : "Por ahora solo puedes ser solicitante"}
          </Text>
        </View>

        <Text style={styles.parrafo}>
          {cumple
            ? "Tu rol de donante quedó activo. Ya puedes ver solicitudes compatibles cerca de ti."
            : "Tu cuenta sigue activa como solicitante. Puedes publicar solicitudes para ti o para un familiar."}
        </Text>

        {resultado.motivos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitulo}>Motivos</Text>
            {resultado.motivos.map((m, i) => (
              <Text key={i} style={styles.motivo}>
                {m.tipo === "temporal" ? "Temporal: " : "No apto: "}
                {m.mensaje}
              </Text>
            ))}
          </View>
        )}

        {!cumple && resultado.reintentarEn && (
          <Text style={styles.parrafo}>
            Podrás volver a completar el formulario a partir del {resultado.reintentarEn}.
          </Text>
        )}

        <TouchableOpacity style={styles.boton} onPress={() => navigation.goBack()}>
          <Text style={styles.botonTexto}>Volver al perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>
        Responde con honestidad. Esta evaluación es preliminar: la decisión final la toma el personal médico
        en el banco de sangre.
      </Text>

      <Text style={styles.subtitulo}>Tipo de sangre</Text>
      <View style={styles.fila}>
        {TIPOS_SANGRE.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, form.tipoSangre === t && styles.chipActivo]}
            onPress={() => cambiar("tipoSangre", t)}
          >
            <Text style={[styles.chipTexto, form.tipoSangre === t && styles.chipTextoActivo]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitulo}>Datos personales</Text>
      <SelectorFecha valor={form.fechaNacimiento} onChange={(v) => cambiar("fechaNacimiento", v)} />
      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        value={form.pesoKg}
        onChangeText={(v) => cambiar("pesoKg", v)}
        placeholder="70"
        keyboardType="decimal-pad"
      />
      <Text style={styles.label}>Sexo</Text>
      <View style={styles.fila}>
        {(["F", "M"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, form.sexo === s && styles.chipActivo]}
            onPress={() => cambiar("sexo", s)}
          >
            <Text style={[styles.chipTexto, form.sexo === s && styles.chipTextoActivo]}>
              {s === "F" ? "Mujer" : "Hombre"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitulo}>Historial de donación</Text>
      <Text style={styles.label}>Fecha de tu última donación (opcional, AAAA-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={form.fechaUltimaDonacion}
        onChangeText={(v) => cambiar("fechaUltimaDonacion", v)}
        placeholder="Déjalo vacío si nunca has donado"
        keyboardType="numbers-and-punctuation"
      />

      <Text style={styles.subtitulo}>Situación actual</Text>
      {form.sexo === "F" && (
        <Fila
          texto="Estás embarazada o en periodo de lactancia"
          valor={form.embarazoOLactancia}
          onChange={(v) => cambiar("embarazoOLactancia", v)}
        />
      )}
      <Fila
        texto="Te hiciste un tatuaje o piercing en los últimos meses"
        valor={form.tatuajeOPiercingReciente}
        onChange={(v) => cambiar("tatuajeOPiercingReciente", v)}
      />
      <Fila
        texto="Tomaste antibióticos recientemente"
        valor={form.antibioticosRecientes}
        onChange={(v) => cambiar("antibioticosRecientes", v)}
      />
      <Fila
        texto="Tienes fiebre o síntomas de gripa hoy"
        valor={form.fiebreHoy}
        onChange={(v) => cambiar("fiebreHoy", v)}
      />

      <Text style={styles.subtitulo}>Condiciones de salud</Text>
      {CONDICIONES.map((c) => (
        <Fila
          key={c.clave}
          texto={c.texto}
          valor={form.condiciones[c.clave]}
          onChange={(v) => cambiarCondicion(c.clave, v)}
        />
      ))}

      <TouchableOpacity
        style={[styles.boton, enviando && styles.botonDeshabilitado]}
        onPress={handleEnviar}
        disabled={enviando}
      >
        <Text style={styles.botonTexto}>{enviando ? "Enviando..." : "Enviar formulario"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Fila({ texto, valor, onChange }: { texto: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.filaSwitch}>
      <Text style={styles.textoFila}>{texto}</Text>
      <Switch value={valor} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.background, paddingBottom: 40 },
  intro: { fontSize: 13, color: colors.textLight, marginBottom: 8, lineHeight: 18 },
  subtitulo: { fontSize: 15, fontWeight: "bold", color: colors.text, marginTop: 20, marginBottom: 8 },
  label: { fontSize: 13, color: colors.textLight, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  fila: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { color: colors.text, fontSize: 14 },
  chipTextoActivo: { color: colors.white, fontWeight: "600" },
  filaSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  textoFila: { flex: 1, fontSize: 14, color: colors.text },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: colors.white, fontWeight: "600", fontSize: 16 },
  badge: { borderRadius: 10, padding: 14, marginBottom: 16 },
  badgeTexto: { fontWeight: "bold", fontSize: 16 },
  parrafo: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12 },
  motivo: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
});
