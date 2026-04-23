import { NextResponse } from 'next/server';
import { actualizarReserva, cancelarReserva, getReservaById } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        // Solo permite cancelar la propia reserva del cliente autenticado
        if (body.estado === 'Cancelada') {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }

            const reserva = await getReservaById(id);
            if (!reserva) {
                return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
            }

            const perteneceAlUsuario =
                reserva.profile_id === user.id ||
                reserva.email?.toLowerCase() === user.email?.toLowerCase();

            if (!perteneceAlUsuario) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
            }

            const reservaActualizada = await actualizarReserva(id, { estado: 'Cancelada' });
            return NextResponse.json({ reserva: reservaActualizada });
        }

        return NextResponse.json({ error: 'Operación no permitida' }, { status: 403 });
    } catch (error) {
        console.error(`Error in PUT /api/reservas/${params.id}:`, error);
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
