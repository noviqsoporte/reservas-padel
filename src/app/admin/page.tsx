import { Cancha, Reserva } from "@/types";
import DashboardKPIs from "@/components/admin/DashboardKPIs";
import ReservasHoy from "@/components/admin/ReservasHoy";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { getReservas, getCanchas } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const [reservas, canchas] = await Promise.all([
        getReservas().catch(() => []),
        getCanchas().catch(() => [])
    ]);

    const hoy = new Date().toISOString().split('T')[0];
    const currentMonth = hoy.substring(0, 7);

    const reservasHoy = reservas.filter(r => r.fecha === hoy && r.estado !== 'Cancelada');

    const ahora = new Date();
    const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 }); // Lunes
    const finSemana = endOfWeek(ahora, { weekStartsOn: 1 });     // Domingo

    const reservasSemana = reservas.filter(r => {
        if (r.estado === 'Cancelada') return false;
        try {
            const fechaReserva = parseISO(r.fecha);
            return isWithinInterval(fechaReserva, {
                start: inicioSemana,
                end: finSemana
            });
        } catch { return false; }
    });

    const reservasMes = reservas.filter(r => r.fecha.startsWith(currentMonth) && r.estado !== 'Cancelada');
    const cancelacionesMes = reservas.filter(r => r.fecha.startsWith(currentMonth) && r.estado === 'Cancelada');
    const canchasActivas = canchas.filter(c => c.activa);

    const ingresosMes = reservasMes.reduce((total, r) => {
        const cancha = canchas.find(c => c.id === r.cancha_id);
        return total + (cancha?.precio || 0);
    }, 0);

    let ocupacionHoy = 0;
    if (canchasActivas.length > 0) {
        ocupacionHoy = Math.round((reservasHoy.length / (canchasActivas.length * 16)) * 100);
        if (ocupacionHoy > 100) ocupacionHoy = 100;
    }

    return (
        <div className="space-y-8">
            <DashboardKPIs
                reservasHoy={reservasHoy.length}
                reservasSemana={reservasSemana.length}
                reservasMes={reservasMes.length}
                ingresosMes={ingresosMes}
                cancelacionesMes={cancelacionesMes.length}
                ocupacionHoy={ocupacionHoy}
                canchasActivas={canchasActivas.length}
            />
            <ReservasHoy reservas={reservasHoy} canchas={canchas} />
        </div>
    );
}
