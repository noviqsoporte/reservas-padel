"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { Search, Pencil, X, AlertTriangle, MessageSquare, Calendar, Eye, User, CreditCard, Clock, Plus, ClipboardCheck } from "lucide-react";
import { Cancha, Reserva } from "@/types";
import { fechaHoyMexico, horaActualMexico, esReservaPasadaSinCompletar } from "@/lib/fecha";

interface ReservasManagerProps {
    reservas: Reserva[];
    canchas: Cancha[];
}

export default function ReservasManager({ reservas: reservasIniciales, canchas }: ReservasManagerProps) {
    const [reservas, setReservas] = useState<Reserva[]>(reservasIniciales);

    // Filtros
    const [filtroFecha, setFiltroFecha] = useState<string>('');
    const [filtroCanchaId, setFiltroCanchaId] = useState<string>('todas');
    const [filtroEstado, setFiltroEstado] = useState<string>('todas');
    const [busqueda, setBusqueda] = useState<string>('');

    // Modales
    const [reservaDetalle, setReservaDetalle] = useState<Reserva | null>(null);
    const [reservaEditando, setReservaEditando] = useState<Reserva | null>(null);
    const [reservaCancelando, setReservaCancelando] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPago, setLoadingPago] = useState(false);
    const [cierreLoading, setCierreLoading] = useState<Set<string>>(new Set());

    // Modal nueva reserva
    const [nuevaReservaOpen, setNuevaReservaOpen] = useState(false);
    const [loadingNueva, setLoadingNueva] = useState(false);
    const [errorNueva, setErrorNueva] = useState<string | null>(null);
    const [nuevaReservaForm, setNuevaReservaForm] = useState({
        cancha_id: '',
        fecha: '',
        hora_inicio: '07:00',
        duracion: 60,
        nombre_cliente: '',
        telefono: '',
        email: '',
        notas: '',
        metodo_pago: 'efectivo' as 'efectivo' | 'online',
        estado: 'Confirmada' as 'Confirmada' | 'Pendiente',
    });

    // Computed state
    const reservasFiltradas = useMemo(() => {
        return reservas
            .filter((r) => {
                if (filtroFecha && r.fecha !== filtroFecha) return false;
                if (filtroCanchaId !== 'todas' && r.cancha_id !== filtroCanchaId) return false;
                if (filtroEstado !== 'todas' && r.estado !== filtroEstado) return false;

                if (busqueda.trim() !== '') {
                    const lowerBusqueda = busqueda.toLowerCase();
                    return (
                        r.nombre_cliente.toLowerCase().includes(lowerBusqueda) ||
                        r.email.toLowerCase().includes(lowerBusqueda) ||
                        r.telefono.includes(lowerBusqueda)
                    );
                }
                return true;
            })
            .sort((a, b) => {
                // Orden DESC por fecha
                const dateCompare = b.fecha.localeCompare(a.fecha);
                if (dateCompare !== 0) return dateCompare;
                // Orden DESC por hora inicio
                return b.hora_inicio.localeCompare(a.hora_inicio);
            });
    }, [reservas, filtroFecha, filtroCanchaId, filtroEstado, busqueda]);

    const hayFiltrosActivos = filtroFecha !== '' || filtroCanchaId !== 'todas' || filtroEstado !== 'todas' || busqueda !== '';

    const clearFiltros = () => {
        setFiltroFecha('');
        setFiltroCanchaId('todas');
        setFiltroEstado('todas');
        setBusqueda('');
    };

    const todayStr = fechaHoyMexico();

    const reservasPendientesCerrar = useMemo(() => {
        const fechaHoy = fechaHoyMexico();
        const horaActual = horaActualMexico();
        return reservas
            .filter(r => esReservaPasadaSinCompletar(r.fecha, r.hora_fin, r.estado, fechaHoy, horaActual))
            .sort((a, b) => {
                const dateCompare = a.fecha.localeCompare(b.fecha);
                if (dateCompare !== 0) return dateCompare;
                return a.hora_inicio.localeCompare(b.hora_inicio);
            });
    }, [reservas]);

    const HORARIOS = Array.from({ length: 31 }, (_, i) => {
        const totalMin = 7 * 60 + i * 30;
        const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
        const m = (totalMin % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    });

    const calcHoraFin = (horaInicio: string, duracionMin: number): string => {
        const [h, m] = horaInicio.split(':').map(Number);
        const totalMin = h * 60 + m + duracionMin;
        return `${Math.floor(totalMin / 60).toString().padStart(2, '0')}:${(totalMin % 60).toString().padStart(2, '0')}`;
    };

    const openNuevaReserva = () => {
        setNuevaReservaForm({
            cancha_id: canchas[0]?.id ?? '',
            fecha: filtroFecha || todayStr,
            hora_inicio: '07:00',
            duracion: 60,
            nombre_cliente: '',
            telefono: '',
            email: '',
            notas: '',
            metodo_pago: 'efectivo',
            estado: 'Confirmada',
        });
        setErrorNueva(null);
        setNuevaReservaOpen(true);
    };

    const handleNuevaReserva = async () => {
        setErrorNueva(null);
        const { cancha_id, fecha, hora_inicio, duracion, nombre_cliente, telefono, email, notas, metodo_pago, estado } = nuevaReservaForm;

        if (!cancha_id || !fecha || !hora_inicio || !nombre_cliente || !telefono) {
            setErrorNueva('Completa los campos obligatorios: cancha, fecha, hora, nombre y teléfono.');
            return;
        }

        const hora_fin = calcHoraFin(hora_inicio, duracion);

        setLoadingNueva(true);
        try {
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancha_id, fecha, hora_inicio, hora_fin, nombre_cliente, telefono, email: email || '', notas: notas || '', metodo_pago, estado }),
            });

            if (res.ok) {
                const data = await res.json();
                const nuevaReserva: Reserva = data.reserva ?? data;
                setReservas(prev => [nuevaReserva, ...prev]);
                setNuevaReservaOpen(false);
                toast.success('Reserva creada correctamente');
            } else {
                const errorData = await res.json();
                setErrorNueva(errorData.error || 'Error al crear la reserva');
            }
        } catch (_error) {
            setErrorNueva('Error de conexión. Intenta de nuevo.');
        } finally {
            setLoadingNueva(false);
        }
    };

    // Acción: Cancelar
    const handleCancelar = async () => {
        if (!reservaCancelando) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/reservas/${reservaCancelando}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setReservas(prev =>
                    prev.map(r => r.id === reservaCancelando ? { ...r, estado: 'Cancelada' } : r)
                );
                toast.success("Reserva cancelada");
            } else {
                toast.error("Error al cancelar la reserva");
            }
        } catch (_error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
            setReservaCancelando(null);
        }
    };

    const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!res.ok) throw new Error();
            setReservas(prev => prev.map(r =>
                r.id === id ? { ...r, estado: nuevoEstado as Reserva['estado'] } : r
            ));
            toast.success(`Estado actualizado a ${nuevoEstado}`);
        } catch (_error) {
            toast.error("Error al actualizar el estado");
        }
    };

    // Acción: Editar
    const handleEditar = async () => {
        if (!reservaEditando) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/reservas/${reservaEditando.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha: reservaEditando.fecha,
                    hora_inicio: reservaEditando.hora_inicio,
                    hora_fin: reservaEditando.hora_fin,
                    notas: reservaEditando.notas
                })
            });

            if (res.ok) {
                setReservas(prev =>
                    prev.map(r => r.id === reservaEditando.id ? reservaEditando : r)
                );
                toast.success("Reserva actualizada");
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
            setReservaEditando(null);
        }
    };

    const handleMarcarPagado = async (id: string) => {
        setLoadingPago(true);
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pago_estado: 'pagado' })
            });
            if (!res.ok) throw new Error();
            setReservas(prev => prev.map(r =>
                r.id === id ? { ...r, pago_estado: 'pagado' } : r
            ));
            setReservaDetalle(prev => prev ? { ...prev, pago_estado: 'pagado' } : null);
            toast.success('Pago registrado correctamente');
        } catch (_error) {
            toast.error('Error al registrar el pago');
        } finally {
            setLoadingPago(false);
        }
    };

    const handleCerrarRapido = async (id: string, nuevoEstado: 'Completada' | 'No show') => {
        setCierreLoading(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`/api/reservas/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            if (!res.ok) throw new Error();
            setReservas(prev => prev.map(r =>
                r.id === id ? { ...r, estado: nuevoEstado } : r
            ));
            toast.success(`Marcada como ${nuevoEstado}`);
        } catch {
            toast.error('Error al actualizar el estado');
        } finally {
            setCierreLoading(prev => { const s = new Set(prev); s.delete(id); return s; });
        }
    };

    const getCanchaName = (id: string) => {
        const cancha = canchas.find(c => c.id === id);
        return cancha ? cancha.nombre : 'Eliminada';
    };

    const handleChangeEditHoraInicio = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!reservaEditando) return;
        const hora = e.target.value;

        // Auto calcular hora fin (sumar 1 h)
        let horaFin = reservaEditando.hora_fin;
        if (hora) {
            const [h, m] = hora.split(':').map(Number);
            const endH = (h + 1).toString().padStart(2, '0');
            const endM = m.toString().padStart(2, '0');
            horaFin = `${endH}:${endM}`;
        }

        setReservaEditando({
            ...reservaEditando,
            hora_inicio: hora,
            hora_fin: horaFin
        });
    };

    return (
        <div>
            {/* RESERVAS PENDIENTES DE CERRAR */}
            {reservasPendientesCerrar.length > 0 && (
                <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-amber-200 bg-amber-100">
                        <ClipboardCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <h2 className="font-bold text-amber-800 text-sm">
                            Reservas pendientes de cerrar ({reservasPendientesCerrar.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-amber-200">
                        {reservasPendientesCerrar.map(r => (
                            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5">
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-900">
                                    <span className="font-semibold">{r.nombre_cliente}</span>
                                    <span className="text-amber-700">{getCanchaName(r.cancha_id)}</span>
                                    <span className="text-amber-700">{r.fecha}</span>
                                    <span className="text-amber-700">{r.hora_inicio}–{r.hora_fin}</span>
                                    <span className="text-amber-600">{r.telefono}</span>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handleCerrarRapido(r.id, 'Completada')}
                                        disabled={cierreLoading.has(r.id)}
                                        className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                                    >
                                        ✅ Completada
                                    </button>
                                    <button
                                        onClick={() => handleCerrarRapido(r.id, 'No show')}
                                        disabled={cierreLoading.has(r.id)}
                                        className="text-xs font-semibold bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                                    >
                                        👻 No show
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* SECCIÓN DE FILTROS */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, email, teléfono..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full border border-[#e2e8f0] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>

                    <div>
                        <input
                            type="date"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>

                    <div>
                        <select
                            value={filtroCanchaId}
                            onChange={(e) => setFiltroCanchaId(e.target.value)}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        >
                            <option value="todas">Todas las canchas</option>
                            {canchas.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 items-center">
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        >
                            <option value="todas">Todos los estados</option>
                            <option value="Confirmada">Confirmadas</option>
                            <option value="Pendiente">Pendientes</option>
                            <option value="Cancelada">Canceladas</option>
                        </select>
                    </div>
                </div>

                {hayFiltrosActivos && (
                    <div className="mt-3 flex justify-end">
                        <button
                            onClick={clearFiltros}
                            className="text-sm text-[#64748b] hover:text-[#1e3a5f] underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* TABLA DE RESERVAS */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e2e8f0] flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-[#0f172a]">Reservas</h2>
                        <span className="bg-[#1e3a5f] text-white text-xs rounded-full px-2.5 py-1">
                            {reservasFiltradas.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[#64748b] text-sm hidden md:inline-block">
                            {reservasFiltradas.length} de {reservas.length} reservas
                        </span>
                        <button
                            onClick={openNuevaReserva}
                            className="flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva reserva
                        </button>
                    </div>
                </div>

                {reservasFiltradas.length === 0 ? (
                    <div className="py-16 text-center">
                        <Calendar className="w-12 h-12 text-[#e2e8f0] mx-auto" />
                        <p className="text-[#64748b] mt-3 font-medium">No hay resultados para estos filtros</p>
                    </div>
                ) : (
                    <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#f8f9fa] border-b border-[#e2e8f0]">
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Fecha</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Horario</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Cancha</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Cliente</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Contacto</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Estado</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Pago</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e2e8f0]">
                                {reservasFiltradas.map((reserva) => {
                                    const isHoy = reserva.fecha === todayStr;
                                    let parsedDateLabel = reserva.fecha;
                                    try {
                                        parsedDateLabel = format(new Date(reserva.fecha + 'T12:00:00'), "E d MMM", { locale: es });
                                    } catch (_e) { }

                                    let parsedDateYear = "";
                                    try {
                                        parsedDateYear = format(new Date(reserva.fecha + 'T12:00:00'), "yyyy");
                                    } catch (_e) { }

                                    return (
                                        <tr key={reserva.id} className="hover:bg-[#f8f9fa] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <span className="font-medium text-sm text-[#0f172a] capitalize">{parsedDateLabel}</span>
                                                        <div className="text-xs text-[#94a3b8]">{parsedDateYear}</div>
                                                    </div>
                                                    {isHoy && (
                                                        <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                                                            Hoy
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-semibold text-sm text-[#0f172a]">
                                                    {reserva.hora_inicio} – {reserva.hora_fin}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-[#0f172a]">
                                                    {getCanchaName(reserva.cancha_id)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-sm text-[#0f172a]">{reserva.nombre_cliente}</span>
                                                    <span title={reserva.notas}>
                                                        <MessageSquare className="w-3.5 h-3.5 text-[#64748b]" />
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-[#64748b]">{reserva.telefono}</div>
                                                <div className="text-xs text-[#94a3b8]">{reserva.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={reserva.estado}
                                                    onChange={(e) => handleCambiarEstado(reserva.id, e.target.value)}
                                                    className="text-xs font-medium px-2 py-1 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:outline-none focus:border-[#1e3a5f] cursor-pointer"
                                                >
                                                    <option value="Confirmada">✓ Confirmada</option>
                                                    <option value="Pendiente">⏳ Pendiente</option>
                                                    <option value="Cancelada">✗ Cancelada</option>
                                                    <option value="Completada">✅ Completada</option>
                                                    <option value="No show">👻 No show</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {reserva.pago_estado === 'pagado' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                        Pagado
                                                    </span>
                                                ) : reserva.pago_estado === 'fallido' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                                                        Fallido
                                                    </span>
                                                ) : reserva.metodo_pago === 'efectivo' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Efectivo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                                                        Pendiente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setReservaDetalle(reserva)}
                                                        className="w-8 h-8 rounded-lg bg-[#f8f9fa] hover:bg-[#e2e8f0] text-[#64748b] flex items-center justify-center transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {reserva.estado !== 'Cancelada' && (
                                                        <>
                                                            <button
                                                                onClick={() => setReservaEditando(reserva)}
                                                                className="w-8 h-8 rounded-lg bg-[#f8f9fa] hover:bg-[#e2e8f0] text-[#64748b] flex items-center justify-center transition-colors"
                                                                title="Editar reserva"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setReservaCancelando(reserva.id)}
                                                                className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                                                title="Cancelar reserva"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="block md:hidden space-y-2 p-4">
                        {reservasFiltradas.map((reserva) => {
                            const isHoy = reserva.fecha === todayStr;
                            let parsedDateLabel = reserva.fecha;
                            try {
                                parsedDateLabel = format(new Date(reserva.fecha + 'T12:00:00'), "E d MMM", { locale: es });
                            } catch (_e) { }

                            return (
                                <div key={reserva.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-medium text-sm text-[#0f172a] capitalize">{parsedDateLabel}</span>
                                                {isHoy && (
                                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                                                        Hoy
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">{reserva.hora_inicio} – {reserva.hora_fin}</div>
                                        </div>
                                        <div>
                                            {reserva.pago_estado === 'pagado' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                    Pagado
                                                </span>
                                            ) : reserva.pago_estado === 'fallido' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                                                    Fallido
                                                </span>
                                            ) : reserva.metodo_pago === 'efectivo' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                    Efectivo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
                                                    Pendiente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="font-medium text-sm text-[#0f172a]">{reserva.nombre_cliente}</div>
                                        <div className="text-xs text-gray-500">{getCanchaName(reserva.cancha_id)}</div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <select
                                            value={reserva.estado}
                                            onChange={(e) => handleCambiarEstado(reserva.id, e.target.value)}
                                            className="text-xs font-medium px-2 py-1 rounded-lg border border-[#e2e8f0] bg-white text-[#0f172a] focus:outline-none focus:border-[#1e3a5f] cursor-pointer"
                                        >
                                            <option value="Confirmada">✓ Confirmada</option>
                                            <option value="Pendiente">⏳ Pendiente</option>
                                            <option value="Cancelada">✗ Cancelada</option>
                                            <option value="Completada">✅ Completada</option>
                                            <option value="No show">👻 No show</option>
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setReservaDetalle(reserva)}
                                                className="w-8 h-8 rounded-lg bg-[#f8f9fa] hover:bg-[#e2e8f0] text-[#64748b] flex items-center justify-center transition-colors"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {reserva.estado !== 'Cancelada' && (
                                                <>
                                                    <button
                                                        onClick={() => setReservaEditando(reserva)}
                                                        className="w-8 h-8 rounded-lg bg-[#f8f9fa] hover:bg-[#e2e8f0] text-[#64748b] flex items-center justify-center transition-colors"
                                                        title="Editar reserva"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setReservaCancelando(reserva.id)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                                        title="Cancelar reserva"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>

            {/* MODAL DETALLE */}
            {reservaDetalle && (() => {
                const [hI, mI] = reservaDetalle.hora_inicio.split(':').map(Number);
                const [hF, mF] = reservaDetalle.hora_fin.split(':').map(Number);
                const duracionMin = (hF * 60 + mF) - (hI * 60 + mI);

                const estadoColor: Record<string, string> = {
                    Confirmada: 'bg-green-100 text-green-700 border-green-200',
                    Cancelada: 'bg-red-100 text-red-600 border-red-200',
                    Pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    Completada: 'bg-blue-100 text-blue-700 border-blue-200',
                    'No show': 'bg-gray-100 text-gray-600 border-gray-200',
                };

                const pagoColor: Record<string, string> = {
                    pagado: 'bg-green-100 text-green-700 border-green-200',
                    fallido: 'bg-red-100 text-red-600 border-red-200',
                    pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                };

                let fechaLarga = reservaDetalle.fecha;
                try {
                    fechaLarga = format(new Date(reservaDetalle.fecha + 'T12:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es });
                    fechaLarga = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);
                } catch (_e) { }

                let createdAtLabel = '—';
                if (reservaDetalle.created_at) {
                    try {
                        createdAtLabel = format(new Date(reservaDetalle.created_at), "d MMM yyyy, HH:mm", { locale: es });
                    } catch (_e) { }
                }

                const montoLabel = reservaDetalle.monto_pagado != null
                    ? `$${reservaDetalle.monto_pagado.toFixed(2)} MXN`
                    : reservaDetalle.metodo_pago === 'efectivo'
                        ? 'A cobrar en efectivo'
                        : '—';

                return (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl">
                                <div>
                                    <h3 className="text-lg font-bold text-[#0f172a]">Detalle de reserva</h3>
                                    {reservaDetalle.id_reserva && (
                                        <span className="text-xs text-[#94a3b8] font-mono">{reservaDetalle.id_reserva}</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setReservaDetalle(null)}
                                    className="text-[#64748b] hover:text-[#0f172a] rounded-full p-1.5 hover:bg-[#f1f5f9] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Datos del cliente */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="w-4 h-4 text-[#1e3a5f]" />
                                        <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Datos del cliente</h4>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e2e8f0] grid grid-cols-1 gap-3">
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Nombre</span>
                                            <p className="font-semibold text-[#0f172a] text-sm">{reservaDetalle.nombre_cliente}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-xs text-[#94a3b8]">Teléfono</span>
                                                <p className="font-medium text-[#0f172a] text-sm">{reservaDetalle.telefono}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-[#94a3b8]">Email</span>
                                                <p className="font-medium text-[#0f172a] text-sm break-all">{reservaDetalle.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Detalles de la reserva */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="w-4 h-4 text-[#1e3a5f]" />
                                        <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Detalles de la reserva</h4>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e2e8f0] grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Cancha</span>
                                            <p className="font-semibold text-[#0f172a] text-sm">{getCanchaName(reservaDetalle.cancha_id)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Estado</span>
                                            <div className="mt-0.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estadoColor[reservaDetalle.estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                    {reservaDetalle.estado}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Fecha</span>
                                            <p className="font-medium text-[#0f172a] text-sm capitalize">{fechaLarga}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Horario</span>
                                            <p className="font-semibold text-[#0f172a] text-sm">{reservaDetalle.hora_inicio} – {reservaDetalle.hora_fin}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Duración</span>
                                            <p className="font-medium text-[#0f172a] text-sm">{duracionMin} min</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Creada el</span>
                                            <p className="font-medium text-[#0f172a] text-sm">{createdAtLabel}</p>
                                        </div>
                                        {reservaDetalle.notas && (
                                            <div className="col-span-2">
                                                <span className="text-xs text-[#94a3b8]">Notas del cliente</span>
                                                <p className="font-medium text-[#0f172a] text-sm mt-0.5 whitespace-pre-line">{reservaDetalle.notas}</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Información de pago */}
                                <section>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard className="w-4 h-4 text-[#1e3a5f]" />
                                        <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Información de pago</h4>
                                    </div>
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e2e8f0] grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Método</span>
                                            <p className="font-semibold text-[#0f172a] text-sm capitalize">
                                                {reservaDetalle.metodo_pago === 'efectivo' ? 'Efectivo' : reservaDetalle.metodo_pago === 'online' ? 'Online (Stripe)' : '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-[#94a3b8]">Estado del pago</span>
                                            <div className="mt-0.5">
                                                {reservaDetalle.pago_estado ? (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${pagoColor[reservaDetalle.pago_estado] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                        {reservaDetalle.pago_estado.charAt(0).toUpperCase() + reservaDetalle.pago_estado.slice(1)}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-[#94a3b8]">—</span>
                                                )}
                                                {reservaDetalle.metodo_pago === 'efectivo' && reservaDetalle.pago_estado !== 'pagado' && (
                                                    <button
                                                        onClick={() => handleMarcarPagado(reservaDetalle.id)}
                                                        disabled={loadingPago}
                                                        className={`mt-2 block bg-green-600 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-green-700 transition-colors ${loadingPago ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        {loadingPago ? 'Guardando...' : 'Marcar como pagado'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-xs text-[#94a3b8]">Monto</span>
                                            <p className="font-bold text-[#0f172a] text-base">{montoLabel}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MODAL CANCELAR */}
            {reservaCancelando && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-center text-[#0f172a]">¿Cancelar esta reserva?</h3>
                        <p className="text-[#64748b] text-sm text-center mt-2 mb-6">Esta acción liberará el horario de la cancha en la base de datos.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleCancelar}
                                disabled={loading}
                                className={`bg-red-500 text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-red-600 transition-colors ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? 'Cancelando...' : 'Sí, cancelar'}
                            </button>
                            <button
                                onClick={() => setReservaCancelando(null)}
                                disabled={loading}
                                className="border border-[#e2e8f0] hover:bg-[#f8f9fa] text-[#64748b] font-medium rounded-xl px-6 py-2.5 transition-colors"
                            >
                                No, mantener
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NUEVA RESERVA */}
            {nuevaReservaOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-[#e2e8f0] sticky top-0 bg-white rounded-t-2xl">
                            <h3 className="text-lg font-bold text-[#0f172a]">Nueva reserva</h3>
                            <button
                                onClick={() => setNuevaReservaOpen(false)}
                                className="text-[#64748b] hover:text-[#0f172a] rounded-full p-1.5 hover:bg-[#f1f5f9] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Cancha */}
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Cancha <span className="text-red-500">*</span></label>
                                <select
                                    value={nuevaReservaForm.cancha_id}
                                    onChange={(e) => setNuevaReservaForm(f => ({ ...f, cancha_id: e.target.value }))}
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                >
                                    {canchas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={nuevaReservaForm.fecha}
                                    onChange={(e) => setNuevaReservaForm(f => ({ ...f, fecha: e.target.value }))}
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            {/* Hora inicio + Duración */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora inicio <span className="text-red-500">*</span></label>
                                    <select
                                        value={nuevaReservaForm.hora_inicio}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, hora_inicio: e.target.value }))}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    >
                                        {HORARIOS.map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Duración</label>
                                    <select
                                        value={nuevaReservaForm.duracion}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, duracion: Number(e.target.value) }))}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    >
                                        <option value={60}>60 min</option>
                                        <option value={90}>90 min</option>
                                        <option value={120}>120 min</option>
                                        <option value={150}>150 min</option>
                                        <option value={180}>180 min</option>
                                    </select>
                                </div>
                            </div>

                            {/* Hora fin calculada */}
                            <p className="text-xs text-[#94a3b8]">
                                Hora fin: <span className="font-semibold text-[#64748b]">{calcHoraFin(nuevaReservaForm.hora_inicio, nuevaReservaForm.duracion)}</span>
                            </p>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Nombre cliente <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={nuevaReservaForm.nombre_cliente}
                                    onChange={(e) => setNuevaReservaForm(f => ({ ...f, nombre_cliente: e.target.value }))}
                                    placeholder="Ej: Juan Pérez"
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            {/* Teléfono + Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Teléfono <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={nuevaReservaForm.telefono}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, telefono: e.target.value }))}
                                        placeholder="Ej: 5512345678"
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={nuevaReservaForm.email}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="opcional"
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Notas</label>
                                <textarea
                                    rows={2}
                                    value={nuevaReservaForm.notas}
                                    onChange={(e) => setNuevaReservaForm(f => ({ ...f, notas: e.target.value }))}
                                    placeholder="opcional"
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            {/* Método de pago + Estado */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Método de pago</label>
                                    <select
                                        value={nuevaReservaForm.metodo_pago}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, metodo_pago: e.target.value as 'efectivo' | 'online' }))}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Estado</label>
                                    <select
                                        value={nuevaReservaForm.estado}
                                        onChange={(e) => setNuevaReservaForm(f => ({ ...f, estado: e.target.value as 'Confirmada' | 'Pendiente' }))}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    >
                                        <option value="Confirmada">Confirmada</option>
                                        <option value="Pendiente">Pendiente</option>
                                    </select>
                                </div>
                            </div>

                            {/* Error */}
                            {errorNueva && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{errorNueva}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button
                                onClick={() => setNuevaReservaOpen(false)}
                                disabled={loadingNueva}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleNuevaReserva}
                                disabled={loadingNueva}
                                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${loadingNueva ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loadingNueva ? 'Creando...' : 'Crear reserva'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR */}
            {reservaEditando && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-[#0f172a]">Editar reserva</h3>
                            <button onClick={() => setReservaEditando(null)} className="text-[#64748b] hover:text-[#0f172a] rounded-full p-1 hover:bg-[#f8f9fa]">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Info estática */}
                        <div className="bg-[#f8f9fa] rounded-xl p-4 mb-6 border border-[#e2e8f0]">
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div><span className="text-[#64748b] block text-xs">Cliente</span> <span className="font-semibold text-[#0f172a]">{reservaEditando.nombre_cliente}</span></div>
                                <div><span className="text-[#64748b] block text-xs">Cancha</span> <span className="font-semibold text-[#0f172a]">{getCanchaName(reservaEditando.cancha_id)}</span></div>
                                <div><span className="text-[#64748b] block text-xs">Teléfono</span> <span className="font-medium text-[#0f172a]">{reservaEditando.telefono}</span></div>
                                <div><span className="text-[#64748b] block text-xs">Email</span> <span className="font-medium text-[#0f172a]">{reservaEditando.email}</span></div>
                            </div>
                        </div>

                        {/* Formulario de edición */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha</label>
                                <input
                                    type="date"
                                    value={reservaEditando.fecha}
                                    onChange={(e) => setReservaEditando({ ...reservaEditando, fecha: e.target.value })}
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora inicio</label>
                                    <input
                                        type="time"
                                        value={reservaEditando.hora_inicio}
                                        onChange={handleChangeEditHoraInicio}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora fin</label>
                                    <input
                                        type="time"
                                        value={reservaEditando.hora_fin}
                                        onChange={(e) => setReservaEditando({ ...reservaEditando, hora_fin: e.target.value })}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Notas adicionales</label>
                                <textarea
                                    rows={2}
                                    value={reservaEditando.notas || ''}
                                    onChange={(e) => setReservaEditando({ ...reservaEditando, notas: e.target.value })}
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setReservaEditando(null)}
                                disabled={loading}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleEditar}
                                disabled={loading}
                                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
