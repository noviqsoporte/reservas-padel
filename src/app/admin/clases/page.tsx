import ClasesManager from "@/components/admin/ClasesManager";
import { getClases } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function ClasesPage() {
    const clases = await getClases().catch(() => []);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0f172a]">Clases & Wellness</h1>
                <p className="text-[#64748b] text-sm mt-1">Gestiona las clases y actividades del centro</p>
            </div>
            <ClasesManager clases={clases} />
        </div>
    );
}
