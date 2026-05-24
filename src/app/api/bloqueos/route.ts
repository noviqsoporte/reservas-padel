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
        const { cancha_id, motivo, fecha_inicio, fecha_fin, hora_inicio, hora_fin } = body;

        if (!cancha_id || !motivo || !fecha_inicio || !fecha_fin) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        const tieneHoraInicio = hora_inicio != null && hora_inicio !== '';
        const tieneHoraFin = hora_fin != null && hora_fin !== '';

        if (tieneHoraInicio !== tieneHoraFin) {
            return NextResponse.json(
                { error: 'Debes proporcionar hora_inicio y hora_fin juntos, o ninguno' },
                { status: 400 }
            );
        }

        if (tieneHoraInicio && tieneHoraFin) {
            if (fecha_inicio !== fecha_fin) {
                return NextResponse.json(
                    { error: 'Un bloqueo parcial (con horas) debe tener fecha_inicio igual a fecha_fin' },
                    { status: 400 }
                );
            }
            if (hora_fin <= hora_inicio) {
                return NextResponse.json(
                    { error: 'hora_fin debe ser mayor que hora_inicio' },
                    { status: 400 }
                );
            }
        }

        const bloqueo = await crearBloqueo({
            cancha_id,
            motivo,
            fecha_inicio,
            fecha_fin,
            hora_inicio: tieneHoraInicio ? hora_inicio : null,
            hora_fin: tieneHoraFin ? hora_fin : null,
        });

        return NextResponse.json({ bloqueo }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/bloqueos:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
