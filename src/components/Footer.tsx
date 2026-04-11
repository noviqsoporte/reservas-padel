import { MapPin, Phone, Instagram } from "lucide-react";
import { Config } from "@/types";

interface FooterProps {
    config: Config;
}

export default function Footer({ config }: FooterProps) {
    const instagramHandle = config.instagram.startsWith('@')
        ? config.instagram
        : `@${config.instagram}`;

    return (
        <footer id="contacto" className="bg-[#0f172a] text-white py-16 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Fila Superior */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

                    {/* Columna 1: Marca */}
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#0057FF] font-bold text-xl leading-none -mt-1">•</span>
                            <span className="text-xl font-bold text-white tracking-tight">{config.negocio_nombre}</span>
                        </div>
                        <p className="text-[#94a3b8] text-sm mt-2 font-medium">Tu cancha, tu momento</p>
                        <p className="text-[#64748b] text-sm mt-3 leading-relaxed max-w-xs">
                            Reserva tu cancha de pádel en línea. Disponibilidad en tiempo real, confirmación inmediata.
                        </p>
                    </div>

                    {/* Columna 2: Contacto */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contacto</h3>
                        <div className="space-y-3">
                            <div className="flex gap-2 items-start text-[#94a3b8] text-sm">
                                <MapPin className="w-4 h-4 text-[#0057FF] mt-0.5 flex-shrink-0" />
                                <span>{config.direccion}</span>
                            </div>
                            <div className="flex gap-2 items-start text-[#94a3b8] text-sm">
                                <Phone className="w-4 h-4 text-[#0057FF] mt-0.5 flex-shrink-0" />
                                <span>{config.telefono}</span>
                            </div>
                            <div className="flex gap-2 items-start text-[#94a3b8] text-sm">
                                <Instagram className="w-4 h-4 text-[#0057FF] mt-0.5 flex-shrink-0" />
                                <span>{instagramHandle}</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna 3: Horarios */}
                    <div>
                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Horarios</h3>
                        <p className="text-[#94a3b8] text-sm">Abierto todos los días</p>
                        <p className="text-white font-semibold text-lg mt-1">
                            {config.horario_apertura} – {config.horario_cierre}
                        </p>

                        <div className="mt-4">
                            <p className="text-[#94a3b8] text-sm">¿Listo para jugar?</p>
                            <a
                                href="#reservar"
                                className="inline-block border border-[#0057FF] text-[#0057FF] text-sm px-4 py-2 rounded-lg mt-2 hover:bg-[#0057FF] hover:text-white transition-colors"
                            >
                                Reservar ahora &rarr;
                            </a>
                        </div>
                    </div>

                </div>

                {/* Divider */}
                <div className="border-t border-[#1e293b] my-0"></div>

                {/* Fila Inferior */}
                <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[#475569] text-sm text-center md:text-left">
                        &copy; {new Date().getFullYear()} {config.negocio_nombre}. Todos los derechos reservados.
                    </p>
                    <p className="text-[#475569] text-sm flex items-center gap-1">
                        Hecho con ❤️ por <span className="text-[#0057FF] font-medium">Nexora</span>
                    </p>
                </div>

            </div>
        </footer>
    );
}
