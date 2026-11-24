
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  MainTabParamList,
  RootStackParamList,
} from "../types/navigation";
import { useApp } from "../context/AppContext";
import { ApiError, api } from "../services/api";
import {
  Entidad,
  NivelUrgencia,
  TIPOS_SANGRE,
  TipoSangre,
} from "../types/models";
import { colors } from "../styles/colors";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CrearSolicitud">,
  NativeStackScreenProps<RootStackParamList>
>;

const NIVELES_URGENCIA: NivelUrgencia[] = [
  "Alta",
  "Moderada",
  "Programada",
];

type SelectorActivo =
  | "entidad"
  | "sangre"
  | "urgencia"
  | null;

type CampoProps = {
  label: string;
  valor: string;
  icono: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  placeholder?: boolean;
};

function CampoSelector({
  label,
  valor,
  icono,
  onPress,
  placeholder,
}: CampoProps) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconBox}>
          <Ionicons
            name={icono}
            size={21}
            color={colors.primary}
          />
        </View>

        <Text
          style={[
            styles.selectorTexto,
            placeholder && styles.placeholder,
          ]}
        >
          {valor}
        </Text>

        <Ionicons
          name={
            onPress
              ? "chevron-down-outline"
              : "lock-closed-outline"
          }
          size={18}
          color={colors.textLight}
        />
      </TouchableOpacity>
    </View>
  );
}

