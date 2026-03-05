import { Cancha } from "@/types";
import CanchasManager from "@/components/admin/CanchasManager";
import { getCanchas } from '@/lib/airtable';

export default async function CanchasPage() {
    const canchas = await getCanchas().catch(() => []);

    return (
        <div>
            <CanchasManager canchas={canchas} />
        </div>
    );
}
