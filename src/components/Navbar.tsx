"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar({ nombre = "Lood" }: { nombre?: string }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            className={`sticky top-0 z-50 h-16 transition-all duration-300 ${
                scrolled
                    ? "bg-white/75 backdrop-blur-md border-b border-[#e2e8f0]/70 shadow-[0_2px_24px_rgba(0,0,0,0.07)]"
                    : "bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0] shadow-sm"
            }`}
        >
            <div className="max-w-6xl mx-auto px-6 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo / Brand */}
                    <div className="flex items-center gap-2">
                        <span className="text-[#0057FF] font-bold text-xl leading-none -mt-1">•</span>
                        <span className="text-[#0057FF] font-bold text-xl tracking-tight">{nombre}</span>
                    </div>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="#canchas"
                            className="text-[#64748b] text-sm font-medium hover:text-[#0057FF] transition-colors relative group"
                        >
                            Canchas
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0057FF] transition-all group-hover:w-full" />
                        </Link>
                        <Link
                            href="#reservar"
                            className="text-[#64748b] text-sm font-medium hover:text-[#0057FF] transition-colors relative group"
                        >
                            Reservar
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0057FF] transition-all group-hover:w-full" />
                        </Link>
                        <Link
                            href="#contacto"
                            className="text-[#64748b] text-sm font-medium hover:text-[#0057FF] transition-colors relative group"
                        >
                            Contacto
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#0057FF] transition-all group-hover:w-full" />
                        </Link>
                    </div>

                    {/* CTA Button */}
                    <div>
                        <Link
                            href="#reservar"
                            className="btn-shimmer bg-[#0057FF] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#0041cc] transition-colors duration-200 shadow-sm"
                        >
                            Reservar ahora
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
