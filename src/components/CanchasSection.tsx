import { Cancha } from "@/types";
import BotonReservarCancha from "./BotonReservarCancha";

interface CanchasSectionProps {
    canchas: Cancha[];
}

export default function CanchasSection({ canchas }: CanchasSectionProps) {
    return (
        <section id="canchas" className="py-24 px-4 bg-[#f8f9fa]">
            <div className="max-w-6xl mx-auto">

                {/* Header de sección */}
                <div className="text-center mb-16">
                    <div className="text-[#1e3a5f] text-xs font-semibold tracking-widest uppercase mb-3">
                        Nuestras Canchas
                    </div>
                    <h2 className="text-4xl font-bold text-[#0f172a]">
                        Elige tu cancha favorita
                    </h2>
                    <p className="text-[#64748b] text-lg mt-3">
                        Canchas de primer nivel disponibles para ti
                    </p>
                </div>

                {/* Grid de cards */}
                {canchas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {canchas.map((cancha) => (
                            <div
                                key={cancha.id}
                                className="bg-white rounded-2xl overflow-hidden border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
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
                                    {/* Fila superior */}
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

                                    {/* Descripción */}
                                    <p className="text-[#64748b] text-sm mt-2 leading-relaxed line-clamp-2">
                                        {cancha.descripcion}
                                    </p>

                                    <div className="border-t border-[#e2e8f0] my-4"></div>

                                    {/* Fila precio + botón */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            {cancha.precio > 0 ? (
                                                <>
                                                    <span className="text-2xl font-bold text-[#1e3a5f]">${cancha.precio}</span>
                                                    <span className="text-sm text-[#64748b]">/hora</span>
                                                </>
                                            ) : (
                                                <span className="text-[#64748b] font-medium">Consultar</span>
                                            )}
                                        </div>
                                        <BotonReservarCancha canchaId={cancha.id} activa={cancha.activa} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
