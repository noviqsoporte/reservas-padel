import { NextResponse } from 'next/server';
import { getConfig, getReservas, getBloqueos } from '@/lib/airtable';
import { generarSlots } from '@/lib/slots';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cancha_id = searchParams.get('cancha_id');
        const fecha = searchParams.get('fecha');

        if (!cancha_id || !fecha) {
            return NextResponse.json(
                { error: 'Se requiere cancha_id y fecha' },
                { status: 400 }
            );
        }

        const config = await getConfig();
        const reservasDelDia = await getReservas(fecha);
        const todosLosBloqueos = await getBloqueos();

        // Filtrar bloqueos para la fecha actual
        // Asumimos bloqueos que cubren esta fecha (cruce de rangos) o sin especificar hora
        const bloqueosDelDia = todosLosBloqueos.filter(b => {
            // Simplificado: filtramos los que coincidan o engloben la fecha solicitada
            if (b.fecha_inicio.startsWith(fecha) || b.fecha_fin.startsWith(fecha)) {
                return true;
            }

            const paramDate = new Date(fecha).getTime();
            const startB = new Date(b.fecha_inicio.split('T')[0]).getTime();
            const endB = new Date(b.fecha_fin.split('T')[0]).getTime();

            if (!isNaN(startB) && !isNaN(endB) && paramDate >= startB && paramDate <= endB) {
                return true;
            }

            return false;
        });

        const slots = generarSlots(
            config.horario_apertura,
            config.horario_cierre,
            reservasDelDia,
            cancha_id,
            bloqueosDelDia
        );

        return NextResponse.json({
            slots,
            fecha,
            cancha_id
        });
    } catch (error) {
        console.error('Error in GET /api/disponibilidad:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
