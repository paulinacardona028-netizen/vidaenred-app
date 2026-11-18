// Ciudades válidas para registrarse y para filtrar entidades aliadas.
// Es la lista de referencia; la app la obtiene de GET /api/ciudades.
export const CIUDADES = [
  "Medellín", "Envigado", "Bello", "Itagüí", "Sabaneta", "Rionegro", "Apartadó", "Turbo",
  "Bogotá", "Cali", "Barranquilla", "Cartagena", "Soledad", "Santa Marta",
  "Bucaramanga", "Cúcuta", "Pereira", "Manizales", "Armenia", "Ibagué",
  "Villavicencio", "Pasto", "Neiva", "Montería", "Sincelejo", "Valledupar",
  "Riohacha", "Tunja", "Popayán", "Quibdó", "Florencia", "Yopal", "Mocoa",
  "Arauca", "Leticia", "San Andrés", "Inírida", "Mitú", "Puerto Carreño",
  "San José del Guaviare",
];

// Compara nombres sin importar mayúsculas ni tildes: "Medellin" = "Medellín"
export function normalizarCiudad(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function ciudadValida(texto) {
  const buscada = normalizarCiudad(texto);
  return CIUDADES.some((c) => normalizarCiudad(c) === buscada);
}

// Devuelve el nombre oficial de la lista (con tildes), o null si no existe
export function ciudadCanonica(texto) {
  const buscada = normalizarCiudad(texto);
  return CIUDADES.find((c) => normalizarCiudad(c) === buscada) ?? null;
}
