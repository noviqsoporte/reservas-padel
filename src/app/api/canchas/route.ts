import { NextResponse } from 'next/server';
import { getCanchas, crearCancha } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const canchas = await getCanchas();
        return NextResponse.json({ canchas });
    } catch (error) {
        console.error('Error in GET /api/canchas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.nombre) {
            return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const nuevaCancha = await crearCancha({
            nombre: body.nombre,
            descripcion: body.descripcion || '',
            foto_url: body.foto_url || '',
            activa: typeof body.activa === 'boolean' ? body.activa : true,
            precio: typeof body.precio === 'number' ? body.precio : 0,
            color: body.color || '#1e3a5f',
        });

        return NextResponse.json({ cancha: nuevaCancha }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/canchas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
