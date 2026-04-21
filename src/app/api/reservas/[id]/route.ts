import { NextResponse } from 'next/server';
import { actualizarReserva, cancelarReserva } from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const reserva = await actualizarReserva(id, body);

        return NextResponse.json({ reserva });
    } catch (error) {
        console.error(`Error in PATCH /api/reservas/${params.id}:`, error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        await cancelarReserva(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error in DELETE /api/reservas/${params.id}:`, error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
