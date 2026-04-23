import { NextRequest, NextResponse } from 'next/server'
import { getPromociones, crearPromocion } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const promociones = await getPromociones()
    return NextResponse.json({ promociones })
  } catch (error) {
    console.error('[GET /api/promociones]', error)
    return NextResponse.json({ error: 'Error al obtener promociones' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, descripcion, descuento, activa, imagen_url, fecha_inicio, fecha_fin } = body

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }
    if (typeof descuento !== 'number' || descuento < 0 || descuento > 100) {
      return NextResponse.json({ error: 'El descuento debe ser un número entre 0 y 100' }, { status: 400 })
    }

    const promocion = await crearPromocion({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || '',
      descuento,
      activa: activa ?? true,
      imagen_url: imagen_url || undefined,
      fecha_inicio: fecha_inicio || undefined,
      fecha_fin: fecha_fin || undefined,
    })

    return NextResponse.json({ promocion }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/promociones]', error)
    return NextResponse.json({ error: 'Error al crear promoción' }, { status: 500 })
  }
}
