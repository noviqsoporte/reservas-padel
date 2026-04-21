import { stripe } from '@/lib/stripe'
import { getReservaById } from '@/lib/db'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ session_id?: string; reserva_id?: string }>
}

export default async function ReservaConfirmadaPage({ searchParams }: Props) {
  const { session_id, reserva_id } = await searchParams

  if (!session_id || !reserva_id) {
    return <ErrorView message="Enlace inválido o incompleto." />
  }

  let pagado = false
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    pagado = session.payment_status === 'paid'
  } catch {
    return <ErrorView message="No se pudo verificar el pago." />
  }

  if (!pagado) {
    return <ErrorView message="El pago no se completó o fue cancelado." />
  }

  const reserva = await getReservaById(reserva_id)
  if (!reserva) {
    return <ErrorView message="No se encontró la reserva asociada." />
  }

  let fechaFormateada = reserva.fecha
  try {
    fechaFormateada = format(new Date(reserva.fecha + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })
  } catch { /* keep raw date */ }

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-[#0f172a] mb-2">¡Tu reserva está confirmada!</h1>
        <p className="text-[#64748b] mb-8">Pago recibido. Te esperamos en la cancha.</p>

        <div className="bg-[#f8f9fa] rounded-xl border border-[#e2e8f0] p-6 text-left space-y-3 mb-8">
          {reserva.cancha_nombre && (
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Cancha</span>
              <span className="font-semibold text-[#0f172a]">{reserva.cancha_nombre}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Fecha</span>
            <span className="font-semibold text-[#0f172a] capitalize">{fechaFormateada}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Horario</span>
            <span className="font-semibold text-[#0f172a]">{reserva.hora_inicio} – {reserva.hora_fin}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#64748b]">Titular</span>
            <span className="font-semibold text-[#0f172a]">{reserva.nombre_cliente}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/mis-reservas"
            className="w-full py-3 rounded-xl bg-[#0057FF] text-white font-semibold hover:bg-[#0041cc] transition-colors"
          >
            Ver mis reservas
          </Link>
          <Link
            href="/"
            className="w-full py-3 rounded-xl border border-[#e2e8f0] text-[#64748b] font-medium hover:bg-[#f8f9fa] transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}

function ErrorView({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Pago no completado</h1>
        <p className="text-[#64748b] mb-8">{message}</p>
        <Link
          href="/"
          className="w-full inline-block py-3 rounded-xl bg-[#0057FF] text-white font-semibold hover:bg-[#0041cc] transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
