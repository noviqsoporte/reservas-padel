import { Reserva, Cancha } from "@/types";
import { Calendar } from "lucide-react";

interface ReservasHoyProps {
    reservas: Reserva[];
    canchas: Cancha[];
}

export default function ReservasHoy({ reservas, canchas }: ReservasHoyProps) {
    // Ordenar reservas por hora de inicio
    const reservasOrdenadas = [...reservas].sort((a, b) =>
        a.hora_inicio.localeCompare(b.hora_inicio)
    );

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-white">
                <h2 className="font-bold text-[#0f172a]">Reservas de hoy</h2>
                <span className="bg-[#1e3a5f] text-white text-xs rounded-full px-2.5 py-1">
                    {reservas.length}
                </span>
            </div>

            {/* Contenido */}
            {reservas.length === 0 ? (
                <div className="py-16 text-center">
                    <Calendar className="w-12 h-12 text-[#e2e8f0] mx-auto" />
                    <p className="text-[#64748b] mt-3 font-medium">No hay reservas para hoy</p>
                    <p className="text-sm text-[#94a3b8] mt-1">Las reservas confirmadas aparecerán aquí</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#f8f9fa] border-b border-[#e2e8f0]">
                                <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                                    Horario
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                                    Cancha
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                                    Contacto
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {reservasOrdenadas.map((reserva) => {
                                const cancha = canchas.find((c) => c.id === reserva.cancha_id);

                                return (
                                    <tr key={reserva.id} className="hover:bg-[#f8f9fa] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-semibold text-[#0f172a] text-sm">
                                                {reserva.hora_inicio} – {reserva.hora_fin}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-[#0f172a]">
                                                {cancha?.nombre || "Cancha eliminada"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-[#0f172a] text-sm">
                                                {reserva.nombre_cliente}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-[#64748b]">{reserva.telefono}</div>
                                            <div className="text-xs text-[#94a3b8]">{reserva.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(() => {
                                                const estadoColor: Record<string, string> = {
                                                    Confirmada: 'bg-green-50 text-green-700 border-green-200',
                                                    Pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                                    Cancelada: 'bg-red-50 text-red-600 border-red-200',
                                                    Completada: 'bg-blue-50 text-blue-700 border-blue-200',
                                                    'No show': 'bg-gray-100 text-gray-600 border-gray-300',
                                                };
                                                const cls = estadoColor[reserva.estado] ?? 'bg-gray-100 text-gray-500 border-gray-200';
                                                return (
                                                    <span className={`border text-xs font-medium px-3 py-1 rounded-full ${cls}`}>
                                                        {reserva.estado}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
