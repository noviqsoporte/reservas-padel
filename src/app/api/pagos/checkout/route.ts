import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getReservaById, actualizarPago } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reserva_id, cancha_nombre, fecha, hora_inicio, hora_fin, monto, email, nombre } = body

    if (!reserva_id || !cancha_nombre || !fecha || !hora_inicio || !hora_fin || !monto || !email) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const reserva = await getReservaById(reserva_id)
    if (!reserva) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }
    if (reserva.pago_estado !== 'pendiente') {
      return NextResponse.json({ error: 'Esta reserva no está pendiente de pago' }, { status: 409 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: cancha_nombre,
              description: `${fecha} · ${hora_inicio} – ${hora_fin}`,
            },
            unit_amount: Math.round(monto * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${baseUrl}/reserva/confirmada?session_id={CHECKOUT_SESSION_ID}&reserva_id=${reserva_id}`,
      cancel_url: `${baseUrl}/?cancelado=true`,
      metadata: { reserva_id },
      expires_at: expiresAt,
    })

    await actualizarPago(reserva_id, { stripe_session_id: session.id })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
