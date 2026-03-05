import { format, parse, isBefore, isAfter, addMinutes } from 'date-fns';
import { Reserva, Bloqueo, SlotHorario } from '../types';

export function generarSlots(
    apertura: string,
    cierre: string,
    reservasDelDia: Reserva[],
    canchaId: string,
    bloqueosDelDia: Bloqueo[]
): SlotHorario[] {
    const slots: SlotHorario[] = [];
    const fechaBase = format(new Date(), 'yyyy-MM-dd'); // Usamos el día actual para el parseo de horas

    const aperturaTime = parse(`${fechaBase} ${apertura}`, 'yyyy-MM-dd HH:mm', new Date());
    const cierreTime = parse(`${fechaBase} ${cierre}`, 'yyyy-MM-dd HH:mm', new Date());

    let currentTime = aperturaTime;

    while (isBefore(currentTime, cierreTime)) {
        const nextTime = addMinutes(currentTime, 60);

        // Si excede el cierre, lo cortamos
        if (isAfter(nextTime, cierreTime)) {
            break;
        }

        const slotStartStr = format(currentTime, 'HH:mm');
        const slotEndStr = format(nextTime, 'HH:mm');

        const isOcupadoReserva = reservasDelDia.some(reserva => {
            return reserva.cancha_id === canchaId &&
                reserva.estado !== 'Cancelada' &&
                reserva.hora_inicio < slotEndStr &&
                reserva.hora_fin > slotStartStr;
        });

        const isOcupadoBloqueo = bloqueosDelDia.some(bloqueo => {
            if (bloqueo.cancha_id !== canchaId) return false;

            const isIsoTime = bloqueo.fecha_inicio.includes('T') || bloqueo.fecha_inicio.includes(' ');

            if (isIsoTime) {
                // Obtenemos solo la cadena de tiempo como string para comparar rangos
                const getTimeStr = (fechaISO: string) => {
                    try {
                        const d = new Date(fechaISO);
                        if (!isNaN(d.getTime())) {
                            return format(d, 'HH:mm');
                        }
                    } catch (_e) { }
                    // Fallback simple si falla Date()
                    return fechaISO.length >= 16 ? fechaISO.substring(11, 16) : null;
                };

                const horaInicioB = getTimeStr(bloqueo.fecha_inicio);
                const horaFinB = getTimeStr(bloqueo.fecha_fin);

                if (horaInicioB && horaFinB) {
                    return horaInicioB < slotEndStr && horaFinB > slotStartStr;
                }
            }

            // Si el bloqueo no usa timestamp especifico, asumimos que bloquea el dia completo
            return true;
        });

        slots.push({
            hora_inicio: slotStartStr,
            hora_fin: slotEndStr,
            disponible: !isOcupadoReserva && !isOcupadoBloqueo
        });

        currentTime = nextTime;
    }

    return slots;
}
