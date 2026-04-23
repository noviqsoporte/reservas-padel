"use client";

import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Trophy,
    Ban,
    Settings,
    LogOut,
    Tag
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/admin/logout', { method: 'POST' });
            if (res.ok) {
                router.push('/admin/login');
                router.refresh();
            }
        } catch (error) {
            console.error("Error al cerrar sesión", error);
        }
    };

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/reservas', icon: Calendar, label: 'Reservas' },
        { href: '/admin/canchas', icon: Trophy, label: 'Canchas' },
        { href: '/admin/bloqueos', icon: Ban, label: 'Bloqueos' },
        { href: '/admin/promociones', icon: Tag, label: 'Promociones' },
        { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
    ];

    return (
        <div className="w-64 flex-shrink-0 hidden md:flex flex-col bg-white border-r border-[#e2e8f0] h-full">
            {/* Header Sidebar */}
            <div className="px-6 py-5 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                    <span className="text-[#2563eb] text-xl font-bold leading-none -mt-1">•</span>
                    <h2 className="text-[#1e3a5f] font-bold tracking-tight text-lg">Padel Admin</h2>
                </div>
                <p className="text-[#64748b] text-xs mt-1">Panel de control</p>
            </div>

            {/* Navegación */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(item.href)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all w-full text-left rounded-xl ${isActive
                                    ? 'bg-[#1e3a5f] text-white'
                                    : 'text-[#64748b] hover:bg-[#f8f9fa] hover:text-[#0f172a]'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer Sidebar */}
            <div className="px-3 py-4 border-t border-[#e2e8f0] mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#64748b] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full text-left"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </div>
    );
}
