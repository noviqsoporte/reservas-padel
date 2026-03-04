import { Cancha } from "@/types";
import CanchasManager from "@/components/admin/CanchasManager";

async function getCanchas() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/canchas`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.canchas as Cancha[];
    } catch (error) {
        console.error("Error fetching canchas:", error);
        return [];
    }
}

export default async function CanchasPage() {
    const canchas = await getCanchas();

    return (
        <div>
            <CanchasManager canchas={canchas} />
        </div>
    );
}
