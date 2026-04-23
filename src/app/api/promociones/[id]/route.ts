import { NextRequest, NextResponse } from 'next/server'
import { actualizarPromocion, eliminarPromocion } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { titulo, descripcion, descuento, activa, imagen_url, fecha_inicio, fecha_fin } = body

    if (titulo !== undefined && !titulo.trim()) {
      return NextResponse.json({ error: 'El título no puede estar vacío' }, { status: 400 })
    }
    if (descuento !== undefined && (typeof descuento !== 'number' || descuento < 0 || descuento > 100)) {
      return NextResponse.json({ error: 'El descuento debe ser entre 0 y 100' }, { status: 400 })
    }

    const promocion = await actualizarPromocion(params.id, {
      ...(titulo !== undefined && { titulo: titulo.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(descuento !== undefined && { descuento }),
      ...(activa !== undefined && { activa }),
      ...(imagen_url !== undefined && { imagen_url }),
      ...(fecha_inicio !== undefined && { fecha_inicio }),
      ...(fecha_fin !== undefined && { fecha_fin }),
    })

    return NextResponse.json({ promocion })
  } catch (error) {
    console.error('[PUT /api/promociones/[id]]', error)
    return NextResponse.json({ error: 'Error al actualizar promoción' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await eliminarPromocion(params.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/promociones/[id]]', error)
    return NextResponse.json({ error: 'Error al eliminar promoción' }, { status: 500 })
  }
}
