import { NextRequest, NextResponse } from 'next/server'
import { getInscripcionesByClase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const inscripciones = await getInscripcionesByClase(params.id)
    return NextResponse.json({ inscripciones })
  } catch (error) {
    console.error('[GET /api/clases/[id]/inscripciones]', error)
    return NextResponse.json({ error: 'Error al obtener inscripciones' }, { status: 500 })
  }
}
