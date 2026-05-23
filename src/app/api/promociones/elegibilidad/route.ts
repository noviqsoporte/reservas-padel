import { NextRequest, NextResponse } from 'next/server'
import { contarReservasCompletadas } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const telefono = req.nextUrl.searchParams.get('telefono') || ''

  if (!telefono) {
    return NextResponse.json({ completadas: 0, elegible: false })
  }

  try {
    const completadas = await contarReservasCompletadas(telefono)
    const elegible = completadas > 0 && completadas % 5 === 4
    return NextResponse.json({ completadas, elegible })
  } catch (error) {
    console.error('[GET /api/promociones/elegibilidad]', error)
    return NextResponse.json({ completadas: 0, elegible: false })
  }
}
