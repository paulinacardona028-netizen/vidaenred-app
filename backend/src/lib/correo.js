// Envío de correos transaccionales (código de recuperación de contraseña).
// Usa la API HTTP de Resend (https://resend.com). Requiere dos variables de entorno:
//   RESEND_API_KEY  clave de API de Resend
//   MAIL_FROM       remitente verificado, por ejemplo "VidaEnRed <no-reply@tudominio.com>"
// Sin esas variables: en desarrollo el código se muestra en la consola; en producción
// se registra un error (sin revelar el código) para que el despliegue se corrija.

export async function enviarCodigoRecuperacion(correo, codigo) {
  const { RESEND_API_KEY, MAIL_FROM, NODE_ENV } = process.env;

  if (!RESEND_API_KEY || !MAIL_FROM) {
    if (NODE_ENV !== "production") {
      console.log(`[DEV] Código de recuperación para ${correo}: ${codigo}`);
    } else {
      console.error("Correo no configurado: define RESEND_API_KEY y MAIL_FROM en producción.");
    }
    return false;
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [correo],
        subject: "Código para restablecer tu contraseña - VidaEnRed",
        html: `<p>Tu código para restablecer la contraseña es <strong>${codigo}</strong>.</p>
<p>Vence en 30 minutos. Si no lo solicitaste, puedes ignorar este mensaje.</p>`,
      }),
    });
    if (!respuesta.ok) {
      console.error(`Resend respondió ${respuesta.status} al enviar el código de recuperación.`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("No se pudo conectar con el servicio de correo:", err.message);
    return false;
  }
}
