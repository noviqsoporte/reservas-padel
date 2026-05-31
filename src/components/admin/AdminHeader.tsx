"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
    const pathname = usePathname();
    const [fechaHoy, setFechaHoy] = useState("");

    useEffect(() => {
        const fecha = new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "America/Mexico_City",
        });
        setFechaHoy(fecha.charAt(0).toUpperCase() + fecha.slice(1));
    }, []);

    let title = "Dashboard";
    if (pathname === '/admin/reservas') title = "Reservas";
    if (pathname === '/admin/canchas') title = "Canchas";
    if (pathname === '/admin/bloqueos') title = "Bloqueos";
    if (pathname === '/admin/configuracion') title = "Configuración";
    if (pathname === '/admin/promociones') title = "Promociones";
    if (pathname === '/admin/clases') title = "Clases";

    return (
        <header className="hidden md:flex bg-white border-b border-[#e2e8f0] px-6 md:px-8 py-4 justify-between items-center sticky top-0 z-10">

            {/* Izquierda */}
            <div>
                <h1 className="text-xl font-bold text-[#0f172a] capitalize">{title}</h1>
                {fechaHoy && <p className="text-[#64748b] text-sm mt-0.5 capitalize">{fechaHoy}</p>}
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
