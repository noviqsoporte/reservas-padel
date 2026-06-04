import { NextRequest, NextResponse } from 'next/server'
import { verificarElegibilidadQuintaGratis } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get('telefono') || ''

  if (!telefono) {
    return NextResponse.json({ completadas: 0, elegible: false })
  }

  try {
    const result = await verificarElegibilidadQuintaGratis(telefono)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/promociones/elegibilidad]', error)
    return NextResponse.json({ completadas: 0, elegible: false })
  }
}
