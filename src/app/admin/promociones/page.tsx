import PromocionesManager from "@/components/admin/PromocionesManager";
import { getPromociones } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function PromocionesPage() {
    const promociones = await getPromociones().catch(() => []);

    return (
        <div>
            <PromocionesManager promociones={promociones} />
        </div>
    );
}
