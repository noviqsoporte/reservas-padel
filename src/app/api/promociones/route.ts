import { NextRequest, NextResponse } from 'next/server'
import { getPromociones, getPromocionesActivas, crearPromocion } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const soloActivas = req.nextUrl.searchParams.get('activas') === 'true'
    const promociones = soloActivas ? await getPromocionesActivas() : await getPromociones()
    return NextResponse.json({ promociones })
  } catch (error) {
    console.error('[GET /api/promociones]', error)
    return NextResponse.json({ error: 'Error al obtener promociones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, descripcion, descuento, activa, imagen_url, tipo } = body

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }
    const tipoFinal = tipo || 'descuento'
    if (tipoFinal === 'quinta_gratis') {
      return NextResponse.json(
        { error: "El tipo de promoción 'quinta_gratis' no se puede crear manualmente." },
        { status: 400 }
      )
    }
    const sinDescuento = tipoFinal === '2x1_2horas' || tipoFinal === 'quinta_gratis'
    if (!sinDescuento && (typeof descuento !== 'number' || descuento < 0 || descuento > 100)) {
      return NextResponse.json({ error: 'El descuento debe ser un número entre 0 y 100' }, { status: 400 })
    }

    const promocion = await crearPromocion({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || '',
      descuento: sinDescuento ? 100 : descuento,
      activa: activa ?? true,
      imagen_url: imagen_url || undefined,
      tipo: tipoFinal,
    })

    return NextResponse.json({ promocion }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/promociones]', error)
    return NextResponse.json({ error: 'Error al crear promoción' }, { status: 500 })
  }
}
