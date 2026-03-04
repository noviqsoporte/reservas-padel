"use client";

import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminHeader() {
    const pathname = usePathname();

    let title = "Dashboard";
    if (pathname === '/admin/reservas') title = "Reservas";
    if (pathname === '/admin/canchas') title = "Canchas";
    if (pathname === '/admin/bloqueos') title = "Bloqueos";
    if (pathname === '/admin/configuracion') title = "Configuración";

    const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es });

    return (
        <header className="bg-white border-b border-[#e2e8f0] px-6 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">

            {/* Izquierda */}
            <div>
                <h1 className="text-xl font-bold text-[#0f172a] capitalize">{title}</h1>
                <p className="text-[#64748b] text-sm mt-0.5 capitalize">{today}</p>
            </div>

            {/* Derecha */}
            <div>
                <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    En línea
                </span>
            </div>

        </header>
    );
}
