"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "react-hot-toast";
import { CheckCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Cancha, SlotHorario } from "@/types";
import { useSession } from "@/hooks/useSession";
import { createClient } from "@/lib/supabase/client";

const DURACIONES = [
    { label: "1h", minutos: 60 },
    { label: "1.5h", minutos: 90 },
    { label: "2h", minutos: 120 },
    { label: "2.5h", minutos: 150 },
    { label: "3h", minutos: 180 },
];

const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

const slotContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

const slotItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export default function ReservaWizard() {
    const { user, profile, signOut } = useSession();
    const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [canchas, setCanchas] = useState<Cancha[]>([]);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | null>(null);
    const [fecha, setFecha] = useState<string>("");
    const [duracion, setDuracion] = useState<number>(60);
    const [slotSeleccionado, setSlotSeleccionado] = useState<SlotHorario | null>(null);
    const [slots, setSlots] = useState<SlotHorario[]>([]);
    const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
    const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false);
    const [guardarDatos, setGuardarDatos] = useState(false);
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'online' | null>(null);

    const [formData, setFormData] = useState({ nombre: "", telefono: "", email: "", notas: "" });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Precargar datos del perfil cuando hay sesión
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                nombre: profile.nombre ?? prev.nombre,
                telefono: profile.telefono ?? prev.telefono,
                email: profile.email ?? prev.email,
            }));
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email ?? prev.email,
            }));
        }
    }, [profile, user]);

    useEffect(() => {
        async function fetchCanchas() {
            try {
                const res = await fetch("/api/canchas");
                if (res.ok) {
                    const data = await res.json();
                    setCanchas(data.canchas || []);

                    // Restore pending reservation (after login redirect)
                    const pendingRaw = sessionStorage.getItem("reserva_pendiente");
                    if (pendingRaw && data.canchas) {
                        try {
                            const pending = JSON.parse(pendingRaw);
                            const cancha = data.canchas.find((c: Cancha) => c.id === pending.canchaId);
                            if (cancha) {
                                setCanchaSeleccionada(cancha);
                                setFecha(pending.fecha);
                                setDuracion(pending.duracion);
                                setSlotSeleccionado(pending.slotSeleccionado);
                                setMetodoPago(pending.metodoPago);
                                setDirection(1);
                                setStep(3);
                            }
                        } catch {
                            // ignore malformed data
                        }
                        sessionStorage.removeItem("reserva_pendiente");
                        return;
                    }

                    const preseleccionada = sessionStorage.getItem("cancha_preseleccionada");
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

    const today = new Date().toISOString().split("T")[0];
    const maxDate = addDays(new Date(), 30).toISOString().split("T")[0];

    const fetchSlots = async (dur: number = duracion) => {
        if (!canchaSeleccionada || !fecha) return;
        setLoadingSlots(true);
        setSlotSeleccionado(null);

        try {
            const res = await fetch(
                `/api/disponibilidad?cancha_id=${canchaSeleccionada.id}&fecha=${fecha}&duracion=${dur}`
            );
            if (res.ok) {
                const data = await res.json();
                setSlots(data.slots || []);
            } else {
                toast.error("No se pudieron cargar los horarios");
            }
        } catch {
            toast.error("Error al cargar disponibilidad");
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleVerHorarios = async () => {
        if (!canchaSeleccionada || !fecha) return;
        setDirection(1);
        setStep(2);
        await fetchSlots(duracion);
    };

    const handleDuracionChange = async (nuevaDuracion: number) => {
        setDuracion(nuevaDuracion);
        if (step === 2) {
            await fetchSlots(nuevaDuracion);
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

    const handleConfirmarConLogin = () => {
        if (!canchaSeleccionada || !fecha || !slotSeleccionado || !metodoPago) return;
        sessionStorage.setItem("reserva_pendiente", JSON.stringify({
            canchaId: canchaSeleccionada.id,
            fecha,
            duracion,
            slotSeleccionado,
            metodoPago,
        }));
        window.location.href = `/auth?next=${encodeURIComponent("/reserva/retomar")}`;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !canchaSeleccionada || !fecha || !slotSeleccionado || !metodoPago) return;
        setLoadingSubmit(true);

        try {
            // Obtener profile_id si hay sesión activa
            const profileId = profile?.id ?? undefined;

            const res = await fetch("/api/reservas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cancha_id: canchaSeleccionada.id,
                    fecha,
                    hora_inicio: slotSeleccionado.hora_inicio,
                    hora_fin: slotSeleccionado.hora_fin,
                    nombre_cliente: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email,
                    notas: formData.notas,
                    metodo_pago: metodoPago,
                    monto: slotSeleccionado.precio ?? canchaSeleccionada.precio,
                    duracion,
                    ...(profileId ? { profile_id: profileId } : {}),
                }),
            });

            if (res.ok) {
                const reservaData = await res.json();
                const reservaId = reservaData.id ?? reservaData.reserva?.id;

                // Guardar lead siempre con fuente='reserva'
                if (!user) {
                    const supabase = createClient();
                    await supabase.from("leads").upsert(
                        { email: formData.email, fuente: "reserva" },
                        { onConflict: "email" }
                    );

                    if (guardarDatos) {
                        await supabase.auth.signInWithOtp({
                            email: formData.email,
                            options: { shouldCreateUser: true },
                        });
                    }
                }

                if (metodoPago === 'online' && reservaId && canchaSeleccionada && slotSeleccionado) {
                    const checkoutRes = await fetch("/api/pagos/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            reserva_id: reservaId,
                            cancha_nombre: canchaSeleccionada.nombre,
                            fecha,
                            hora_inicio: slotSeleccionado.hora_inicio,
                            hora_fin: slotSeleccionado.hora_fin,
                            monto: slotSeleccionado.precio ?? canchaSeleccionada.precio,
                            email: formData.email,
                            nombre: formData.nombre,
                        }),
                    });

                    if (checkoutRes.ok) {
                        const { url } = await checkoutRes.json();
                        sessionStorage.removeItem("cancha_preseleccionada");
                        window.location.href = url;
                        return;
                    } else {
                        toast.error("Error al iniciar el pago. Intenta de nuevo.");
                        setLoadingSubmit(false);
                        return;
                    }
                }

                setDirection(1);
                setStep("success");
                sessionStorage.removeItem("cancha_preseleccionada");
                toast.success("Reserva creada con éxito");
            } else if (res.status === 409) {
                toast.error("Este horario ya fue reservado. Por favor elige otro.");
            } else {
                toast.error("Hubo un error. Intenta de nuevo.");
            }
        } catch {
            toast.error("Hubo un error de conexión.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setDirection(1);
        setCanchaSeleccionada(null);
        setFecha("");
        setDuracion(60);
        setSlotSeleccionado(null);
        setFormData({ nombre: "", telefono: "", email: "", notas: "" });
        setFormErrors({});
        setMetodoPago(null);
        setGuardarDatos(false);
    };

    const duracionLabel = DURACIONES.find((d) => d.minutos === duracion)?.label ?? `${duracion}min`;

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-8">
            {/* STEPPER */}
            {step !== "success" && (
                <div className="mb-10 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 z-0 flex">
                            <div className={`h-full w-1/2 ${step >= 2 ? "bg-[#0057FF]" : "bg-[#e2e8f0]"} transition-colors duration-300`} />
                            <div className={`h-full w-1/2 ${step >= 3 ? "bg-[#0057FF]" : "bg-[#e2e8f0]"} transition-colors duration-300`} />
                        </div>

                        {[
                            { n: 1, label: "Cancha y fecha" },
                            { n: 2, label: "Horario" },
                            { n: 3, label: "Tus datos" },
                        ].map(({ n, label }) => (
                            <div key={n} className="flex flex-col items-center relative z-10 w-24">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300
                                    ${step >= n ? "bg-[#0057FF] text-white border-2 border-[#0057FF]" : "bg-white border-2 border-[#e2e8f0] text-[#94a3b8]"}`}>
                                    {n}
                                </div>
                                <span className={`text-xs mt-2 absolute top-8 whitespace-nowrap ${n === 3 ? "flex justify-end w-full" : n === 2 ? "flex justify-center w-full" : ""} ${step >= n ? "text-[#0057FF] font-medium" : "text-[#64748b]"}`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* WIZARD CONTENT */}
            <div className="mt-8 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>

                    {/* STEP 1 */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Cancha */}
                                <div>
                                    <h3 className="font-semibold text-[#0f172a] mb-3">¿Cuál cancha quieres?</h3>
                                    <div className="space-y-3">
                                        {canchas.map((cancha) => (
                                            <div
                                                key={cancha.id}
                                                onClick={() => cancha.activa && setCanchaSeleccionada(cancha)}
                                                className={`border rounded-xl p-4 transition-all ${
                                                    !cancha.activa
                                                        ? "opacity-40 cursor-not-allowed border-[#e2e8f0]"
                                                        : canchaSeleccionada?.id === cancha.id
                                                        ? "border-[#0057FF] bg-[#0057FF]/5 cursor-pointer"
                                                        : "border-[#e2e8f0] hover:border-[#0057FF]/40 cursor-pointer"
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-semibold text-[#0f172a]">{cancha.nombre}</span>
                                                    {cancha.activa ? (
                                                        <span className="text-[#0057FF] font-bold">
                                                            {cancha.precio > 0 ? `$${cancha.precio}` : "Consultar"}
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

                                {/* Fecha + Duración */}
                                <div>
                                    <h3 className="font-semibold text-[#0f172a] mb-3">¿Qué día quieres jugar?</h3>
                                    <input
                                        type="date"
                                        min={today}
                                        max={maxDate}
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        className="w-full border border-[#e2e8f0] rounded-xl p-3 focus:outline-none focus:border-[#0057FF] focus:ring-1 focus:ring-[#0057FF] text-[#0f172a]"
                                    />

                                    {/* Duration selector */}
                                    {canchaSeleccionada && fecha && (
                                        <div className="mt-5">
                                            <h4 className="text-sm font-medium text-[#0f172a] mb-2">Duración de la sesión</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {DURACIONES.map((d) => (
                                                    <button
                                                        key={d.minutos}
                                                        type="button"
                                                        onClick={() => setDuracion(d.minutos)}
                                                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                                                            duracion === d.minutos
                                                                ? "bg-[#0057FF] text-white border-[#0057FF]"
                                                                : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0057FF]/50 hover:text-[#0057FF]"
                                                        }`}
                                                    >
                                                        {d.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {canchaSeleccionada && fecha && (
                                        <div className="bg-[#f8f9fa] rounded-xl p-4 mt-5 border border-[#e2e8f0]">
                                            <span className="text-xs text-[#64748b] block mb-2 uppercase tracking-wide font-medium">Resumen:</span>
                                            <p className="text-[#0f172a]"><span className="font-semibold">Cancha:</span> {canchaSeleccionada.nombre}</p>
                                            <p className="text-[#0f172a] capitalize">
                                                <span className="font-semibold">Fecha:</span>{" "}
                                                {format(new Date(fecha + "T12:00:00"), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                                            </p>
                                            <p className="text-[#0f172a]"><span className="font-semibold">Duración:</span> {duracionLabel}</p>
                                        </div>
                                    )}

                                    {canchaSeleccionada && fecha && (
                                        <button
                                            onClick={handleVerHorarios}
                                            className="btn-shimmer bg-[#0057FF] text-white font-semibold w-full py-3.5 rounded-xl mt-5 hover:bg-[#0041cc] transition-colors"
                                        >
                                            Ver horarios disponibles &rarr;
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && canchaSeleccionada && fecha && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                            <button
                                onClick={() => { setDirection(-1); setStep(1); }}
                                className="text-[#64748b] text-sm hover:text-[#0f172a] mb-6 inline-flex items-center"
                            >
                                &larr; Cambiar cancha o fecha
                            </button>

                            <div className="mb-5">
                                <h3 className="text-[#0f172a] font-semibold text-lg">
                                    {canchaSeleccionada.nombre} ·{" "}
                                    <span className="capitalize">
                                        {format(new Date(fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                                    </span>
                                </h3>
                                <p className="text-[#64748b] text-sm mt-1">Selecciona el horario para tu reserva</p>
                            </div>

                            {/* Duration selector in step 2 (to allow changing and recalculating) */}
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                <span className="text-sm text-[#64748b] font-medium">Duración:</span>
                                {DURACIONES.map((d) => (
                                    <button
                                        key={d.minutos}
                                        type="button"
                                        onClick={() => handleDuracionChange(d.minutos)}
                                        className={`px-3.5 py-1 rounded-full text-sm font-medium border transition-all duration-150 ${
                                            duracion === d.minutos
                                                ? "bg-[#0057FF] text-white border-[#0057FF]"
                                                : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#0057FF]/50 hover:text-[#0057FF]"
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>

                            {loadingSlots ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="bg-[#f1f5f9] animate-pulse rounded-xl h-16 w-full" />
                                    ))}
                                </div>
                            ) : slots.length > 0 ? (
                                <>
                                    <motion.div
                                        className="grid grid-cols-3 sm:grid-cols-4 gap-3"
                                        key={`slots-${duracion}`}
                                        variants={slotContainer}
                                        initial="hidden"
                                        animate="show"
                                    >
                                        {slots.map((slot, index) => {
                                            const isSelected = slotSeleccionado?.hora_inicio === slot.hora_inicio;

                                            if (slot.disponible) {
                                                return (
                                                    <motion.button
                                                        key={index}
                                                        variants={slotItem}
                                                        onClick={() => setSlotSeleccionado(slot)}
                                                        className={`relative flex flex-col items-center justify-center rounded-xl py-3 text-sm font-medium transition-all ${
                                                            isSelected
                                                                ? "bg-[#0057FF] text-white border-2 border-[#0057FF]"
                                                                : "border border-[#e2e8f0] bg-white text-[#0f172a] hover:border-[#0057FF] hover:bg-[#0057FF]/5"
                                                        }`}
                                                    >
                                                        {slot.es_pico && (
                                                            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                                                                isSelected ? "bg-orange-300 text-orange-900" : "bg-orange-100 text-orange-600"
                                                            }`}>
                                                                PICO
                                                            </span>
                                                        )}
                                                        <span className="text-base">{slot.hora_inicio}</span>
                                                        <span className={`text-xs mt-0.5 ${isSelected ? "opacity-90" : "opacity-70 text-[#64748b]"}`}>
                                                            {duracionLabel}
                                                        </span>
                                                        {slot.precio !== undefined && slot.precio > 0 && (
                                                            <span className={`text-xs font-semibold mt-0.5 ${isSelected ? "text-white/90" : "text-[#0057FF]"}`}>
                                                                ${slot.precio}
                                                            </span>
                                                        )}
                                                    </motion.button>
                                                );
                                            } else {
                                                return (
                                                    <motion.div
                                                        key={index}
                                                        variants={slotItem}
                                                        className="flex flex-col items-center justify-center bg-[#f8f9fa] text-[#94a3b8] border border-[#e2e8f0] rounded-xl py-3 cursor-not-allowed opacity-60"
                                                    >
                                                        <span className="text-base">{slot.hora_inicio}</span>
                                                        <span className="text-xs mt-1">Ocupado</span>
                                                    </motion.div>
                                                );
                                            }
                                        })}
                                    </motion.div>

                                    <div className="mt-8 flex justify-end">
                                        {slotSeleccionado && (
                                            <button
                                                onClick={() => { setDirection(1); setStep(3); }}
                                                className="btn-shimmer bg-[#0057FF] text-white font-semibold py-3.5 px-8 rounded-xl hover:bg-[#0041cc] transition-colors w-full sm:w-auto"
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
                                        onClick={() => { setDirection(-1); setStep(1); }}
                                        className="text-[#0057FF] font-semibold hover:underline"
                                    >
                                        Probar con otra fecha
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && canchaSeleccionada && fecha && slotSeleccionado && (
                        <motion.div
                            key="step3"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Formulario */}
                                <div>
                                    <button
                                        onClick={() => { setDirection(-1); setStep(2); }}
                                        className="text-[#64748b] text-sm hover:text-[#0f172a] mb-6 inline-flex items-center"
                                    >
                                        &larr; Cambiar horario
                                    </button>

                                    <h3 className="font-semibold text-[#0f172a] mb-4 text-xl">Tus Datos</h3>

                                    {/* Banner de sesión activa */}
                                    {user && (
                                        <div className="flex items-center justify-between bg-[#f0f7ff] border border-[#0057FF]/20 rounded-xl px-4 py-3 mb-4">
                                            <p className="text-sm text-[#0f172a]">
                                                Reservando como <strong>{profile?.nombre ?? user.email}</strong>
                                            </p>
                                            <button
                                                onClick={signOut}
                                                className="flex items-center gap-1 text-xs text-[#64748b] hover:text-red-500 transition-colors"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                                Salir
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-4 text-left">
                                        {[
                                            { key: "nombre", label: "Nombre completo", type: "text", placeholder: "Tu nombre aquí" },
                                            { key: "telefono", label: "Teléfono", type: "tel", placeholder: "+52 55 0000 0000" },
                                            { key: "email", label: "Email", type: "email", placeholder: "tu@email.com" },
                                        ].map(({ key, label, type, placeholder }) => (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">{label}</label>
                                                <input
                                                    type={type}
                                                    value={formData[key as keyof typeof formData]}
                                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                                    placeholder={placeholder}
                                                    className={`w-full border ${
                                                        formErrors[key]
                                                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                                            : "border-[#e2e8f0] focus:border-[#0057FF] focus:ring-[#0057FF]"
                                                    } rounded-xl px-4 py-3 focus:outline-none focus:ring-1 text-[#0f172a] bg-white`}
                                                />
                                                {formErrors[key] && (
                                                    <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>
                                                )}
                                            </div>
                                        ))}

                                        <div>
                                            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                                                Notas adicionales{" "}
                                                <span className="text-[#64748b] font-normal">(Opcional)</span>
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={formData.notas}
                                                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                                placeholder="Ej: venimos 4 jugadores..."
                                                className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0057FF] focus:ring-1 focus:ring-[#0057FF] text-[#0f172a] resize-none bg-white"
                                            />
                                        </div>

                                        {/* Checkbox guardar datos — solo si no hay sesión */}
                                        {!user && (
                                            <label className="flex items-start gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={guardarDatos}
                                                    onChange={(e) => setGuardarDatos(e.target.checked)}
                                                    className="mt-0.5 w-4 h-4 rounded border-[#e2e8f0] text-[#0057FF] focus:ring-[#0057FF] cursor-pointer"
                                                />
                                                <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] transition-colors">
                                                    Guardar mis datos para futuras reservas
                                                    <span className="block text-xs text-[#94a3b8] mt-0.5">Recibirás un link por email para activar tu cuenta</span>
                                                </span>
                                            </label>
                                        )}
                                    </div>

                                    {/* Método de pago */}
                                    <div className="mt-6">
                                        <h4 className="font-semibold text-[#0f172a] mb-3">¿Cómo quieres pagar?</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Efectivo */}
                                            <button
                                                type="button"
                                                onClick={() => setMetodoPago('efectivo')}
                                                className={`text-left border-2 rounded-xl p-4 transition-all ${
                                                    metodoPago === 'efectivo'
                                                        ? 'border-[#0057FF] bg-[#0057FF]/5'
                                                        : 'border-[#e2e8f0] hover:border-[#0057FF]/40'
                                                }`}
                                            >
                                                <span className="text-2xl block mb-2">💵</span>
                                                <span className="block font-semibold text-[#0f172a] text-sm">Pagar en efectivo</span>
                                                <span className="block text-xs text-[#64748b] mt-1">Paga el día de tu reserva en el club</span>
                                                <span className="inline-block mt-2 text-xs font-medium bg-[#f1f5f9] text-[#64748b] rounded-full px-2.5 py-0.5">
                                                    Sin cargo adicional
                                                </span>
                                            </button>

                                            {/* Online */}
                                            <button
                                                type="button"
                                                onClick={() => setMetodoPago('online')}
                                                className={`text-left border-2 rounded-xl p-4 transition-all ${
                                                    metodoPago === 'online'
                                                        ? 'border-[#0057FF] bg-[#0057FF]/5'
                                                        : 'border-[#e2e8f0] hover:border-[#0057FF]/40'
                                                }`}
                                            >
                                                <span className="text-2xl block mb-2">💳</span>
                                                <span className="block font-semibold text-[#0f172a] text-sm">Pagar en línea</span>
                                                <span className="block text-xs text-[#64748b] mt-1">Pago seguro con tarjeta de crédito o débito</span>
                                                <span className="inline-block mt-2 text-xs font-medium bg-[#0057FF]/10 text-[#0057FF] rounded-full px-2.5 py-0.5">
                                                    Confirma al instante
                                                </span>
                                            </button>
                                        </div>

                                        {/* Banner aviso pago online sin sesión */}
                                        {metodoPago === 'online' && !user && (
                                            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-3">
                                                <span className="text-base mt-0.5">⚠️</span>
                                                <p className="text-sm text-amber-800">
                                                    Para pagar en línea necesitas una cuenta. Al confirmar te enviaremos un link de acceso a tu correo.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div>
                                    <div className="bg-[#f8f9fa] rounded-2xl p-6 border border-[#e2e8f0] sticky top-24">
                                        <h3 className="font-bold text-[#0f172a] mb-6 text-lg">Resumen de tu reserva</h3>

                                        <div className="space-y-4">
                                            {[
                                                { icon: "🏟️", label: "Cancha:", value: canchaSeleccionada.nombre },
                                                {
                                                    icon: "📅",
                                                    label: "Fecha:",
                                                    value: format(new Date(fecha + "T12:00:00"), "d 'de' MMMM, yyyy", { locale: es }),
                                                    capitalize: true,
                                                },
                                                {
                                                    icon: "🕐",
                                                    label: "Horario:",
                                                    value: `${slotSeleccionado.hora_inicio} – ${slotSeleccionado.hora_fin}`,
                                                },
                                                { icon: "⏱️", label: "Duración:", value: duracionLabel },
                                            ].map(({ icon, label, value, capitalize }) => (
                                                <div key={label} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2 text-[#64748b]">
                                                        <span>{icon}</span>
                                                        <span>{label}</span>
                                                    </div>
                                                    <span className={`font-bold text-[#0f172a] ${capitalize ? "capitalize" : ""}`}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}

                                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e2e8f0]">
                                                <div className="flex items-center gap-2 text-[#64748b]">
                                                    <span>💰</span>
                                                    <span>Total:</span>
                                                    {slotSeleccionado.es_pico && (
                                                        <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">
                                                            Hora pico
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-bold text-[#0057FF] text-lg">
                                                    {slotSeleccionado.precio !== undefined && slotSeleccionado.precio > 0
                                                        ? `$${slotSeleccionado.precio}`
                                                        : canchaSeleccionada.precio > 0 ? `$${canchaSeleccionada.precio}` : "A confirmar"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-[#e2e8f0] my-5" />

                                        <p className="text-xs text-[#64748b] mb-6 leading-relaxed">
                                            Al confirmar recibirás un email con los detalles de tu reserva y las instrucciones de pago si aplican.
                                        </p>

                                        <button
                                            onClick={user ? handleSubmit : handleConfirmarConLogin}
                                            disabled={loadingSubmit || !metodoPago}
                                            className={`btn-shimmer w-full py-4 rounded-xl font-bold flex items-center justify-center transition-colors ${
                                                loadingSubmit
                                                    ? "bg-[#0057FF]/80 text-white cursor-wait"
                                                    : !metodoPago
                                                    ? "bg-[#0057FF]/40 text-white cursor-not-allowed"
                                                    : "bg-[#0057FF] text-white hover:bg-[#0041cc]"
                                            }`}
                                        >
                                            {loadingSubmit ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    {metodoPago === 'online' ? 'Redirigiendo al pago seguro...' : 'Confirmando...'}
                                                </>
                                            ) : (
                                                "Confirmar reserva"
                                            )}
                                        </button>

                                        {!user && metodoPago && (
                                            <p className="text-center mt-3 text-sm text-[#94a3b8]">
                                                ¿No quieres crear cuenta?{" "}
                                                <button
                                                    type="button"
                                                    onClick={handleSubmit}
                                                    disabled={loadingSubmit}
                                                    className="text-[#64748b] hover:text-[#0057FF] underline transition-colors"
                                                >
                                                    Continuar sin cuenta →
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {step === "success" && canchaSeleccionada && fecha && slotSeleccionado && (
                        <motion.div
                            key="success"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="text-center py-12 md:py-16 max-w-xl mx-auto"
                        >
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
                                            {format(new Date(fecha + "T12:00:00"), "d 'de' MMMM", { locale: es })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-[#64748b] mb-1">Horario</span>
                                        <span className="font-semibold text-[#0f172a]">{slotSeleccionado.hora_inicio} – {slotSeleccionado.hora_fin}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-[#64748b] mb-1">Duración</span>
                                        <span className="font-semibold text-[#0f172a]">{duracionLabel}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-[#64748b] mb-1">Titular</span>
                                        <span className="font-semibold text-[#0f172a]">{formData.nombre}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={resetFlow}
                                className="px-8 py-3.5 border border-[#0057FF] text-[#0057FF] font-semibold rounded-xl hover:bg-[#0057FF]/5 transition-colors"
                            >
                                Hacer otra reserva
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
