import { Bloqueo, Cancha } from "@/types";
import BloqueosManager from "@/components/admin/BloqueosManager";

async function getBloqueos() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/bloqueos`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.bloqueos as Bloqueo[];
    } catch (error) {
        console.error("Error fetching bloqueos:", error);
        return [];
    }
}

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

export default async function BloqueosPage() {
    const [bloqueos, canchas] = await Promise.all([getBloqueos(), getCanchas()]);

    return (
        <div>
            <BloqueosManager bloqueos={bloqueos} canchas={canchas} />
        </div>
    );
}
