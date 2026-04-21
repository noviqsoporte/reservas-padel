"use client";

import { motion } from "framer-motion";
import { Cancha } from "@/types";
import BotonReservarCancha from "./BotonReservarCancha";

interface CanchasSectionProps {
    canchas: Cancha[];
}

const gridVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function CanchasSection({ canchas }: CanchasSectionProps) {
    return (
        <section id="canchas" className="py-24 px-4 bg-[#f8f9fa]">
            <div className="max-w-6xl mx-auto">

                {/* Header de sección */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-[#1e3a5f] text-xs font-semibold tracking-widest uppercase mb-3">
                        Nuestras Canchas
                    </div>
                    <h2 className="text-4xl font-bold text-[#0f172a]">
                        Elige tu cancha favorita
                    </h2>
                    <p className="text-[#64748b] text-lg mt-3">
                        Canchas de primer nivel disponibles para ti
                    </p>
                </motion.div>

                {/* Grid de cards */}
                {canchas.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        variants={gridVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-40px" }}
                    >
                        {canchas.map((cancha) => (
                            <motion.div
                                key={cancha.id}
                                variants={cardVariants}
                                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm cursor-default"
                            >
                                {/* Área superior / Imagen */}
                                <div className="h-52 w-full relative">
                                    {cancha.foto_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={cancha.foto_url}
                                            alt={cancha.nombre}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex flex-col items-center justify-center">
                                            <span className="text-[#94a3b8] text-2xl font-bold">{cancha.nombre}</span>
                                            <span className="text-3xl mt-2">🎾</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contenido Card */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-[#0f172a]">{cancha.nombre}</h3>
                                        {cancha.activa ? (
                                            <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                                                ● Disponible
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-3 py-1">
                                                ● Cerrada
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[#64748b] text-sm mt-2 leading-relaxed line-clamp-2">
                                        {cancha.descripcion}
                                    </p>

                                    <div className="border-t border-[#e2e8f0] my-4" />

                                    <div className="flex justify-between items-center">
                                        <div>
                                            {cancha.precio > 0 ? (
                                                <>
                                                    {cancha.precio_pico && cancha.precio_pico > 0 ? (
                                                        <div>
                                                            <div>
                                                                <span className="text-2xl font-bold text-[#1e3a5f]">${cancha.precio}</span>
                                                                <span className="text-sm text-[#64748b]"> normal</span>
                                                            </div>
                                                            <div className="text-sm text-orange-500 font-medium">
                                                                ${cancha.precio_pico} <span className="text-xs text-[#94a3b8] font-normal">hora pico</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-2xl font-bold text-[#1e3a5f]">${cancha.precio}</span>
                                                            <span className="text-sm text-[#64748b]">/hora</span>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-[#64748b] font-medium">Consultar</span>
                                            )}
                                        </div>
                                        <BotonReservarCancha canchaId={cancha.id} activa={cancha.activa} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4 opacity-30">🎾</div>
                        <p className="text-[#64748b]">Canchas próximamente</p>
                    </div>
                )}

            </div>
        </section>
    );
}
