import { NextResponse } from 'next/server';
import { getBloqueos, crearBloqueo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const bloqueos = await getBloqueos();
        return NextResponse.json({ bloqueos });
    } catch (error) {
        console.error('Error in GET /api/bloqueos:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { cancha_id, motivo, fecha_inicio, fecha_fin } = body;

        if (!cancha_id || !motivo || !fecha_inicio || !fecha_fin) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const bloqueo = await crearBloqueo({
            cancha_id,
            motivo,
            fecha_inicio,
            fecha_fin
        });

        return NextResponse.json({ bloqueo }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/bloqueos:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
