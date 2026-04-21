"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";

function AuthForm() {
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError("");

        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
        const { error: authError } = await supabase.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
        });

        setLoading(false);
        if (authError) {
            setError("Hubo un error al enviar el link. Intenta de nuevo.");
        } else {
            setSent(true);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {sent ? (
                <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-4"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"
                    >
                        <Mail className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-[#0f172a] mb-2">¡Revisa tu correo!</h2>
                    <p className="text-[#64748b] text-sm leading-relaxed">
                        Te enviamos un link a{" "}
                        <strong className="text-[#0f172a]">{email}</strong>.<br />
                        Haz clic en él para acceder a tu cuenta.
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-4">
                        El link expira en 1 hora. Revisa también tu carpeta de spam.
                    </p>
                    <button
                        onClick={() => { setSent(false); setEmail(""); }}
                        className="mt-6 text-sm text-[#0057FF] hover:underline"
                    >
                        Usar otro correo
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {next && (
                        <div className="flex items-start gap-2.5 bg-[#eff6ff] border border-blue-200 rounded-xl px-4 py-3 mb-6">
                            <span className="text-base mt-0.5">📋</span>
                            <p className="text-sm text-blue-800">
                                Inicia sesión para continuar con tu reserva
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    autoFocus
                                    className="w-full border border-[#e2e8f0] rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20 text-[#0f172a] placeholder:text-[#94a3b8] transition-all bg-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="w-full bg-[#0057FF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0041cc] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Enviar link de acceso
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-[#94a3b8] text-center mt-4">
                        Recibirás el link en menos de 1 minuto.
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const bullets = [
    "Reservas guardadas automáticamente",
    "Historial completo de partidas",
    "Pago en línea más rápido",
];

export default function AuthPage() {
    return (
        <div className="min-h-screen flex">
            {/* ── Left column — 60%, dark blue, desktop only ── */}
            <div className="hidden lg:flex lg:w-[60%] bg-[#0f1e3c] flex-col relative overflow-hidden">
                {/* Decorative blobs */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0057FF]/10 pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#0057FF]/5 pointer-events-none" />

                {/* Logo */}
                <div className="relative px-12 pt-10">
                    <Link href="/" className="flex items-center gap-2 w-fit">
                        <span className="text-[#0057FF] font-bold text-2xl leading-none -mt-1">•</span>
                        <span className="text-white font-bold text-2xl tracking-tight">Lood</span>
                    </Link>
                </div>

                {/* Hero text — centered vertically */}
                <div className="relative flex-1 flex flex-col justify-center px-16">
                    <p className="text-[#4ade80] text-xs font-bold tracking-[0.2em] uppercase mb-5">
                        Club de Pádel
                    </p>
                    <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-5">
                        Bienvenido<br />de vuelta
                    </h1>
                    <p className="text-[#94a3b8] text-lg leading-relaxed max-w-xs">
                        Accede a tu cuenta para ver tus reservas, historial y más.
                    </p>
                </div>

                {/* Bottom bullets */}
                <div className="relative px-16 pb-14 space-y-3.5">
                    {bullets.map((b) => (
                        <div key={b} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#4ade80]/20 flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 text-[#4ade80]" />
                            </div>
                            <span className="text-[#94a3b8] text-sm">{b}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right column — 40% desktop, full mobile ── */}
            <div className="w-full lg:w-[40%] bg-[#f8faff] flex flex-col">
                {/* Mobile-only logo */}
                <div className="lg:hidden px-8 pt-8">
                    <Link href="/" className="flex items-center gap-2 w-fit">
                        <span className="text-[#0057FF] font-bold text-xl leading-none -mt-1">•</span>
                        <span className="text-[#0f172a] font-bold text-xl tracking-tight">Lood</span>
                    </Link>
                </div>

                {/* Form centered vertically */}
                <div className="flex-1 flex items-center justify-center px-8 py-12">
                    <div className="w-full max-w-sm">
                        <div className="mb-8">
                            <h2 className="text-[28px] font-bold text-[#0f172a] mb-2 leading-tight">
                                Inicia sesión
                            </h2>
                            <p className="text-[#64748b] text-sm leading-relaxed">
                                Sin contraseñas. Te enviamos un link directo a tu correo.
                            </p>
                        </div>

                        <Suspense fallback={null}>
                            <AuthForm />
                        </Suspense>

                        <div className="mt-10 text-center">
                            <Link
                                href="/"
                                className="text-sm text-[#94a3b8] hover:text-[#0057FF] transition-colors"
                            >
                                ← Volver al inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
