import { NextRequest, NextResponse } from 'next/server'
import { reservarClase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { nombre_cliente, email, telefono, profile_id } = body

    if (!nombre_cliente || !email) {
      return NextResponse.json({ error: 'nombre_cliente y email son requeridos' }, { status: 400 })
    }

    await reservarClase(params.id, { nombre_cliente, email, telefono, profile_id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al reservar clase'
    const status = message.includes('sin cupo') || message.includes('Ya estás inscrito') ? 409 : 500
    console.error('[POST /api/clases/[id]/reservar]', error)
    return NextResponse.json({ error: message }, { status })
  }
}
