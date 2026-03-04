import ReservaWizard from "./ReservaWizard";

export default function ReservaSection() {
    return (
        <section id="reservar" className="py-24 px-4 bg-[#f8f9fa]">
            <div className="max-w-6xl mx-auto">
                {/* Header de sección */}
                <div className="text-center mb-12">
                    <div className="text-[#1e3a5f] text-xs font-semibold tracking-widest uppercase mb-3">
                        Reservaciones
                    </div>
                    <h2 className="text-4xl font-bold text-[#0f172a]">
                        Reserva tu cancha
                    </h2>
                    <p className="text-[#64748b] text-lg mt-3">
                        Disponibilidad en tiempo real · Confirmación inmediata
                    </p>
                </div>

                {/* Contenedor principal del Wizard */}
                <div className="max-w-4xl mx-auto">
                    <ReservaWizard />
                </div>
            </div>
        </section>
    );
}
