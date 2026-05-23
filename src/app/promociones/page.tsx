import Link from "next/link";
import { ArrowLeft, ImageOff, Tag } from "lucide-react";
import { getPromocionesActivas } from "@/lib/db";
import { Promocion } from "@/types";

export const dynamic = 'force-dynamic';

function badgeTexto(promo: Promocion): string {
    switch (promo.tipo) {
        case '2x1_2horas': return '2x1 2h';
        case 'quinta_gratis': return '5ta GRATIS';
        default: return `${promo.descuento}% OFF`;
    }
}

function terminosYCondiciones(promo: Promocion): string {
    switch (promo.tipo) {
        case '2x1_2horas':
            return 'Válido únicamente en reservas de 2 horas. Una promoción por reserva. Sujeto a disponibilidad.';
        case 'quinta_gratis':
            return 'Válida tras acumular 4 reservas completadas, verificadas por número de teléfono. Cubre hasta 1 hora de juego; el tiempo adicional se cobra con tarifa normal. Una promoción por reserva.';
        default:
            return 'Aplica sobre el precio del horario seleccionado. Una promoción por reserva. Sujeto a disponibilidad.';
    }
}

export default async function PromocionesPage() {
    const promociones = await getPromocionesActivas().catch(() => [] as Promocion[]);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-[#64748b] hover:text-[#0d3461] transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#0d3461]" />
                        <span className="font-bold text-[#0d3461] text-lg">Promociones</span>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Promociones activas</h1>
                    <p className="text-[#64748b] mt-2">Aprovecha nuestras ofertas especiales al reservar tu cancha.</p>
                </div>

                {promociones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
                            <Tag className="w-7 h-7 text-[#cbd5e1]" />
                        </div>
                        <h2 className="text-[#0f172a] font-semibold text-lg">Sin promociones por ahora</h2>
                        <p className="text-[#64748b] text-sm mt-1.5 max-w-xs">
                            Por ahora no hay promociones activas. ¡Vuelve pronto para ver nuestras ofertas!
                        </p>
                        <Link
                            href="/"
                            className="mt-6 bg-[#0d3461] text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-[#0f3d74] transition-colors text-sm"
                        >
                            Reservar ahora
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {promociones.map((promo) => (
                            <div
                                key={promo.id}
                                className="bg-white rounded-2xl shadow-sm border border-[#e2e8f0] overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Imagen */}
                                <div className="relative h-48 bg-[#f1f5f9]">
                                    {promo.imagen_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={promo.imagen_url}
                                            alt={promo.titulo}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageOff className="w-10 h-10 text-[#cbd5e1]" />
                                        </div>
                                    )}

                                    {/* Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-[#0d3461] text-white font-black text-base px-3 py-1 rounded-lg shadow-md leading-tight">
                                            {badgeTexto(promo)}
                                        </span>
                                    </div>
                                </div>

                                {/* Contenido */}
                                <div className="px-5 py-4">
                                    <h2 className="font-bold text-[#0f172a] text-lg leading-snug">{promo.titulo}</h2>
                                    {promo.descripcion && (
                                        <p className="text-[#475569] text-sm mt-1.5 leading-relaxed">{promo.descripcion}</p>
                                    )}
                                    <p className="text-[#94a3b8] text-xs mt-3 leading-relaxed border-t border-[#f1f5f9] pt-3">
                                        {terminosYCondiciones(promo)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-12 text-center">
                    <Link
                        href="/#reservar"
                        className="inline-block bg-[#0d3461] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[#0f3d74] transition-colors shadow-sm"
                    >
                        Reservar ahora
                    </Link>
                </div>
            </main>
        </div>
    );
}
