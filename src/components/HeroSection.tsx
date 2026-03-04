interface HeroSectionProps {
    nombre: string;
    descripcion: string;
    horarioApertura: string;
    horarioCierre: string;
}

export default function HeroSection({ nombre, descripcion, horarioApertura, horarioCierre }: HeroSectionProps) {
    // Lista simulada de horas para el visual decorativo
    const visualSlots = [
        { hora: "9:00", estado: "ocupado" },
        { hora: "10:00", estado: "ocupado" },
        { hora: "11:00", estado: "libre" },
        { hora: "12:00", estado: "libre" },
        { hora: "13:00", estado: "ocupado" },
        { hora: "14:00", estado: "ocupado" },
        { hora: "15:00", estado: "libre" },
        { hora: "16:00", estado: "libre" },
        { hora: "17:00", estado: "ocupado" },
        { hora: "18:00", estado: "libre" },
        { hora: "19:00", estado: "libre" },
        { hora: "20:00", estado: "libre" },
    ];

    const libresCount = visualSlots.filter(s => s.estado === 'libre').length;

    return (
        <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-white to-[#f8f9fa] overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 w-full py-20 md:py-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* COLUMNA IZQUIERDA: Texto y CTAs */}
                    <div className="flex flex-col items-start text-left">
                        <div className="mb-6 px-4 py-1.5 rounded-full bg-[#1e3a5f]/5 border border-[#1e3a5f]/15">
                            <span className="text-[#1e3a5f] text-xs font-medium">Reservas online · Disponibilidad en tiempo real</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-tight">
                            <span className="block text-[#0f172a] mb-2">{nombre}</span>
                            <span className="block text-[#1e3a5f]">Reserva tu cancha</span>
                        </h1>

                        <p className="text-[#64748b] text-lg mt-4 max-w-md leading-relaxed">
                            {descripcion}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
                            <a
                                href="#reservar"
                                className="bg-[#1e3a5f] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm text-center"
                            >
                                Reservar ahora
                            </a>
                            <a
                                href="#canchas"
                                className="bg-transparent text-[#1e3a5f] font-semibold px-8 py-3.5 rounded-lg border border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-all duration-200 text-center"
                            >
                                Ver canchas
                            </a>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center mt-12 pt-8 border-t border-[#e2e8f0] gap-8">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#1e3a5f]">4</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Canchas</span>
                            </div>
                            <div className="w-px h-8 bg-[#e2e8f0]"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#1e3a5f]">{horarioApertura}–{horarioCierre}</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Horario</span>
                            </div>
                            <div className="w-px h-8 bg-[#e2e8f0]"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-[#1e3a5f]">&lt; 60 seg</span>
                                <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">Reserva</span>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: Visual Decorativo */}
                    <div className="hidden md:block">
                        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-6 max-w-sm mx-auto ml-auto">
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[#0f172a]">Disponibilidad hoy</h3>
                                <p className="text-xs text-[#64748b] mt-1 break-words">Marzo 2026</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                {visualSlots.map((slot, index) => (
                                    <div
                                        key={index}
                                        className={`text-center py-2 px-3 rounded-lg text-xs font-medium cursor-default transition-transform hover:scale-105 duration-200 ${slot.estado === 'libre'
                                            ? 'bg-[#1e3a5f] text-white shadow-sm'
                                            : 'bg-[#f1f5f9] text-[#94a3b8]'
                                            }`}
                                    >
                                        {slot.hora}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#e2e8f0] pt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                                    <span className="text-xs text-[#64748b] font-medium">Slots disponibles</span>
                                </div>
                                <span className="text-xs font-semibold text-[#1e3a5f]">{libresCount} horarios libres</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
