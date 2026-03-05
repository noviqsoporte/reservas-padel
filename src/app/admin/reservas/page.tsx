import { Cancha, Reserva } from "@/types";
import ReservasManager from "@/components/admin/ReservasManager";
import { getReservas, getCanchas } from '@/lib/airtable';

export default async function ReservasPage() {
    const [reservas, canchas] = await Promise.all([
        getReservas().catch(() => []),
        getCanchas().catch(() => [])
    ]);

    return (
        <div>
            <ReservasManager reservas={reservas} canchas={canchas} />
        </div>
    );
}
