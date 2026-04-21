import { format, parse, isBefore, isAfter, addMinutes } from 'date-fns';
import { Reserva, Bloqueo, SlotHorario } from '../types';

// Normalizes free-text time strings to "HH:mm" (24h).
// Handles: "07:00 a.m.", "11:00 p.m.", "7:00 a.m.", "7am", "11pm", "07:00", "23:00"
function normalizeTime(timeStr: string): string {
    // Strip all dots, lowercase, collapse extra whitespace
    const s = timeStr.replace(/\./g, '').trim().toLowerCase();

    // Already plain HH:mm or H:mm with no am/pm
    const plainMatch = s.match(/^(\d{1,2}):(\d{2})$/);
    if (plainMatch) {
        return `${String(parseInt(plainMatch[1], 10)).padStart(2, '0')}:${plainMatch[2]}`;
    }

    // "H:mm am" / "H:mm pm"  (space optional between digits and period)
    const colonAmPm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
    if (colonAmPm) {
        let h = parseInt(colonAmPm[1], 10);
        const m = colonAmPm[2];
        const period = colonAmPm[3];
        if (period === 'pm' && h !== 12) h += 12;
        if (period === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
    }

    // "7am" / "11pm"  (no colon, no minutes)
    const bareAmPm = s.match(/^(\d{1,2})\s*(am|pm)$/);
    if (bareAmPm) {
        let h = parseInt(bareAmPm[1], 10);
        const period = bareAmPm[2];
        if (period === 'pm' && h !== 12) h += 12;
        if (period === 'am' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:00`;
    }

    // Fallback: extract first H:mm pattern found
    const fallback = s.match(/(\d{1,2}):(\d{2})/);
    if (fallback) return `${String(parseInt(fallback[1], 10)).padStart(2, '0')}:${fallback[2]}`;

    return timeStr.trim();
}

export function generarSlots(
    apertura: string,
    cierre: string,
    reservasDelDia: Reserva[],
    canchaId: string,
    bloqueosDelDia: Bloqueo[],
    duracionMinutos: number = 60
): SlotHorario[] {
    const slots: SlotHorario[] = [];
    const fechaBase = format(new Date(), 'yyyy-MM-dd');

    const aperturaTime = parse(`${fechaBase} ${normalizeTime(apertura)}`, 'yyyy-MM-dd HH:mm', new Date());
    const cierreTime = parse(`${fechaBase} ${normalizeTime(cierre)}`, 'yyyy-MM-dd HH:mm', new Date());

    let currentTime = aperturaTime;

    while (isBefore(currentTime, cierreTime)) {
        const nextTime = addMinutes(currentTime, duracionMinutos);

        if (isAfter(nextTime, cierreTime)) {
            break;
        }

        const slotStartStr = format(currentTime, 'HH:mm');
        const slotEndStr = format(nextTime, 'HH:mm');

        const isOcupadoReserva = reservasDelDia.some(reserva => {
            if (reserva.cancha_id !== canchaId) return false;
            if (reserva.estado === 'Cancelada') return false;

            // Pendiente + online: bloquea solo si created_at hace menos de 30 min
            if (reserva.estado === 'Pendiente' && reserva.metodo_pago === 'online') {
                if (!reserva.created_at) return false;
                const edad = Date.now() - new Date(reserva.created_at).getTime();
                if (edad > 30 * 60 * 1000) return false;
            }

            const rInicio = (reserva.hora_inicio || '').slice(0, 5);
            const rFin = (reserva.hora_fin || '').slice(0, 5);
            const solapamiento = rInicio < slotEndStr && rFin > slotStartStr;
            console.log(`[slots] slot ${slotStartStr}-${slotEndStr}: reserva ${rInicio}-${rFin} estado=${reserva.estado} metodo=${reserva.metodo_pago} solapamiento=${solapamiento} → ${solapamiento ? 'BLOQUEADO' : 'libre'}`);
            return solapamiento;
        });

        const isOcupadoBloqueo = bloqueosDelDia.some(bloqueo => {
            if (bloqueo.cancha_id !== canchaId) return false;

            const isIsoTime = bloqueo.fecha_inicio.includes('T') || bloqueo.fecha_inicio.includes(' ');

            if (isIsoTime) {
                const getTimeStr = (fechaISO: string) => {
                    try {
                        const d = new Date(fechaISO);
                        if (!isNaN(d.getTime())) {
                            return format(d, 'HH:mm');
                        }
                    } catch (_e) { }
                    return fechaISO.length >= 16 ? fechaISO.substring(11, 16) : null;
                };

                const horaInicioB = getTimeStr(bloqueo.fecha_inicio);
                const horaFinB = getTimeStr(bloqueo.fecha_fin);

                if (horaInicioB && horaFinB) {
                    return horaInicioB < slotEndStr && horaFinB > slotStartStr;
                }
            }

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
