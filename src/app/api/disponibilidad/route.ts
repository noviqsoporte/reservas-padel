import { NextResponse } from 'next/server';
import { getConfig, getBloqueos, getReservas, getCancha } from '@/lib/db';
import { generarSlots } from '@/lib/slots';
import { calcularPrecio, esHoraPico } from '@/lib/precios';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cancha_id = searchParams.get('cancha_id');
        const fecha = searchParams.get('fecha');
        const duracion = parseInt(searchParams.get('duracion') || '60', 10);

        if (!cancha_id || !fecha) {
            return NextResponse.json(
                { error: 'Se requiere cancha_id y fecha' },
                { status: 400 }
            );
        }

        const duracionMinutos = [60, 90, 120, 150, 180].includes(duracion) ? duracion : 60;

        const [config, cancha] = await Promise.all([getConfig(), getCancha(cancha_id)]);

        // Validate operating day
        const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const [year, month, day] = fecha.split('-').map(Number);
        const diaNombre = DIAS_SEMANA[new Date(year, month - 1, day).getDay()];
        const diasOperacion = config.dias_operacion.map(d => d.trim().toLowerCase());
        const enOperacion = diasOperacion.includes(diaNombre.toLowerCase());

        console.log(`[disponibilidad] dia: "${diaNombre}" | en operacion: ${enOperacion} → slots: ${enOperacion ? '?' : 0}`);

        if (!enOperacion) {
            return NextResponse.json({ slots: [], motivo: 'dia_no_operativo', fecha, cancha_id });
        }

        console.log(`[disponibilidad] buscando reservas con getReservas: cancha_id=${cancha_id} fecha=${fecha}`);
        const todasReservas = await getReservas(fecha);
        const reservasDelDia = todasReservas.filter(
            r => r.cancha_id === cancha_id && r.estado !== 'Cancelada'
        );
        console.log('[disponibilidad] reservas encontradas con getReservas:', reservasDelDia.length);
        reservasDelDia.forEach((r, i) => {
            console.log(`[disponibilidad] reserva[${i}]: inicio=${r.hora_inicio} fin=${r.hora_fin} estado=${r.estado}`);
        });

        const todosLosBloqueos = await getBloqueos();

        const bloqueosDelDia = todosLosBloqueos.filter(b => {
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

        // DEBUG: remove once slots are confirmed working
        console.log('[disponibilidad] apertura raw:', JSON.stringify(config.horario_apertura));
        console.log('[disponibilidad] cierre raw:  ', JSON.stringify(config.horario_cierre));
        // normalizeTime is internal to slots.ts — log what generarSlots will receive:
        const aperturaDebug = config.horario_apertura;
        const cierreDebug = config.horario_cierre;
        console.log('[disponibilidad] duracion:', duracionMinutos, 'min');

        const slots = generarSlots(
            aperturaDebug,
            cierreDebug,
            reservasDelDia,
            cancha_id,
            bloqueosDelDia,
            duracionMinutos
        );

        console.log('[disponibilidad] slots generados:', slots.length);

        const horasPico = config.horas_pico || ''
        const diasPico = config.dias_pico || ''
        const precioNormal = cancha?.precio ?? 0
        const precioPico = cancha?.precio_pico

        console.log('[disponibilidad] config.dias_pico:', config.dias_pico)
        console.log('[disponibilidad] config.horas_pico:', config.horas_pico)

        const slotsConPrecio = slots.map(slot => {
            if (!slot.disponible) return slot
            const pico = esHoraPico(slot.hora_inicio, fecha, horasPico, diasPico)
            if (slot.hora_inicio === '19:00') {
                console.log(`[disponibilidad] slot 19:00 es_pico: ${pico}`)
            }
            const precio = calcularPrecio(
                slot.hora_inicio, fecha, duracionMinutos,
                precioNormal, precioPico, horasPico, diasPico
            )
            return { ...slot, es_pico: pico, precio }
        })

        return NextResponse.json({
            slots: slotsConPrecio,
            fecha,
            cancha_id,
            duracion: duracionMinutos,
        });
    } catch (error) {
        console.error('Error in GET /api/disponibilidad:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
