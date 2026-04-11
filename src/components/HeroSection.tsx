"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface HeroSectionProps {
    nombre: string;
    descripcion: string;
    horarioApertura: string;
    horarioCierre: string;
    canchasActivas: number;
}

function useCountUp(target: number, inView: boolean, duration = 1400) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!inView) return;
        let raf: number;
        const start = Date.now();
        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, target, duration]);
    return value;
}

function HeroPaddle() {
    return (
        <svg
            viewBox="0 0 200 380"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            overflow="visible"
            preserveAspectRatio="xMidYMid meet"
        >
            <defs>
                <clipPath id="hero-face-clip">
                    <ellipse cx="94" cy="152" rx="86" ry="128" />
                </clipPath>
                <filter id="paddle-shadow" x="-20%" y="-10%" width="140%" height="130%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0d3461" floodOpacity="0.35" />
                </filter>
            </defs>

            {/* Paddle face */}
            <ellipse cx="94" cy="152" rx="86" ry="128" fill="#0d3461" filter="url(#paddle-shadow)" />

            {/* String grid (clipped to face) */}
            <g clipPath="url(#hero-face-clip)">
                {/* Horizontals */}
                <line x1="0" y1="48"  x2="200" y2="48"  stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="76"  x2="200" y2="76"  stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="104" x2="200" y2="104" stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="132" x2="200" y2="132" stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="160" x2="200" y2="160" stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="188" x2="200" y2="188" stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="216" x2="200" y2="216" stroke="white" strokeWidth="1.4" opacity="0.18" />
                <line x1="0" y1="244" x2="200" y2="244" stroke="white" strokeWidth="1.4" opacity="0.18" />
                {/* Verticals */}
                <line x1="22"  y1="0" x2="22"  y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
                <line x1="50"  y1="0" x2="50"  y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
                <line x1="78"  y1="0" x2="78"  y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
                <line x1="94"  y1="0" x2="94"  y2="300" stroke="white" strokeWidth="1.4" opacity="0.08" />
                <line x1="110" y1="0" x2="110" y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
                <line x1="138" y1="0" x2="138" y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
                <line x1="166" y1="0" x2="166" y2="300" stroke="white" strokeWidth="1.4" opacity="0.1" />
            </g>

            {/* Inner oval detail ring */}
            <ellipse cx="94" cy="152" rx="68" ry="108" fill="none" stroke="white" strokeWidth="1.5" opacity="0.1" />

            {/* Brand mark dot */}
            <circle cx="94" cy="152" r="10" fill="white" fillOpacity="0.08" />

            {/* Handle throat (tapers from face to grip) */}
            <path d="M66 278 C62 288 62 296 66 300 L122 300 C126 296 126 288 122 278 Z" fill="#0d3461" />

            {/* Handle grip */}
            <rect x="66" y="299" width="56" height="72" rx="12" fill="#081e38" />
            {/* Grip wrap bands */}
            <rect x="66" y="299" width="56" height="8"  rx="0" fill="white" fillOpacity="0.1" />
            <rect x="66" y="327" width="56" height="6"  rx="0" fill="white" fillOpacity="0.07" />
            <rect x="66" y="353" width="56" height="6"  rx="0" fill="white" fillOpacity="0.07" />

            {/* Ball */}
            <circle cx="175" cy="46" r="30" fill="#a8d832" />
            {/* Ball seam lines */}
            <path d="M153 39 Q175 28 197 39" stroke="white" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M153 53 Q175 64 197 53" stroke="white" strokeWidth="2" fill="none" opacity="0.5" strokeLinecap="round" />
        </svg>
    );
}

export default function HeroSection({ nombre, descripcion, horarioApertura, horarioCierre, canchasActivas }: HeroSectionProps) {
    const statsRef = useRef<HTMLDivElement>(null);
    const [statsInView, setStatsInView] = useState(false);

    useEffect(() => {
        const el = statsRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsInView(true); },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const canchasCount = useCountUp(canchasActivas, statsInView);

    return (
        <section className="relative min-h-[90vh] flex items-center bg-white overflow-visible">

            <div className="max-w-6xl mx-auto px-6 w-full py-20 md:py-0 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* COLUMNA IZQUIERDA */}
                    <div className="flex flex-col items-start text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-6 px-4 py-1.5 rounded-full bg-[#0057FF]/5 border border-[#0057FF]/15"
                        >
                            <span className="text-[#0057FF] text-xs font-medium">
                                Reservas online · Disponibilidad en tiempo real
                            </span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.18 }}
                            className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-tight"
                        >
                            <span className="block text-[#0f172a] mb-2">{nombre}</span>
                            <span className="block text-[#0057FF]">Reserva tu cancha</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.28 }}
                            className="text-[#64748b] text-lg mt-4 max-w-md leading-relaxed"
                        >
                            {descripcion}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.38 }}
                            className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto"
                        >
                            {/* Primary CTA — dark navy */}
                            <a
                                href="#reservar"
                                className="btn-shimmer bg-[#0d3461] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#0f3d74] transition-colors shadow-sm text-center"
                            >
                                Reservar ahora
                            </a>
                            {/* Secondary CTA — outline dark navy */}
                            <a
                                href="#canchas"
                                className="bg-transparent text-[#0d3461] font-semibold px-8 py-3.5 rounded-lg border border-[#0d3461] hover:bg-[#0d3461] hover:text-white transition-all duration-200 text-center"
                            >
                                Ver canchas
                            </a>
                        </motion.div>

                        {/* Stats Row */}
                        <motion.div
                            ref={statsRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="flex items-center mt-12 pt-8 border-t border-[#e2e8f0] gap-8"
                        >
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#0057FF]">{canchasCount}</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Canchas</span>
                            </div>
                            <div className="w-px h-8 bg-[#e2e8f0]" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#0057FF]">{horarioApertura}–{horarioCierre}</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Horario</span>
                            </div>
                            <div className="w-px h-8 bg-[#e2e8f0]" />
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#0057FF]">&lt; 60 seg</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Reserva</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* COLUMNA DERECHA: Pala decorativa con animación de flotación */}
                    <div className="hidden md:flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            style={{ width: 240, overflow: 'visible', background: 'transparent' }}
                        >
                            <motion.div
                                animate={{ y: [0, -12, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                style={{ overflow: 'visible' }}
                            >
                                <HeroPaddle />
                            </motion.div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
