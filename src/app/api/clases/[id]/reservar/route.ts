import { NextRequest, NextResponse } from 'next/server'
import { reservarClase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await reservarClase(params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al reservar clase'
    const status = message.includes('sin cupo') ? 409 : 500
    console.error('[POST /api/clases/[id]/reservar]', error)
    return NextResponse.json({ error: message }, { status })
  }
}
