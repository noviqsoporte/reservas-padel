import { NextResponse } from 'next/server'
import { eliminarFotoGaleria } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await eliminarFotoGaleria(params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in DELETE /api/galeria/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
