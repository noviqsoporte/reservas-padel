"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSession";
import { User, LogOut, Calendar, ChevronDown } from "lucide-react";

export default function Navbar({ nombre = "Lood" }: { nombre?: string }) {
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, profile, loading, signOut } = useSession();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayName = profile?.nombre ?? user?.email?.split("@")[0] ?? "";
    const truncatedName = displayName.length > 12 ? displayName.slice(0, 12) + "…" : displayName;
    const initial = displayName.charAt(0).toUpperCase();

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

                    {/* CTA + Account */}
                    <div className="flex items-center gap-3">
                        {!loading && (
                            user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#f0f4ff] transition-colors"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                            {initial}
                                        </div>
                                        <span className="hidden sm:inline text-sm font-medium text-[#0f172a]">
                                            {truncatedName}
                                        </span>
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 text-[#64748b] transition-transform duration-200 ${
                                                dropdownOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#e2e8f0] rounded-xl shadow-lg py-1.5 z-50">
                                            <Link
                                                href="/mis-reservas"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#0f172a] hover:bg-[#f8faff] transition-colors"
                                            >
                                                <Calendar className="w-4 h-4 text-[#0057FF]" />
                                                Mis reservas
                                            </Link>
                                            <div className="my-1 border-t border-[#f1f5f9]" />
                                            <button
                                                onClick={() => { signOut(); setDropdownOpen(false); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/auth"
                                    className="flex items-center gap-1.5 text-sm font-semibold text-[#0057FF] border border-[#0057FF] px-4 py-2 rounded-lg hover:bg-[#eef3ff] transition-colors duration-200"
                                >
                                    <User className="w-4 h-4" />
                                    Mi cuenta
                                </Link>
                            )
                        )}
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
