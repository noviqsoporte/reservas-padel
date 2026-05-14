import { NextRequest, NextResponse } from 'next/server'
import { getClases, getClasesActivas, crearClase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const soloActivas = req.nextUrl.searchParams.get('activas') === 'true'
    const fecha = req.nextUrl.searchParams.get('fecha') ?? undefined
    const clases = soloActivas ? await getClasesActivas(fecha) : await getClases(fecha)
    return NextResponse.json({ clases })
  } catch (error) {
    console.error('[GET /api/clases]', error)
    return NextResponse.json({ error: 'Error al obtener clases' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, descripcion, instructor, fecha, hora_inicio, hora_fin, cupo_maximo, precio, activa } = body

    if (!titulo?.trim()) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 })
    }
    if (!fecha || !hora_inicio || !hora_fin) {
      return NextResponse.json({ error: 'Fecha y horario son obligatorios' }, { status: 400 })
    }
    if (!cupo_maximo || cupo_maximo < 1) {
      return NextResponse.json({ error: 'El cupo máximo debe ser mayor a 0' }, { status: 400 })
    }

    const clase = await crearClase({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || '',
      instructor: instructor?.trim() || '',
      fecha,
      hora_inicio,
      hora_fin,
      cupo_maximo,
      cupo_disponible: cupo_maximo,
      precio: precio ?? 0,
      activa: activa ?? true,
    })

    return NextResponse.json({ clase }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clases]', error)
    return NextResponse.json({ error: 'Error al crear clase' }, { status: 500 })
  }
}
