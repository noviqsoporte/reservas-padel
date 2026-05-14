"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User, Phone, Mail, ArrowLeft, KeyRound } from "lucide-react";

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

function Spinner() {
    return (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

const inputClass =
    "w-full border border-[#e2e8f0] rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20 text-[#0f172a] placeholder:text-[#94a3b8] transition-all bg-white";

const btnPrimary =
    "w-full bg-[#0057FF] text-white font-semibold py-3.5 rounded-xl hover:bg-[#0041cc] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base";

function AuthFormWithTab({
    tab,
    setTab,
}: {
    tab: "login" | "register";
    setTab: (t: "login" | "register") => void;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get("next");

    const [registerStep, setRegisterStep] = useState<"form" | "otp">("form");
    const [loginStep, setLoginStep] = useState<"form" | "otp">("form");
    const [formData, setFormData] = useState({ nombre: "", telefono: "", email: "" });
    const [loginEmail, setLoginEmail] = useState("");
    const [loginNotFound, setLoginNotFound] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
    const [loadingLogin, setLoadingLogin] = useState(false);
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

    // Register: send OTP (shouldCreateUser: true)
    const sendOtp = async () => {
        setLoading(true);
        setError("");
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithOtp({
            email: formData.email.trim().toLowerCase(),
            options: {
                shouldCreateUser: true,
                data: {
                    nombre: formData.nombre.trim(),
                    telefono: formData.telefono.trim(),
                },
            },
        });
        setLoading(false);
        if (authError) {
            const msg = authError.message?.toLowerCase() ?? "";
            if (msg.includes("already registered") || authError.status === 400) {
                setError("Este correo ya tiene una cuenta. Inicia sesión en su lugar.");
                setTab("login");
                setRegisterStep("form");
                setOtpCode("");
            } else {
                setError("Hubo un error al enviar el código. Intenta de nuevo.");
            }
        } else {
            setRegisterStep("otp");
        }
    };

    // Login: send OTP (shouldCreateUser: false)
    const sendLoginOtp = async () => {
        setLoadingLogin(true);
        setError("");
        setLoginNotFound(false);
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithOtp({
            email: loginEmail.trim().toLowerCase(),
            options: { shouldCreateUser: false },
        });
        setLoadingLogin(false);
        if (authError) {
            const msg = authError.message?.toLowerCase() ?? "";
            if (
                authError.status === 400 ||
                authError.status === 422 ||
                msg.includes("not found") ||
                msg.includes("no user") ||
                msg.includes("invalid")
            ) {
                setLoginNotFound(true);
            } else {
                setError("Hubo un error al enviar el código. Intenta de nuevo.");
            }
        } else {
            setLoginStep("otp");
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendOtp();
    };

    const handleLoginOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendLoginOtp();
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const supabase = createClient();
        const email = tab === "login" ? loginEmail : formData.email;
        const { error: verifyError } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otpCode.trim(),
            type: "email",
        });
        setLoading(false);
        if (verifyError) {
            setError("Código incorrecto o expirado. Intenta de nuevo.");
        } else {
            router.push(next ?? "/");
        }
    };

    const switchToLogin = () => {
        setTab("login");
        setRegisterStep("form");
        setLoginStep("form");
        setOtpCode("");
        setLoginNotFound(false);
        // keep error so Fix 1 message shows in login tab
    };

    const switchToRegister = () => {
        setTab("register");
        setRegisterStep("form");
        setLoginStep("form");
        setError("");
        setOtpCode("");
        setLoginNotFound(false);
    };

    const activeOtpEmail = tab === "login" ? loginEmail : formData.email;

    return (
        <AnimatePresence mode="wait">
            {tab === "login" && loginStep === "form" ? (
                <motion.div
                    key="login-form"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
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

                    {error && (
                        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loadingGoogle}
                        className="w-full flex items-center justify-center gap-3 border border-[#e2e8f0] bg-white rounded-xl py-3.5 text-sm font-medium text-[#0f172a] hover:border-[#94a3b8] hover:shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loadingGoogle ? <Spinner /> : <GoogleIcon />}
                        Continuar con Google
                    </button>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <span className="text-xs text-[#94a3b8] whitespace-nowrap">o continúa con tu correo</span>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                    </div>

                    <form onSubmit={handleLoginOtpSubmit} className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                            <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => { setLoginEmail(e.target.value); setLoginNotFound(false); setError(""); }}
                                placeholder="tu@email.com"
                                required
                                className={inputClass}
                            />
                        </div>

                        {loginNotFound && (
                            <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 space-y-2">
                                <p className="text-amber-700">
                                    No encontramos una cuenta con ese correo. ¿Quieres crear una?
                                </p>
                                <button
                                    type="button"
                                    onClick={switchToRegister}
                                    className="text-[#0057FF] font-medium hover:underline"
                                >
                                    Crear cuenta →
                                </button>
                            </div>
                        )}

                        {error && !loginNotFound && (
                            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loadingLogin} className={btnPrimary}>
                            {loadingLogin ? <><Spinner /> Enviando...</> : "Enviar código de acceso"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                        <span className="text-xs text-[#94a3b8] whitespace-nowrap">¿No tienes cuenta?</span>
                        <div className="flex-1 h-px bg-[#e2e8f0]" />
                    </div>

                    <button
                        type="button"
                        onClick={switchToRegister}
                        className="w-full border border-[#0057FF] text-[#0057FF] font-semibold py-3.5 rounded-xl hover:bg-[#0057FF]/5 active:scale-[0.98] transition-all text-base"
                    >
                        Crear cuenta
                    </button>
                </motion.div>
            ) : tab === "login" && loginStep === "otp" ? (
                <motion.div
                    key="login-otp"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-[#eff6ff] rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-7 h-7 text-[#0057FF]" />
                        </div>
                        <p className="text-sm text-[#64748b] leading-relaxed">
                            Ingresa el código que enviamos a{" "}
                            <strong className="text-[#0f172a]">{activeOtpEmail}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                            autoFocus
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-4 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20 text-[#0f172a] placeholder:text-[#94a3b8] transition-all bg-white text-center text-2xl font-bold tracking-[0.4em]"
                        />

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otpCode.length < 6}
                            className={btnPrimary}
                        >
                            {loading ? <><Spinner /> Verificando...</> : "Verificar código"}
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-3 mt-5">
                        <button
                            type="button"
                            onClick={sendLoginOtp}
                            disabled={loadingLogin}
                            className="text-sm text-[#0057FF] hover:underline disabled:opacity-50"
                        >
                            Reenviar código
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLoginStep("form"); setError(""); setOtpCode(""); }}
                            className="text-sm text-[#94a3b8] hover:text-[#0f172a] flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Cambiar email
                        </button>
                    </div>
                </motion.div>
            ) : registerStep === "form" ? (
                <motion.div
                    key="register-form"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                >
                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Nombre completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Tu nombre"
                                    required
                                    autoFocus
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Teléfono
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                    placeholder="+52 55 0000 0000"
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0f172a] mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="tu@email.com"
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loading} className={btnPrimary}>
                            {loading ? <><Spinner /> Enviando...</> : "Crear cuenta"}
                        </button>
                    </form>

                    <p className="text-sm text-[#64748b] text-center mt-5">
                        ¿Ya tienes cuenta?{" "}
                        <button
                            type="button"
                            onClick={switchToLogin}
                            className="text-[#0057FF] hover:underline font-medium"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </motion.div>
            ) : (
                <motion.div
                    key="register-otp"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-[#eff6ff] rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="w-7 h-7 text-[#0057FF]" />
                        </div>
                        <p className="text-sm text-[#64748b] leading-relaxed">
                            Ingresa el código que enviamos a{" "}
                            <strong className="text-[#0f172a]">{activeOtpEmail}</strong>
                        </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            maxLength={6}
                            required
                            autoFocus
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-4 focus:outline-none focus:border-[#0057FF] focus:ring-2 focus:ring-[#0057FF]/20 text-[#0f172a] placeholder:text-[#94a3b8] transition-all bg-white text-center text-2xl font-bold tracking-[0.4em]"
                        />

                        {error && (
                            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || otpCode.length < 6}
                            className={btnPrimary}
                        >
                            {loading ? <><Spinner /> Verificando...</> : "Verificar código"}
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-3 mt-5">
                        <button
                            type="button"
                            onClick={sendOtp}
                            disabled={loading}
                            className="text-sm text-[#0057FF] hover:underline disabled:opacity-50"
                        >
                            Reenviar código
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRegisterStep("form"); setError(""); setOtpCode(""); }}
                            className="text-sm text-[#94a3b8] hover:text-[#0f172a] flex items-center gap-1 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Cambiar email
                        </button>
                    </div>
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
    const [tab, setTab] = useState<"login" | "register">("login");

    return (
        <div className="min-h-screen flex">
            {/* Left column */}
            <div className="hidden lg:flex lg:w-[60%] bg-[#0f1e3c] flex-col relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0057FF]/10 pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-[#0057FF]/5 pointer-events-none" />

                <div className="relative px-12 pt-10">
                    <Link href="/" className="flex items-center gap-2 w-fit">
                        <span className="text-[#0057FF] font-bold text-2xl leading-none -mt-1">•</span>
                        <span className="text-white font-bold text-2xl tracking-tight">Lood</span>
                    </Link>
                </div>

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

            {/* Right column */}
            <div className="w-full lg:w-[40%] bg-[#f8faff] flex flex-col">
                <div className="lg:hidden px-8 pt-8">
                    <Link href="/" className="flex items-center gap-2 w-fit">
                        <span className="text-[#0057FF] font-bold text-xl leading-none -mt-1">•</span>
                        <span className="text-[#0f172a] font-bold text-xl tracking-tight">Lood</span>
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center px-8 py-12">
                    <div className="w-full max-w-sm">
                        {/* Tabs */}
                        <div className="flex bg-[#e2e8f0] rounded-xl p-1 mb-8">
                            {(["login", "register"] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTab(t)}
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                                        tab === t
                                            ? "bg-white text-[#0f172a] shadow-sm"
                                            : "text-[#64748b] hover:text-[#0f172a]"
                                    }`}
                                >
                                    {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
                                </button>
                            ))}
                        </div>

                        <Suspense fallback={null}>
                            <AuthFormWithTab tab={tab} setTab={setTab} />
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
