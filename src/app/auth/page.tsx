"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Check } from "lucide-react";

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
            <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
            <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
            <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>
    );
}

function AuthForm() {
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleGoogleSignIn = async () => {
        setLoadingGoogle(true);
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next || "/")}`,
            },
        });
        setLoadingGoogle(false);
    };

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

                    {/* Google sign-in */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loadingGoogle}
                        className="w-full flex items-center justify-center gap-3 border border-[#e2e8f0] bg-white rounded-xl py-3.5 text-sm font-medium text-[#0f172a] hover:border-[#94a3b8] hover:shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingGoogle ? (
                            <svg className="animate-spin w-4 h-4 text-[#64748b]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <GoogleIcon />
                        )}
                        Continuar con Google
                    </button>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <span className="text-xs text-[#94a3b8] whitespace-nowrap">o continúa con tu correo</span>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                    </div>

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
