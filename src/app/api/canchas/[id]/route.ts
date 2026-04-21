import { NextResponse } from 'next/server';
import { getCancha, actualizarCancha } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const cancha = await getCancha(id);

        if (!cancha) {
            return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 });
        }

        return NextResponse.json({ cancha });
    } catch (error) {
        console.error(`Error in GET /api/canchas/${params.id}:`, error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const cancha = await getCancha(id);
        if (!cancha) {
            return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 });
        }

        const canchaActualizada = await actualizarCancha(id, body);
        return NextResponse.json({ cancha: canchaActualizada });
    } catch (error) {
        console.error(`Error in PATCH /api/canchas/${params.id}:`, error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
