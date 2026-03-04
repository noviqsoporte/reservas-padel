export default function ComoFuncionaSection() {
    return (
        <section className="py-24 px-4 bg-white">
            <div className="max-w-6xl mx-auto">

                {/* Header de sección */}
                <div className="text-center mb-16">
                    <div className="text-[#1e3a5f] text-xs font-semibold tracking-widest uppercase mb-3">
                        El Proceso
                    </div>
                    <h2 className="text-4xl font-bold text-[#0f172a]">
                        Reservar es muy sencillo
                    </h2>
                    <p className="text-[#64748b] text-lg mt-3">
                        En menos de un minuto tienes tu cancha asegurada
                    </p>
                </div>

                {/* Pasos */}
                <div className="max-w-4xl mx-auto mt-16 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 relative">

                        {/* Líneas divisorias (solo en desktop) */}
                        <div className="hidden md:block absolute top-[1.5rem] left-[16.66%] w-[33.33%] border-t-2 border-dashed border-[#e2e8f0] z-0"></div>
                        <div className="hidden md:block absolute top-[1.5rem] left-[50%] w-[33.33%] border-t-2 border-dashed border-[#e2e8f0] z-0"></div>

                        {/* Paso 1 */}
                        <div className="text-center px-6 relative z-10 mb-12 md:mb-0">
                            <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white text-lg font-bold mx-auto mb-6 flex items-center justify-center">
                                1
                            </div>
                            <div className="text-3xl mb-3">🏟️</div>
                            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Elige tu cancha</h3>
                            <p className="text-[#64748b] text-sm leading-relaxed">
                                Explora las canchas disponibles y selecciona la que más te guste.
                            </p>
                        </div>

                        {/* Paso 2 */}
                        <div className="text-center px-6 relative z-10 mb-12 md:mb-0">
                            <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white text-lg font-bold mx-auto mb-6 flex items-center justify-center">
                                2
                            </div>
                            <div className="text-3xl mb-3">🗓️</div>
                            <h3 className="text-lg font-bold text-[#0f172a] mb-2">Selecciona el horario</h3>
                            <p className="text-[#64748b] text-sm leading-relaxed">
                                Elige la fecha y el slot de 60 minutos que mejor se adapte a ti.
                            </p>
                        </div>

                        {/* Paso 3 */}
                        <div className="text-center px-6 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#1e3a5f] text-white text-lg font-bold mx-auto mb-6 flex items-center justify-center">
                                3
                            </div>
                            <div className="text-3xl mb-3">✅</div>
                            <h3 className="text-lg font-bold text-[#0f172a] mb-2">¡Listo para jugar!</h3>
                            <p className="text-[#64748b] text-sm leading-relaxed">
                                Ingresa tus datos y recibe confirmación instantánea de tu reserva.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-16 pt-8">
                    <h3 className="text-2xl font-bold text-[#0f172a]">¿Listo para jugar?</h3>
                    <p className="text-[#64748b] mt-2">Asegura tu lugar ahora mismo</p>
                    <a
                        href="#reservar"
                        className="inline-block bg-[#1e3a5f] text-white font-semibold px-10 py-4 rounded-xl hover:bg-[#2563eb] transition-colors mt-6"
                    >
                        Reservar mi cancha
                    </a>
                </div>

            </div>
        </section>
    );
}
