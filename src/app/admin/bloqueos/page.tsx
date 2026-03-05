import { Bloqueo, Cancha } from "@/types";
import BloqueosManager from "@/components/admin/BloqueosManager";
import { getBloqueos, getCanchas } from '@/lib/airtable';

export default async function BloqueosPage() {
    const [bloqueos, canchas] = await Promise.all([
        getBloqueos().catch(() => []),
        getCanchas().catch(() => [])
    ]);

    return (
        <div>
            <BloqueosManager bloqueos={bloqueos} canchas={canchas} />
        </div>
    );
}
