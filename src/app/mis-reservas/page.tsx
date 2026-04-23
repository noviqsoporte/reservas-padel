"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "@/hooks/useSession";
import { LogOut, Calendar, Clock, MapPin, X, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface ReservaItem {
    id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
    notas?: string;
    monto_pagado?: number | null;
    canchas?: { nombre: string; precio: number } | null;
}

const estadoColors: Record<string, string> = {
    Confirmada: "bg-green-50 text-green-700 border-green-200",
    Pendiente: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Cancelada: "bg-red-50 text-red-600 border-red-200",
    Completada: "bg-blue-50 text-blue-700 border-blue-200",
    "No show": "bg-gray-100 text-gray-600 border-gray-200",
};

const ESTADOS_CANCELABLES = ["Confirmada", "Pendiente"];
const LIMITE_CANCELACION_MS = 4 * 60 * 60 * 1000; // 4 horas

function puedesCancelar(reserva: ReservaItem): boolean {
    if (!ESTADOS_CANCELABLES.includes(reserva.estado)) return false;
    const fechaHora = new Date(`${reserva.fecha}T${reserva.hora_inicio}`);
    return fechaHora.getTime() - Date.now() > LIMITE_CANCELACION_MS;
}

function esCancelableEstado(reserva: ReservaItem): boolean {
    return ESTADOS_CANCELABLES.includes(reserva.estado);
}

function MisReservasContent() {
    const { user, profile, loading, signOut } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [reservas, setReservas] = useState<ReservaItem[]>([]);
    const [loadingReservas, setLoadingReservas] = useState(true);
    const [showBanner, setShowBanner] = useState(searchParams.get("pago") === "exitoso");
    const [reservaACancelar, setReservaACancelar] = useState<ReservaItem | null>(null);
    const [cancelando, setCancelando] = useState(false);

    useEffect(() => {
        if (!showBanner) return;
        const timer = setTimeout(() => setShowBanner(false), 5000);
        return () => clearTimeout(timer);
    }, [showBanner]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth?next=/mis-reservas");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        fetch("/api/reservas/mis")
            .then((r) => r.json())
            .then((data) => setReservas(data.reservas ?? []))
            .catch(console.error)
            .finally(() => setLoadingReservas(false));
    }, [user]);

    async function handleCancelar() {
        if (!reservaACancelar) return;
        setCancelando(true);
        try {
            const res = await fetch(`/api/reservas/${reservaACancelar.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: "Cancelada" }),
            });
            if (!res.ok) throw new Error("Error al cancelar");
            setReservas((prev) =>
                prev.map((r) => r.id === reservaACancelar.id ? { ...r, estado: "Cancelada" } : r)
            );
            setReservaACancelar(null);
        } catch {
            alert("No se pudo cancelar la reserva. Intenta de nuevo.");
        } finally {
            setCancelando(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0057FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f8f9fa]">
            {/* Header */}
            <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-[#0057FF] font-bold text-xl leading-none -mt-1">•</span>
                        <span className="text-[#0057FF] font-bold text-xl tracking-tight">Lood</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-[#64748b]">{profile?.nombre ?? user.email}</span>
                        <button
                            onClick={async () => { await signOut(); router.push("/"); }}
                            className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-red-500 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {showBanner && (
                <div className="bg-green-50 border-b border-green-200">
                    <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-sm text-green-800 font-medium flex-1">
                            ¡Pago confirmado! Tu reserva ha sido registrada correctamente.
                        </p>
                        <button onClick={() => setShowBanner(false)} className="text-green-600 hover:text-green-800 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-3xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Mis reservas</h1>
                <p className="text-[#64748b] text-sm mb-8">Historial de reservas de tu cuenta</p>

                {loadingReservas ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 animate-pulse h-28" />
                        ))}
                    </div>
                ) : reservas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center">
                        <Calendar className="w-10 h-10 text-[#94a3b8] mx-auto mb-3" />
                        <p className="text-[#0f172a] font-medium mb-1">Sin reservas aún</p>
                        <p className="text-sm text-[#64748b] mb-6">Tus reservas aparecerán aquí una vez que hagas la primera.</p>
                        <Link
                            href="/#reservar"
                            className="bg-[#0057FF] text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#0041cc] transition-colors"
                        >
                            Reservar una cancha
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reservas.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 text-[#0f172a] font-semibold">
                                            <MapPin className="w-4 h-4 text-[#0057FF]" />
                                            {r.canchas?.nombre ?? "Cancha"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <Calendar className="w-4 h-4" />
                                            <span className="capitalize">
                                                {format(new Date(r.fecha + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[#64748b]">
                                            <Clock className="w-4 h-4" />
                                            {r.hora_inicio} – {r.hora_fin}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${estadoColors[r.estado] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                            {r.estado}
                                        </span>
                                        {(r.monto_pagado ?? r.canchas?.precio) ? (
                                            <span className="text-sm font-bold text-[#0057FF]">${r.monto_pagado ?? r.canchas?.precio}</span>
                                        ) : null}
                                    </div>
                                </div>
                                {esCancelableEstado(r) && (
                                    <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                                        {puedesCancelar(r) ? (
                                            <button
                                                onClick={() => setReservaACancelar(r)}
                                                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                                            >
                                                Cancelar reserva
                                            </button>
                                        ) : (
                                            <p className="text-xs text-[#94a3b8]">
                                                No se puede cancelar (menos de 4h para la reserva)
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {reservaACancelar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <h2 className="text-[#0f172a] font-semibold text-base">Cancelar reserva</h2>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-xl p-4 mb-4 space-y-1.5 text-sm text-[#475569]">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#0057FF]" />
                                <span className="font-medium text-[#0f172a]">{reservaACancelar.canchas?.nombre ?? "Cancha"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span className="capitalize">
                                    {format(new Date(reservaACancelar.fecha + "T12:00:00"), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {reservaACancelar.hora_inicio} – {reservaACancelar.hora_fin}
                            </div>
                        </div>

                        <p className="text-sm text-[#64748b] mb-6">
                            ¿Estás seguro que deseas cancelar esta reserva? Esta acción no se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setReservaACancelar(null)}
                                disabled={cancelando}
                                className="flex-1 border border-[#e2e8f0] text-[#0f172a] text-sm font-medium py-2.5 rounded-xl hover:bg-[#f8f9fa] transition-colors disabled:opacity-50"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCancelar}
                                disabled={cancelando}
                                className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {cancelando ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : null}
                                Sí, cancelar reserva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MisReservasPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0057FF] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <MisReservasContent />
        </Suspense>
    );
}
