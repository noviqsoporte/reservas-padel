import { NextRequest, NextResponse } from 'next/server'
import { actualizarClase, eliminarClase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const clase = await actualizarClase(params.id, body)
    return NextResponse.json({ clase })
  } catch (error) {
    console.error('[PUT /api/clases/[id]]', error)
    return NextResponse.json({ error: 'Error al actualizar clase' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await eliminarClase(params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/clases/[id]]', error)
    return NextResponse.json({ error: 'Error al eliminar clase' }, { status: 500 })
  }
}
