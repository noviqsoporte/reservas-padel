"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { CheckCircle } from "lucide-react";
import { Cancha, SlotHorario } from "@/types";

export default function ReservaWizard() {
    const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
    const [canchas, setCanchas] = useState<Cancha[]>([]);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | null>(null);
    const [fecha, setFecha] = useState<string>("");
    const [slotSeleccionado, setSlotSeleccionado] = useState<SlotHorario | null>(null);
    const [slots, setSlots] = useState<SlotHorario[]>([]);
    const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
    const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);

    const [formData, setFormData] = useState({
        nombre: "",
        telefono: "",
        email: "",
        notas: ""
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchCanchas() {
            try {
                const res = await fetch('/api/canchas');
                if (res.ok) {
                    const data = await res.json();
                    setCanchas(data.canchas || []);

                    // Leer preselección
                    const preseleccionada = sessionStorage.getItem('cancha_preseleccionada');
                    if (preseleccionada && data.canchas) {
                        const cancha = data.canchas.find((c: Cancha) => c.id === preseleccionada);
                        if (cancha) setCanchaSeleccionada(cancha);
                    }
                }
            } catch (error) {
                console.error("Error fetching canchas:", error);
            }
        }
        fetchCanchas();
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const maxDate = addDays(new Date(), 30).toISOString().split('T')[0];

    const handleFetchSlots = async () => {
        if (!canchaSeleccionada || !fecha) return;

        setStep(2);
        setLoadingSlots(true);
        setSlotSeleccionado(null);

        try {
            const res = await fetch(`/api/disponibilidad?cancha_id=${canchaSeleccionada.id}&fecha=${fecha}`);
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots || []);
            } else {
                toast.error("No se pudieron cargar los horarios");
            }
        } catch (error) {
            console.error("Error fetching slots:", error);
            toast.error("Error al cargar disponibilidad");
        } finally {
            setLoadingSlots(false);
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!formData.nombre.trim()) errors.nombre = "El nombre es requerido";
        if (!formData.telefono.trim()) errors.telefono = "El teléfono es requerido";
        if (!formData.email.trim()) {
            errors.email = "El email es requerido";
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            errors.email = "El formato de email es inválido";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !canchaSeleccionada || !fecha || !slotSeleccionado) return;

        setLoadingSubmit(true);

        try {
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cancha_id: canchaSeleccionada.id,
                    fecha,
                    hora_inicio: slotSeleccionado.hora_inicio,
                    hora_fin: slotSeleccionado.hora_fin,
                    nombre_cliente: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email,
                    notas: formData.notas
                }),
            });

            if (res.ok) {
                setStep('success');
                sessionStorage.removeItem('cancha_preseleccionada');
                toast.success("Reserva creada con éxito");
            } else if (res.status === 409) {
                toast.error("Este horario ya fue reservado. Por favor elige otro.");
            } else {
                toast.error("Hubo un error. Intenta de nuevo.");
            }
        } catch (error) {
            console.error("Error creating reserva:", error);
            toast.error("Hubo un error de conexión.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setCanchaSeleccionada(null);
        setFecha("");
        setSlotSeleccionado(null);
        setFormData({ nombre: "", telefono: "", email: "", notas: "" });
        setFormErrors({});
    };

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            {/* HEADER WIZARD */}
            {step !== 'success' && (
                <div className="mb-10 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between relative">
                        {/* Líneas conectoras */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 z-0 flex">
                            <div className={`h-full w-1/2 ${step >= 2 ? 'bg-[#1e3a5f]' : 'bg-[#e2e8f0]'} transition-colors duration-300`}></div>
                            <div className={`h-full w-1/2 ${step >= 3 ? 'bg-[#1e3a5f]' : 'bg-[#e2e8f0]'} transition-colors duration-300`}></div>
                        </div>

                        {/* Circulo 1 */}
                        <div className="flex flex-col items-center relative z-10 w-24">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                ${step >= 1 ? 'bg-[#1e3a5f] text-white border-2 border-[#1e3a5f]' : 'bg-white border-2 border-[#e2e8f0] text-[#94a3b8]'}`}>
                                1
                            </div>
                            <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap ${step >= 1 ? 'text-[#1e3a5f] font-medium' : 'text-[#64748b]'}`}>Cancha y fecha</span>
                        </div>

                        {/* Circulo 2 */}
                        <div className="flex flex-col items-center relative z-10 w-24">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                ${step >= 2 ? 'bg-[#1e3a5f] text-white border-2 border-[#1e3a5f]' : 'bg-white border-2 border-[#e2e8f0] text-[#94a3b8]'}`}>
                                2
                            </div>
                            <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap flex justify-center w-full ${step >= 2 ? 'text-[#1e3a5f] font-medium' : 'text-[#64748b]'}`}>Horario</span>
                        </div>

                        {/* Circulo 3 */}
                        <div className="flex flex-col items-center relative z-10 w-24">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                ${step >= 3 ? 'bg-[#1e3a5f] text-white border-2 border-[#1e3a5f]' : 'bg-white border-2 border-[#e2e8f0] text-[#94a3b8]'}`}>
                                3
                            </div>
                            <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap flex justify-end w-full ${step >= 3 ? 'text-[#1e3a5f] font-medium' : 'text-[#64748b]'}`}>Tus datos</span>
                        </div>
                    </div>
                </div>
            )}

            {/* CONTENIDO WIZARD */}
            <div className="mt-8">

                {/* STEP 1: Cancha y Fecha */}
                {step === 1 && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Columna 1: Cancha */}
                            <div>
                                <h3 className="font-semibold text-[#0f172a] mb-3">¿Cuál cancha quieres?</h3>
                                <div className="space-y-3">
                                    {canchas.map(cancha => (
                                        <div
                                            key={cancha.id}
                                            onClick={() => cancha.activa && setCanchaSeleccionada(cancha)}
                                            className={`border rounded-xl p-4 transition-all ${!cancha.activa
                                                    ? 'opacity-40 cursor-not-allowed border-[#e2e8f0]'
                                                    : canchaSeleccionada?.id === cancha.id
                                                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 cursor-pointer'
                                                        : 'border-[#e2e8f0] hover:border-[#1e3a5f]/40 cursor-pointer'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-[#0f172a]">{cancha.nombre}</span>
                                                {cancha.activa ? (
                                                    <span className="text-[#1e3a5f] font-bold">
                                                        {cancha.precio > 0 ? `$${cancha.precio}` : 'Consultar'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                                                        No disponible
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[#64748b] line-clamp-1">{cancha.descripcion}</p>
                                        </div>
                                    ))}
                                    {canchas.length === 0 && (
                                        <div className="text-sm text-[#64748b] italic">Cargando canchas...</div>
                                    )}
                                </div>
                            </div>

                            {/* Columna 2: Fecha */}
                            <div>
                                <h3 className="font-semibold text-[#0f172a] mb-3">¿Qué día quieres jugar?</h3>
                                <input
                                    type="date"
                                    min={today}
                                    max={maxDate}
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    className="w-full border border-[#e2e8f0] rounded-xl p-3 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] text-[#0f172a]"
                                />

                                {canchaSeleccionada && fecha && (
                                    <div className="bg-[#f8f9fa] rounded-xl p-4 mt-6 border border-[#e2e8f0]">
                                        <span className="text-xs text-[#64748b] block mb-2 uppercase tracking-wide font-medium">Resumen:</span>
                                        <p className="text-[#0f172a]"><span className="font-semibold">Cancha:</span> {canchaSeleccionada.nombre}</p>
                                        <p className="text-[#0f172a] capitalize">
                                            <span className="font-semibold">Fecha:</span> {format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                                        </p>
                                    </div>
                                )}

                                {canchaSeleccionada && fecha && (
                                    <button
                                        onClick={handleFetchSlots}
                                        className="bg-[#1e3a5f] text-white font-semibold w-full py-3.5 rounded-xl mt-6 hover:bg-[#2563eb] transition-colors"
                                    >
                                        Ver horarios disponibles &rarr;
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Horarios */}
                {step === 2 && canchaSeleccionada && fecha && (
                    <div>
                        <button
                            onClick={() => setStep(1)}
                            className="text-[#64748b] text-sm hover:text-[#0f172a] mb-6 inline-flex items-center"
                        >
                            &larr; Cambiar cancha o fecha
                        </button>

                        <div className="mb-6">
                            <h3 className="text-[#0f172a] font-semibold text-lg">
                                Cancha {canchaSeleccionada.nombre} · <span className="capitalize">{format(new Date(fecha + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}</span>
                            </h3>
                            <p className="text-[#64748b] text-sm mt-1">Selecciona el horario para tu reserva (60 min)</p>
                        </div>

                        {loadingSlots ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="bg-[#f1f5f9] animate-pulse rounded-xl h-16 w-full"></div>
                                ))}
                            </div>
                        ) : slots.length > 0 ? (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {slots.map((slot, index) => {
                                        const isSelected = slotSeleccionado?.hora_inicio === slot.hora_inicio;

                                        if (slot.disponible) {
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setSlotSeleccionado(slot)}
                                                    className={`flex flex-col items-center justify-center rounded-xl py-3 text-sm font-medium transition-all
                            ${isSelected
                                                            ? 'bg-[#1e3a5f] text-white border-2 border-[#1e3a5f]'
                                                            : 'border border-[#e2e8f0] bg-white text-[#0f172a] hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5'
                                                        }`}
                                                >
                                                    <span className="text-base">{slot.hora_inicio}</span>
                                                    <span className={`text-xs mt-1 ${isSelected ? 'opacity-90' : 'opacity-70 text-[#64748b]'}`}>1 hora</span>
                                                </button>
                                            );
                                        } else {
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex flex-col items-center justify-center bg-[#f8f9fa] text-[#94a3b8] border border-[#e2e8f0] rounded-xl py-3 cursor-not-allowed opacity-60"
                                                >
                                                    <span className="text-base">{slot.hora_inicio}</span>
                                                    <span className="text-xs mt-1">Ocupado</span>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>

                                <div className="mt-8 flex justify-end">
                                    {slotSeleccionado && (
                                        <button
                                            onClick={() => setStep(3)}
                                            className="bg-[#1e3a5f] text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-[#2563eb] transition-colors w-full sm:w-auto"
                                        >
                                            Continuar &rarr;
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 bg-[#f8f9fa] rounded-xl border border-[#e2e8f0]">
                                <p className="text-[#0f172a] font-medium mb-4">No hay horarios disponibles para este día</p>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-[#1e3a5f] font-semibold hover:underline"
                                >
                                    Probar con otra fecha
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Datos */}
                {step === 3 && canchaSeleccionada && fecha && slotSeleccionado && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                            {/* Columna 1: Formulario */}
                            <div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-[#64748b] text-sm hover:text-[#0f172a] mb-6 inline-flex items-center"
                                >
                                    &larr; Cambiar horario
                                </button>

                                <h3 className="font-semibold text-[#0f172a] mb-6 text-xl">Tus Datos</h3>

                                <div className="space-y-4 text-left">
                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Nombre completo</label>
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className={`w-full border ${formErrors.nombre ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 text-[#0f172a] bg-white`}
                                            placeholder="Tu nombre aquí"
                                        />
                                        {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Teléfono</label>
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            placeholder="+52 55 0000 0000"
                                            className={`w-full border ${formErrors.telefono ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 text-[#0f172a] bg-white`}
                                        />
                                        {formErrors.telefono && <p className="text-red-500 text-xs mt-1">{formErrors.telefono}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="tu@email.com"
                                            className={`w-full border ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 text-[#0f172a] bg-white`}
                                        />
                                        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Notas adicionales <span className="text-[#64748b] font-normal">(Opcional)</span></label>
                                        <textarea
                                            rows={3}
                                            value={formData.notas}
                                            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                            placeholder="Ej: venimos 4 jugadores..."
                                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f] text-[#0f172a] resize-none bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Columna 2: Resumen */}
                            <div>
                                <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e2e8f0] sticky top-24">
                                    <h3 className="font-bold text-[#0f172a] mb-6 text-lg">Resumen de tu reserva</h3>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span>🏟️</span> <span>Cancha:</span>
                                            </div>
                                            <span className="font-bold text-[#0f172a]">{canchaSeleccionada.nombre}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span>📅</span> <span>Fecha:</span>
                                            </div>
                                            <span className="font-bold text-[#0f172a] capitalize text-right">
                                                {format(new Date(fecha + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span>🕐</span> <span>Horario:</span>
                                            </div>
                                            <span className="font-bold text-[#0f172a]">{slotSeleccionado.hora_inicio} – {slotSeleccionado.hora_fin}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span>⏱️</span> <span>Duración:</span>
                                            </div>
                                            <span className="font-bold text-[#0f172a]">60 minutos</span>
                                        </div>

                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e2e8f0]">
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span>💰</span> <span>Total:</span>
                                            </div>
                                            <span className="font-bold text-[#1e3a5f] text-lg">
                                                {canchaSeleccionada.precio > 0 ? `$${canchaSeleccionada.precio}` : 'A confirmar'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-[#e2e8f0] my-5"></div>

                                    <p className="text-xs text-[#64748b] mb-6 leading-relaxed">
                                        Al confirmar recibirás un email con los detalles de tu reserva y las instrucciones de pago si aplican.
                                    </p>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loadingSubmit}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-colors 
                      ${loadingSubmit
                                                ? 'bg-[#1e3a5f]/80 text-white cursor-wait'
                                                : 'bg-[#1e3a5f] text-white hover:bg-[#2563eb]'}`}
                                    >
                                        {loadingSubmit ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Confirmando...
                                            </>
                                        ) : (
                                            'Confirmar reserva'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP SUCCESS */}
                {step === 'success' && canchaSeleccionada && fecha && slotSeleccionado && (
                    <div className="text-center py-12 md:py-16 max-w-xl mx-auto">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ animationIterationCount: 1 }}>
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>

                        <h2 className="text-3xl font-bold text-[#0f172a] mb-2">¡Reserva confirmada!</h2>
                        <p className="text-[#64748b] text-lg mb-10">Te esperamos en la cancha. Hemos guardado tus datos.</p>

                        <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e2e8f0] text-left mb-10 shadow-sm">
                            <h3 className="font-bold text-[#0f172a] border-b border-[#e2e8f0] pb-3 mb-4">Detalles confirmados</h3>
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <span className="block text-xs text-[#64748b] mb-1">Cancha</span>
                                    <span className="font-semibold text-[#0f172a]">{canchaSeleccionada.nombre}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-[#64748b] mb-1">Día</span>
                                    <span className="font-semibold text-[#0f172a] capitalize">
                                        {format(new Date(fecha + 'T12:00:00'), "d 'de' MMMM", { locale: es })}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-xs text-[#64748b] mb-1">Horario</span>
                                    <span className="font-semibold text-[#0f172a]">{slotSeleccionado.hora_inicio} – {slotSeleccionado.hora_fin}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-[#64748b] mb-1">Titular</span>
                                    <span className="font-semibold text-[#0f172a]">{formData.nombre}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={resetFlow}
                            className="px-8 py-3.5 border border-[#1e3a5f] text-[#1e3a5f] font-semibold rounded-xl hover:bg-[#1e3a5f]/5 transition-colors"
                        >
                            Hacer otra reserva
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