export function CrearSolicitudScreen({
  navigation,
}: Props) {
  const { donante, crearSolicitud } = useApp();

  const [entidades, setEntidades] =
    useState<Entidad[]>([]);

  const [entidadId, setEntidadId] =
    useState<string | null>(null);

  const [hospitalTexto, setHospitalTexto] =
    useState("");

  const [tipoSangre, setTipoSangre] =
    useState<TipoSangre>(
      donante?.tipoSangre ?? "O+"
    );

  const [urgencia, setUrgencia] =
    useState<NivelUrgencia>("Alta");

  const [contactoTelefono, setContactoTelefono] =
    useState("");

  const [publicando, setPublicando] =
    useState(false);

  const [cargandoEntidades, setCargandoEntidades] =
    useState(false);

  const [errorEntidades, setErrorEntidades] =
    useState(false);

  const [otroHospital, setOtroHospital] =
    useState(false);

  const [selectorActivo, setSelectorActivo] =
    useState<SelectorActivo>(null);

  useEffect(() => {
    if (!donante?.ciudad) return;

    let activo = true;

    setCargandoEntidades(true);
    setErrorEntidades(false);
    setEntidades([]);
    setEntidadId(null);

    api
      .listarEntidades({
        ciudad: donante.ciudad,
        incluirNoAliadas: true,
      })
      .then((datos) => {
        if (activo) setEntidades(datos);
      })
      .catch(() => {
        if (activo) {
          setEntidades([]);
          setErrorEntidades(true);
        }
      })
      .finally(() => {
        if (activo) setCargandoEntidades(false);
      });

    return () => {
      activo = false;
    };
  }, [donante?.ciudad]);

  const entidadSeleccionada = entidades.find(
    (e) => e.id === entidadId
  );

  if (!donante) {
    return (
      <View style={styles.bloqueado}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.ayuda}>
          Cargando tu información...
        </Text>
      </View>
    );
  }

  if (!donante.esSolicitante) {
    return (
      <View style={styles.bloqueado}>
        <View style={styles.bloqueadoIcono}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={colors.primary}
          />
        </View>

        <Text style={styles.bloqueadoTitulo}>
          Activa el modo solicitante
        </Text>

        <Text style={styles.bloqueadoTexto}>
          Para publicar solicitudes activa el rol
          "Necesito sangre" en tu perfil.
        </Text>

        <TouchableOpacity
          style={styles.boton}
          onPress={() =>
            navigation.navigate("Perfil")
          }
        >
          <Text style={styles.botonTexto}>
            Ir a mi perfil
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handlePublicar() {
    if (publicando) return;

    const hospital = hospitalTexto.trim();

    if (!entidadId && !hospital) {
      Alert.alert(
        "Falta información",
        "Selecciona una entidad médica o escribe el nombre del hospital."
      );

      return;
    }

    setPublicando(true);

    try {
      await crearSolicitud({
        tipoSangre,
        urgencia,
        entidadId: entidadId ?? undefined,
        hospital: entidadId ? undefined : hospital,
        contactoTelefono:
          contactoTelefono.trim() || undefined,
      });

      Alert.alert(
        "Solicitud publicada",
        "Avisamos a los donantes compatibles cercanos."
      );

      setEntidadId(null);
      setHospitalTexto("");
      setContactoTelefono("");
      setOtroHospital(false);
      setUrgencia("Alta");

      navigation.navigate("InicioTab", {
        screen: "Inicio",
      });
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof ApiError
          ? err.message
          : "No se pudo publicar la solicitud."
      );
    } finally {
      setPublicando(false);
    }
  }

  const tituloSelector =
    selectorActivo === "entidad"
      ? "Selecciona una entidad"
      : selectorActivo === "sangre"
      ? "Grupo sanguíneo requerido"
      : "Nivel de urgencia";

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            SOLICITUD DE SANGRE
          </Text>

          <Text style={styles.title}>
            Cuéntanos qué se necesita
          </Text>

          <Text style={styles.subtitle}>
            Completa los datos para encontrar
            donantes compatibles.
          </Text>
        </View>

        {/* Entidad médica */}
        <CampoSelector
          label="Entidad médica"
          valor={
            otroHospital
              ? "Otra entidad médica"
              : entidadSeleccionada?.nombre ??
                "Seleccionar entidad médica"
          }
          icono="business-outline"
          placeholder={
            !entidadSeleccionada && !otroHospital
          }
          onPress={() =>
            setSelectorActivo("entidad")
          }
        />

        {cargandoEntidades && (
          <View style={styles.loadingRow}>
            <ActivityIndicator
              size="small"
              color={colors.primary}
            />

            <Text style={styles.ayuda}>
              Cargando entidades médicas...
            </Text>
          </View>
        )}

        {errorEntidades && (
          <Text style={styles.ayuda}>
            No se pudieron cargar las entidades.
            Puedes escribir el nombre del hospital.
          </Text>
        )}

        {otroHospital && (
          <View style={styles.campo}>
            <Text style={styles.label}>
              Nombre de la institución
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="business-outline"
                size={21}
                color={colors.primary}
              />

              <TextInput
                style={styles.input}
                value={hospitalTexto}
                onChangeText={setHospitalTexto}
                placeholder="Hospital o banco de sangre"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>
        )}

        {/* Grupo sanguíneo */}
        <CampoSelector
          label="Grupo sanguíneo requerido"
          valor={tipoSangre}
          icono="water-outline"
          onPress={() =>
            setSelectorActivo("sangre")
          }
        />

        {/* Urgencia */}
        <CampoSelector
          label="Nivel de urgencia"
          valor={urgencia}
          icono="time-outline"
          onPress={() =>
            setSelectorActivo("urgencia")
          }
        />

        {/* Ciudad */}
        <CampoSelector
          label="Ciudad"
          valor={donante.ciudad}
          icono="location-outline"
        />

        <Text style={styles.ayuda}>
          Se utiliza la ciudad registrada en tu perfil.
        </Text>

        {/* Contacto */}
        <View style={styles.campo}>
          <Text style={styles.label}>
            Teléfono de contacto (opcional)
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.iconBox}>
              <Ionicons
                name="call-outline"
                size={21}
                color={colors.primary}
              />
            </View>

            <TextInput
              style={styles.input}
              value={contactoTelefono}
              onChangeText={setContactoTelefono}
              placeholder="300 000 0000"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.ayuda}>
            Tu teléfono no se muestra a los donantes
            en la lista de solicitudes.
          </Text>
        </View>

        {/* Aviso de privacidad */}
        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color="#A46B24"
          />

          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Protegemos la privacidad
            </Text>

            <Text style={styles.noticeText}>
              No incluyas nombres de pacientes
              ni información médica personal.
            </Text>
          </View>
        </View>

        {/* Publicar */}
        <TouchableOpacity
          style={[
            styles.boton,
            publicando && styles.botonDeshabilitado,
          ]}
          onPress={handlePublicar}
          disabled={publicando}
        >
          {publicando ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Ionicons
              name="send-outline"
              size={21}
              color={colors.white}
            />
          )}

          <Text style={styles.botonTexto}>
            {publicando
              ? "Publicando..."
              : "Publicar solicitud"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          JUNTOS HACEMOS LA DIFERENCIA
        </Text>
      </ScrollView>

      {/* Selectores desplegables */}
      <Modal
        visible={selectorActivo !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectorActivo(null)
        }
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() =>
              setSelectorActivo(null)
            }
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tituloSelector}
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setSelectorActivo(null)
                }
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              {/* Entidades */}
              {selectorActivo === "entidad" && (
                <>
                  {entidades.map((e) => (
                    <TouchableOpacity
                      key={e.id}
                      style={[
                        styles.option,
                        entidadId === e.id &&
                          styles.optionActive,
                      ]}
                      onPress={() => {
                        setEntidadId(e.id);
                        setHospitalTexto("");
                        setOtroHospital(false);
                        setSelectorActivo(null);
                      }}
                    >
                      <View style={styles.iconBox}>
                        <Ionicons
                          name="business-outline"
                          size={22}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.optionContent}>
                        <Text style={styles.optionText}>
                          {e.nombre}
                        </Text>

                        <Text style={styles.ayuda}>
                          {e.tipo} · {e.ciudad}
                        </Text>
                      </View>

                      {entidadId === e.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={23}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}

                  {entidades.length === 0 && (
                    <Text style={styles.emptyText}>
                      {cargandoEntidades
                        ? "Cargando entidades..."
                        : "No hay entidades disponibles en la lista."}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => {
                      setEntidadId(null);
                      setOtroHospital(true);
                      setSelectorActivo(null);
                    }}
                  >
                    <View style={styles.iconBox}>
                      <Ionicons
                        name="add-circle-outline"
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.optionContent}>
                      <Text style={styles.optionText}>
                        Otra entidad médica
                      </Text>

                      <Text style={styles.ayuda}>
                        Escribir el nombre manualmente
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}

              {/* Tipos de sangre */}
              {selectorActivo === "sangre" && (
                <View style={styles.bloodGrid}>
                  {TIPOS_SANGRE.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.bloodOption,
                        tipoSangre === t &&
                          styles.bloodOptionActive,
                      ]}
                      onPress={() => {
                        setTipoSangre(t);
                        setSelectorActivo(null);
                      }}
                    >
                      <Ionicons
                        name="water"
                        size={24}
                        color={
                          tipoSangre === t
                            ? colors.white
                            : colors.primary
                        }
                      />

                      <Text
                        style={[
                          styles.bloodOptionText,
                          tipoSangre === t &&
                            styles.bloodOptionTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Urgencia */}
              {selectorActivo === "urgencia" &&
                NIVELES_URGENCIA.map((nivel) => (
                  <TouchableOpacity
                    key={nivel}
                    style={[
                      styles.option,
                      urgencia === nivel &&
                        styles.optionActive,
                    ]}
                    onPress={() => {
                      setUrgencia(nivel);
                      setSelectorActivo(null);
                    }}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor:
                            nivel === "Alta"
                              ? colors.urgent
                              : nivel === "Moderada"
                              ? "#FFF2E2"
                              : "#E4F3E6",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          nivel === "Alta"
                            ? "alert-circle-outline"
                            : nivel === "Moderada"
                            ? "time-outline"
                            : "calendar-outline"
                        }
                        size={24}
                        color={
                          nivel === "Alta"
                            ? colors.primary
                            : nivel === "Moderada"
                            ? "#A46B24"
                            : colors.success
                        }
                      />
                    </View>

                    <View style={styles.optionContent}>
                      <Text style={styles.optionText}>
                        {nivel}
                      </Text>

                      <Text style={styles.ayuda}>
                        {nivel === "Alta"
                          ? "Necesidad urgente"
                          : nivel === "Moderada"
                          ? "Necesidad próxima"
                          : "Donación planificada"}
                      </Text>
                    </View>

                    {urgencia === nivel && (
                      <Ionicons
                        name="checkmark-circle"
                        size={23}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 17,
  },

  header: {
    gap: 9,
    marginBottom: 5,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 29,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textLight,
  },

  campo: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },

  selector: {
    minHeight: 64,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  selectorTexto: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },

  placeholder: {
    color: colors.textLight,
    fontWeight: "400",
  },

  iconBox: {
    width: 41,
    height: 41,
    borderRadius: 12,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  inputContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 11,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 8,
  },

  ayuda: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  notice: {
    backgroundColor: "#FFF2E2",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },

  noticeContent: {
    flex: 1,
    gap: 5,
  },

  noticeTitle: {
    color: "#94611F",
    fontSize: 13,
    fontWeight: "800",
  },

  noticeText: {
    color: "#94611F",
    fontSize: 13,
    lineHeight: 20,
  },

  boton: {
    backgroundColor: colors.primary,
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 5,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  botonTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },

  footer: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: colors.textLight,
    textAlign: "center",
    marginTop: 12,
  },

  bloqueado: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 17,
  },

  bloqueadoIcono: {
    width: 95,
    height: 95,
    borderRadius: 30,
    backgroundColor: colors.urgent,
    alignItems: "center",
    justifyContent: "center",
  },

  bloqueadoTitulo: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },

  bloqueadoTexto: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textLight,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    flex: 1,
  },

  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },

  modalTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
  },

  closeButton: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },

  optionActive: {
    backgroundColor: colors.urgent,
    borderColor: colors.primary,
  },

  optionContent: {
    flex: 1,
    gap: 4,
  },

  optionText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    paddingVertical: 20,
  },

  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },

  bloodOption: {
    width: "47%",
    paddingVertical: 19,
    backgroundColor: colors.urgent,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  bloodOptionActive: {
    backgroundColor: colors.primary,
  },

  bloodOptionText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },

  bloodOptionTextActive: {
    color: colors.white,
  },
});
