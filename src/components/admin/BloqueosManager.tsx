"use client";

import { useState } from "react";
import { differenceInDays } from "date-fns";
import { toast } from "react-hot-toast";
import { formatearFechaLegible } from "@/lib/fecha";
import {
    Trash2,
    CalendarOff,
    CalendarRange,
    AlertCircle,
    X,
    Plus
} from "lucide-react";
import { Bloqueo, Cancha } from "@/types";

interface BloqueosManagerProps {
    bloqueos: Bloqueo[];
    canchas: Cancha[];
}

export default function BloqueosManager({ bloqueos: bloqueosIniciales, canchas }: BloqueosManagerProps) {
    const [bloqueos, setBloqueos] = useState<Bloqueo[]>(bloqueosIniciales);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        cancha_id: '',
        motivo: '',
        fecha_inicio: '',
        fecha_fin: '',
        es_parcial: false,
        hora_inicio: '',
        hora_fin: '',
    });

    const canchasActivas = canchas.filter(c => c.activa);
    const todayStr = new Date().toISOString().split('T')[0];

    const resetForm = () => {
        setForm({
            cancha_id: '',
            motivo: '',
            fecha_inicio: '',
            fecha_fin: '',
            es_parcial: false,
            hora_inicio: '',
            hora_fin: '',
        });
    };

    const handleOpenCrear = () => {
        resetForm();
        setModalAbierto(true);
    };

    const handleCloseModal = () => {
        setModalAbierto(false);
        resetForm();
    };

    const handleCrearBloqueo = async () => {
        const { cancha_id, motivo, fecha_inicio, fecha_fin, es_parcial, hora_inicio, hora_fin } = form;

        if (!cancha_id || !motivo || !fecha_inicio) {
            toast.error("Todos los campos son requeridos");
            return;
        }

        if (es_parcial) {
            if (!hora_inicio || !hora_fin) {
                toast.error("Debes ingresar hora inicio y hora fin");
                return;
            }
            if (hora_fin <= hora_inicio) {
                toast.error("La hora de fin debe ser mayor a la hora de inicio");
                return;
            }
        } else {
            if (!fecha_fin) {
                toast.error("La fecha de fin es requerida");
                return;
            }
            if (fecha_fin < fecha_inicio) {
                toast.error("La fecha de fin no puede ser anterior a la de inicio");
                return;
            }
        }

        const payload = {
            cancha_id,
            motivo,
            fecha_inicio,
            fecha_fin: es_parcial ? fecha_inicio : fecha_fin,
            hora_inicio: es_parcial ? hora_inicio : null,
            hora_fin: es_parcial ? hora_fin : null,
        };

        setLoading(true);
        try {
            const res = await fetch('/api/bloqueos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setBloqueos([data.bloqueo, ...bloqueos]);
                toast.success("Bloqueo creado exitosamente");
                handleCloseModal();
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Error al crear bloqueo");
            }
        } catch (_error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        if (!window.confirm("¿Eliminar este bloqueo? Los clientes podrán reservar nuevamente.")) {
            return;
        }

        try {
            const res = await fetch(`/api/bloqueos/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setBloqueos(bloqueos.filter(b => b.id !== id));
                toast.success("Bloqueo eliminado");
            } else {
                toast.error("Error al eliminar el bloqueo");
            }
        } catch (_error) {
            toast.error("Error de conexión");
        }
    };

    const getCanchaName = (id: string) => {
        const cancha = canchas.find(c => c.id === id);
        return cancha ? cancha.nombre : 'Todas las canchas';
    };

    const calcularDuracion = (inicio: string, fin: string) => {
        try {
            const dInicio = new Date(inicio.slice(0, 10) + 'T12:00:00');
            const dFin = new Date(fin.slice(0, 10) + 'T12:00:00');
            return differenceInDays(dFin, dInicio) + 1;
        } catch (_e) {
            return 1;
        }
    };

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-[#64748b]">
                    Períodos bloqueados activos
                </div>
                <button
                    onClick={handleOpenCrear}
                    className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo bloqueo
                </button>
            </div>

            {/* LISTA */}
            {bloqueos.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-[#e2e8f0]">
                    <CalendarOff className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#0f172a]">No hay bloqueos registrados</h3>
                    <p className="text-[#94a3b8] text-sm mt-2 mb-6">Los bloqueos impedirán reservas en los períodos indicados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bloqueos.map(bloqueo => {
                        const duracion = calcularDuracion(bloqueo.fecha_inicio, bloqueo.fecha_fin);

                        return (
                            <div key={bloqueo.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">

                                <div className="flex justify-between items-start">
                                    <div className="bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-medium px-3 py-1 rounded-full">
                                        {getCanchaName(bloqueo.cancha_id)}
                                    </div>

                                    <button
                                        onClick={() => handleEliminar(bloqueo.id)}
                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                                        title="Eliminar bloqueo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="text-base font-semibold text-[#0f172a] mt-3">{bloqueo.motivo}</h3>

                                <div className="flex items-center gap-2 mt-2">
                                    <CalendarRange className="w-4 h-4 text-[#64748b]" />
                                    <span className="text-sm text-[#64748b]">
                                        {bloqueo.hora_inicio && bloqueo.hora_fin
                                            ? formatearFechaLegible(bloqueo.fecha_inicio)
                                            : bloqueo.fecha_inicio.slice(0, 10) === bloqueo.fecha_fin.slice(0, 10)
                                                ? formatearFechaLegible(bloqueo.fecha_inicio)
                                                : `${formatearFechaLegible(bloqueo.fecha_inicio)} – ${formatearFechaLegible(bloqueo.fecha_fin)}`}
                                    </span>
                                </div>

                                <div className="mt-2">
                                    {bloqueo.hora_inicio && bloqueo.hora_fin ? (
                                        <span className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full inline-block font-medium">
                                            {bloqueo.hora_inicio.slice(0, 5)} – {bloqueo.hora_fin.slice(0, 5)}
                                        </span>
                                    ) : (
                                        <span className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full inline-block font-medium">
                                            {duracion} día(s) bloqueado(s)
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL CREAR */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">

                        <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center bg-white rounded-t-2xl">
                            <h3 className="font-bold text-[#0f172a] text-lg">Nuevo bloqueo</h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-[#94a3b8] hover:text-[#0f172a] rounded-full p-1 hover:bg-[#f1f5f9] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Cancha afectada</label>
                                <select
                                    value={form.cancha_id}
                                    onChange={(e) => setForm({ ...form, cancha_id: e.target.value })}
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                >
                                    <option value="">Selecciona una cancha</option>
                                    {canchasActivas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Motivo del bloqueo</label>
                                <input
                                    type="text"
                                    value={form.motivo}
                                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                                    placeholder="Ej: Mantenimiento, Torneo, Reparación..."
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="es_parcial"
                                    checked={form.es_parcial}
                                    onChange={(e) => setForm({ ...form, es_parcial: e.target.checked, hora_inicio: '', hora_fin: '', fecha_fin: '' })}
                                    className="w-4 h-4 rounded border-[#e2e8f0] accent-[#1e3a5f]"
                                />
                                <label htmlFor="es_parcial" className="text-sm font-medium text-[#0f172a] select-none cursor-pointer">
                                    Bloquear solo un rango de horas
                                </label>
                            </div>

                            {form.es_parcial ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha</label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={form.fecha_inicio}
                                            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora inicio</label>
                                            <input
                                                type="time"
                                                value={form.hora_inicio}
                                                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora fin</label>
                                            <input
                                                type="time"
                                                value={form.hora_fin}
                                                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha inicio</label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            value={form.fecha_inicio}
                                            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha fin</label>
                                        <input
                                            type="date"
                                            min={form.fecha_inicio || todayStr}
                                            value={form.fecha_fin}
                                            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-amber-700 leading-snug">
                                    Durante este período no se podrán hacer reservas en la cancha seleccionada.
                                </span>
                            </div>

                        </div>

                        <div className="px-6 py-5 border-t border-[#e2e8f0] flex gap-3 justify-end bg-white rounded-b-2xl">
                            <button
                                onClick={handleCloseModal}
                                disabled={loading}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrearBloqueo}
                                disabled={loading}
                                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Creando...' : 'Crear bloqueo'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
