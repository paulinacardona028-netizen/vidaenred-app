import { Linking } from "react-native";

// Abre Google Maps con la ruta hasta la ubicación. Si no hay coordenadas,
// busca el nombre del lugar.
export function abrirEnGoogleMaps(
  nombre: string,
  latitud: number | null,
  longitud: number | null,
  ciudad?: string
) {
  // Con coordenadas la ruta es exacta; sin ellas se busca nombre + ciudad para no mezclar sedes
  const busqueda = [nombre, ciudad, "Colombia"].filter(Boolean).join(", ");
  const url =
    latitud !== null && longitud !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;
  return Linking.openURL(url);
}

export function llamar(telefono: string) {
  return Linking.openURL(`tel:${telefono.replace(/\s/g, "")}`);
}
