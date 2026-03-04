"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0] shadow-sm h-16">
            <div className="max-w-6xl mx-auto px-6 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo / Brand */}
                    <div className="flex items-center gap-2">
                        <span className="text-[#2563eb] font-bold text-xl leading-none -mt-1">•</span>
                        <span className="text-[#1e3a5f] font-bold text-xl tracking-tight">Padel Club</span>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="#canchas" className="text-[#64748b] text-sm font-medium hover:text-[#1e3a5f] transition-colors relative group">
                            Canchas
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a5f] transition-all group-hover:w-full"></span>
                        </Link>
                        <Link href="#reservar" className="text-[#64748b] text-sm font-medium hover:text-[#1e3a5f] transition-colors relative group">
                            Reservar
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a5f] transition-all group-hover:w-full"></span>
                        </Link>
                        <Link href="#contacto" className="text-[#64748b] text-sm font-medium hover:text-[#1e3a5f] transition-colors relative group">
                            Contacto
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1e3a5f] transition-all group-hover:w-full"></span>
                        </Link>
                    </div>

                    {/* CTA Button */}
                    <div>
                        <Link
                            href="#reservar"
                            className="bg-[#1e3a5f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2563eb] transition-colors duration-200 shadow-sm"
                        >
                            Reservar ahora
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
