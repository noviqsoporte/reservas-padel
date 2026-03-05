import { NextResponse } from 'next/server';
import { getReservas, crearReserva } from '@/lib/airtable';
import { Reserva } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fecha = searchParams.get('fecha') || undefined;

        const reservas = await getReservas(fecha);
        return NextResponse.json({ reservas });
    } catch (error) {
        console.error('Error in GET /api/reservas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            cancha_id,
            fecha,
            hora_inicio,
            hora_fin,
            nombre_cliente,
            telefono,
            email
        } = body;

        if (!cancha_id || !fecha || !hora_inicio || !hora_fin || !nombre_cliente || !telefono || !email) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const reservasDelDia = await getReservas(fecha);

        // Check disponibilidad
        const isOccupied = reservasDelDia.some(reserva => {
            return reserva.cancha_id === cancha_id &&
                reserva.estado !== 'Cancelada' &&
                reserva.hora_inicio < hora_fin &&
                reserva.hora_fin > hora_inicio;
        });

        if (isOccupied) {
            return NextResponse.json({ error: 'El horario ya no está disponible' }, { status: 409 });
        }

        const nuevaReservaData: Omit<Reserva, 'id'> = {
            cancha_id,
            fecha,
            hora_inicio,
            hora_fin,
            nombre_cliente,
            telefono,
            email,
            estado: 'Confirmada',
            notas: body.notas || ''
        };

        const reserva = await crearReserva(nuevaReservaData);

        return NextResponse.json({ reserva }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/reservas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
