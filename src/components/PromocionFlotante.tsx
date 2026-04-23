"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Promocion } from "@/types";

export default function PromocionFlotante() {
    const [promociones, setPromociones] = useState<Promocion[]>([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [indice, setIndice] = useState(0);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        fetch('/api/promociones?activas=true')
            .then(res => res.ok ? res.json() : { promociones: [] })
            .then(data => setPromociones(data.promociones ?? []))
            .catch(() => setPromociones([]))
            .finally(() => setCargando(false));
    }, []);

    if (cargando || promociones.length === 0) return null;

    const promo = promociones[indice];
    const total = promociones.length;

    const irAnterior = () => setIndice(i => (i - 1 + total) % total);
    const irSiguiente = () => setIndice(i => (i + 1) % total);

    return (
        <>
            {/* Botón flotante */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
                onClick={() => setModalAbierto(true)}
                aria-label="Ver promociones"
                className="fixed z-50 flex items-center justify-center rounded-full shadow-lg bg-[#1e3a5f] hover:bg-[#2563eb] transition-colors"
                style={{ width: 52, height: 52, bottom: 156, right: 24 }}
            >
                <Tag className="w-6 h-6 text-white" />
                {total > 1 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                        {total}
                    </span>
                )}
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {modalAbierto && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            key="overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 z-50"
                            onClick={() => setModalAbierto(false)}
                        />

                        {/* Tarjeta */}
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.92, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 24 }}
                            transition={{ type: "spring", stiffness: 300, damping: 28 }}
                            className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden pointer-events-auto">

                                {/* Imagen / banner */}
                                <div className="relative h-48 bg-[#f1f5f9]">
                                    {promo.imagen_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={promo.imagen_url}
                                            alt={promo.titulo}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                            <ImageOff className="w-10 h-10 text-[#cbd5e1]" />
                                        </div>
                                    )}

                                    {/* Badge descuento */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-[#1e3a5f] text-white font-black text-xl px-4 py-1.5 rounded-xl shadow-md leading-tight">
                                            {promo.descuento}% OFF
                                        </span>
                                    </div>

                                    {/* Botón cerrar */}
                                    <button
                                        onClick={() => setModalAbierto(false)}
                                        className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition-colors"
                                    >
                                        <X className="w-4 h-4 text-[#0f172a]" />
                                    </button>
                                </div>

                                {/* Contenido */}
                                <div className="px-5 py-4">
                                    <h3 className="font-bold text-[#0f172a] text-lg leading-snug">{promo.titulo}</h3>
                                    {promo.descripcion && (
                                        <p className="text-[#64748b] text-sm mt-1.5 leading-relaxed">{promo.descripcion}</p>
                                    )}

                                    {(promo.fecha_inicio || promo.fecha_fin) && (
                                        <p className="text-xs text-[#94a3b8] mt-3">
                                            {promo.fecha_inicio && `Desde ${promo.fecha_inicio}`}
                                            {promo.fecha_inicio && promo.fecha_fin && ' · '}
                                            {promo.fecha_fin && `Hasta ${promo.fecha_fin}`}
                                        </p>
                                    )}
                                </div>

                                {/* Navegación (solo si hay múltiples) */}
                                {total > 1 && (
                                    <div className="px-5 pb-4 flex items-center justify-between">
                                        <button
                                            onClick={irAnterior}
                                            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        {/* Dots */}
                                        <div className="flex items-center gap-1.5">
                                            {promociones.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setIndice(i)}
                                                    className={`rounded-full transition-all ${i === indice
                                                        ? 'w-5 h-2 bg-[#1e3a5f]'
                                                        : 'w-2 h-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'
                                                        }`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={irSiguiente}
                                            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
