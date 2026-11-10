import { query } from "../db.js";
import { tiposCompatiblesCon } from "./reglas.js";

// Guarda una notificación para un donante. Las notificaciones son dentro de la app;
// las notificaciones push requieren un servicio externo (pendiente).
export async function notificar(donanteId, tipo, mensaje, solicitudId = null) {
  await query(
    `INSERT INTO notificaciones (donante_id, tipo, mensaje, solicitud_id)
     VALUES ($1, $2, $3, $4)`,
    [donanteId, tipo, mensaje, solicitudId]
  );
}

// Avisa a los donantes disponibles cuyo tipo de sangre es compatible con la solicitud
export async function notificarDonantesCompatibles(solicitud, hospital) {
  const { rows } = await query(
    `SELECT id, tipo_sangre FROM donantes
     WHERE es_donante = TRUE AND disponible = TRUE AND id <> $1`,
    [solicitud.solicitante_id]
  );
  const destinatarios = rows.filter((d) =>
    tiposCompatiblesCon(d.tipo_sangre).includes(solicitud.tipo_sangre)
  );
  for (const d of destinatarios) {
    await notificar(
      d.id,
      "solicitud_compatible",
      `Nueva solicitud ${solicitud.urgencia.toLowerCase()} de ${solicitud.tipo_sangre} en ${hospital}.`,
      solicitud.id
    );
  }
}
