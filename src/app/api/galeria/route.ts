import { NextResponse } from 'next/server'
import { getGaleria, agregarFotoGaleria } from '@/lib/db'

export const dynamic = 'force-dynamic'

const MAX_FOTOS = 8

export async function GET() {
  try {
    const fotos = await getGaleria()
    return NextResponse.json({ fotos })
  } catch (error) {
    console.error('Error in GET /api/galeria:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.imagen_url) {
      return NextResponse.json({ error: 'imagen_url es requerido' }, { status: 400 })
    }

    const existentes = await getGaleria()
    if (existentes.length >= MAX_FOTOS) {
      return NextResponse.json({ error: `Máximo ${MAX_FOTOS} fotos permitidas` }, { status: 400 })
    }

    const foto = await agregarFotoGaleria(body.imagen_url)
    return NextResponse.json({ foto }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/galeria:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
