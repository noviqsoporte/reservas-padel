import { Cancha, Reserva } from "@/types";
import ReservasManager from "@/components/admin/ReservasManager";

async function getReservas() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/reservas`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.reservas as Reserva[];
    } catch (error) {
        console.error("Error fetching reservas:", error);
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

export default async function ReservasPage() {
    const [reservas, canchas] = await Promise.all([getReservas(), getCanchas()]);

    return (
        <div>
            <ReservasManager reservas={reservas} canchas={canchas} />
        </div>
    );
}
