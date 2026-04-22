import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { actualizarPago, getReservaById, getCancha } from '@/lib/db'
import { enviarConfirmacionReserva } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  console.log('[webhook] recibido evento')
  console.log('[webhook] STRIPE_WEBHOOK_SECRET existe:', !!process.env.STRIPE_WEBHOOK_SECRET)
  console.log('[webhook] secret configurado:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 20))

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  console.log('[webhook] body length:', body.length)
  console.log('[webhook] sig header:', sig?.substring(0, 20))
  console.log('[webhook] stripe-signature presente:', !!sig)

  if (!sig) {
    console.error('[webhook] Error: falta stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
    console.log('[webhook] firma verificada correctamente')
  } catch (err) {
    console.error('[webhook] Error de firma:', err)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[webhook] DEV MODE: procesando sin verificar firma')
      event = JSON.parse(body)
    } else {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  console.log('[webhook] evento tipo:', event.type)
  console.log('[webhook] session metadata:', event.data?.object?.metadata)

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const reserva_id = session.metadata?.reserva_id
      console.log('[webhook] checkout.session.completed - reserva_id:', reserva_id)
      console.log('[webhook] amount_total:', session.amount_total)
      if (reserva_id) {
        await actualizarPago(reserva_id, {
          pago_estado: 'pagado',
          estado: 'Confirmada',
          monto_pagado: session.amount_total ? session.amount_total / 100 : undefined,
        })
        console.log('[webhook] actualizarPago completado para reserva:', reserva_id)

        try {
          const reserva = await getReservaById(reserva_id)
          if (reserva) {
            const cancha = await getCancha(reserva.cancha_id)
            const inicioMin = parseInt(reserva.hora_inicio.split(':')[0]) * 60 + parseInt(reserva.hora_inicio.split(':')[1])
            const finMin = parseInt(reserva.hora_fin.split(':')[0]) * 60 + parseInt(reserva.hora_fin.split(':')[1])
            const duracionLabel = `${(finMin - inicioMin) / 60}h`
            await enviarConfirmacionReserva({
              email: reserva.email,
              nombre: reserva.nombre_cliente,
              cancha: cancha?.nombre ?? reserva.cancha_id,
              fecha: reserva.fecha,
              hora_inicio: reserva.hora_inicio,
              hora_fin: reserva.hora_fin,
              duracion: duracionLabel,
              monto: session.amount_total ? session.amount_total / 100 : (cancha?.precio ?? 0),
              metodo_pago: 'online',
              id_reserva: reserva.id_reserva ?? reserva_id,
            })
          }
        } catch (emailError) {
          console.error('[webhook] Error enviando email de confirmación:', emailError)
        }
      } else {
        console.warn('[webhook] checkout.session.completed sin reserva_id en metadata')
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const reserva_id = session.metadata?.reserva_id
      if (reserva_id) {
        const reserva = await getReservaById(reserva_id)
        if (reserva?.pago_estado === 'pendiente') {
          await actualizarPago(reserva_id, {
            pago_estado: 'fallido',
            estado: 'Cancelada',
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}
