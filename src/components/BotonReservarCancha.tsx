"use client";

interface BotonReservarCanchaProps {
    canchaId: string;
    activa: boolean;
}

export default function BotonReservarCancha({ canchaId, activa }: BotonReservarCanchaProps) {
    const handleClick = () => {
        if (!activa) return;

        // Guardar en sessionStorage
        sessionStorage.setItem('cancha_preseleccionada', canchaId);

        // Smooth scroll al div de reservas (usando selector nativo para simular el click del href)
        const element = document.getElementById('reservar');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (!activa) {
        return (
            <button
                disabled
                className="bg-[#0057FF] text-white font-semibold text-sm px-6 py-2.5 rounded-lg w-auto opacity-40 cursor-not-allowed"
            >
                No disponible
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="bg-[#0057FF] text-white font-semibold text-sm px-6 py-2.5 rounded-lg w-auto hover:bg-[#0041cc] transition-colors duration-200"
        >
            Reservar &rarr;
        </button>
    );
}
