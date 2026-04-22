import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface DatosConfirmacion {
  email: string
  nombre: string
  cancha: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion: string
  monto: number
  metodo_pago: 'efectivo' | 'online'
  id_reserva: string
}

export async function enviarConfirmacionReserva(datos: DatosConfirmacion) {
  console.log('[email] enviando a:', datos.email)
  const result = await resend.emails.send({
    from: 'Lood <onboarding@resend.dev>',
    to: datos.email,
    subject: `✅ Reserva confirmada — ${datos.cancha} · ${datos.fecha}`,
    html: generarHTMLConfirmacion(datos),
  })
  console.log('[email] resultado resend:', JSON.stringify(result))
}

function generarHTMLConfirmacion(datos: DatosConfirmacion): string {
  const { nombre, cancha, fecha, hora_inicio, hora_fin, duracion, monto, metodo_pago, id_reserva } = datos

  const montoCOP = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(monto)

  const pagoBanner =
    metodo_pago === 'efectivo'
      ? `<div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:16px 20px;margin:24px 0;color:#713f12;">
           <strong>⚠ Recuerda pagar en el club el día de tu reserva</strong><br>
           <span style="font-size:14px;">El pago se realiza en efectivo directamente en las instalaciones.</span>
         </div>`
      : `<div style="background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:16px 20px;margin:24px 0;color:#14532d;">
           <strong>✓ Pago recibido</strong><br>
           <span style="font-size:14px;">Tu reserva está completamente confirmada.</span>
         </div>`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:#0f1e3c;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:2px;">LOOD</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;letter-spacing:1px;">CLUB DE PÁDEL</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;">

              <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">¡Tu reserva está confirmada!</h2>
              <p style="margin:0 0 28px;color:#6b7280;font-size:15px;">Hola <strong>${nombre}</strong>, aquí están los detalles de tu reserva.</p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Cancha</span><br>
                    <strong style="color:#1f2937;font-size:16px;">${cancha}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Fecha</span><br>
                    <strong style="color:#1f2937;font-size:16px;">${fecha}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Horario</span><br>
                    <strong style="color:#1f2937;font-size:16px;">${hora_inicio} – ${hora_fin}</strong>
                    <span style="color:#6b7280;font-size:14px;margin-left:8px;">(${duracion})</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;background:#f0f7ff;">
                    <span style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Total</span><br>
                    <strong style="color:#2563eb;font-size:20px;">${montoCOP}</strong>
                  </td>
                </tr>
              </table>

              ${pagoBanner}

              <p style="color:#9ca3af;font-size:13px;margin:32px 0 0;text-align:center;">
                ¿Tienes dudas? Contáctanos directamente en el club.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 16px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;font-weight:600;">Lood Club de Pádel</p>
              <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;">ID de reserva: ${id_reserva}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
