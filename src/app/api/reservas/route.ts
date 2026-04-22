import { NextResponse } from 'next/server';
import { getReservas, crearReserva, getCancha } from '@/lib/db';
import { Reserva } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { enviarConfirmacionReserva } from '@/lib/email';

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
            email,
            metodo_pago,
        } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const profile_id = user?.id || body.profile_id || null;

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

        const id_reserva = `RES-${Date.now()}`;

        const monto = body.monto || 0;

        const nuevaReservaData: Omit<Reserva, 'id'> = {
            cancha_id,
            fecha,
            hora_inicio,
            hora_fin,
            nombre_cliente,
            telefono,
            email,
            estado: metodo_pago === 'online' ? 'Pendiente' : 'Confirmada',
            notas: body.notas || '',
            id_reserva,
            ...(profile_id ? { profile_id } : {}),
            ...(metodo_pago ? { metodo_pago } : {}),
            pago_estado: metodo_pago === 'online' ? 'pendiente' : 'pendiente',
            ...(metodo_pago !== 'online' && monto > 0 ? { monto_pagado: monto } : {}),
        };

        const reserva = await crearReserva(nuevaReservaData);

        if (nuevaReservaData.metodo_pago !== 'online') {
          try {
            const cancha = await getCancha(cancha_id)
            const duracionMin = body.duracion
            const duracionLabel = duracionMin ? `${duracionMin / 60}h` : `${hora_inicio}–${hora_fin}`
            await enviarConfirmacionReserva({
              email: nuevaReservaData.email,
              nombre: nuevaReservaData.nombre_cliente,
              cancha: cancha?.nombre ?? cancha_id,
              fecha: nuevaReservaData.fecha,
              hora_inicio: nuevaReservaData.hora_inicio,
              hora_fin: nuevaReservaData.hora_fin,
              duracion: duracionLabel,
              monto: monto || cancha?.precio || 0,
              metodo_pago: nuevaReservaData.metodo_pago ?? 'efectivo',
              id_reserva,
            })
          } catch (emailError) {
            console.error('Error enviando email de confirmación:', emailError)
          }
        }

        return NextResponse.json({ reserva }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/reservas:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
