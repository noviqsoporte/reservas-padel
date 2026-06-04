import ReservasManager from "@/components/admin/ReservasManager";
import { getReservas, getCanchas, getPromociones } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ReservasPage() {
    const [reservas, canchas, promos] = await Promise.all([
        getReservas().catch(() => []),
        getCanchas().catch(() => []),
        getPromociones().catch(() => []),
    ]);

    const quintaPromoIds = promos
        .filter(p => p.tipo === 'quinta_gratis')
        .map(p => p.id);

    return (
        <div>
            <ReservasManager reservas={reservas} canchas={canchas} quintaPromoIds={quintaPromoIds} />
        </div>
    );
}
