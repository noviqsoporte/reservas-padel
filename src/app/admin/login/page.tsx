"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!password) return;

        setLoading(true);
        setError(false);

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                router.push('/admin');
                router.refresh();
            } else {
                setError(true);
                setLoading(false);
            }
        } catch (_err) {
            setError(true);
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-10 w-full max-w-md mx-auto">

                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#2563eb] text-2xl font-bold leading-none -mt-1">•</span>
                    <h1 className="text-[#1e3a5f] font-bold text-2xl tracking-tight">Admin</h1>
                </div>
                <p className="text-[#64748b] text-sm mt-1 mb-8">Panel de administración</p>

                <div>
                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full border ${error ? 'border-red-500 focus:ring-red-500' : 'border-[#e2e8f0] focus:border-[#1e3a5f] focus:ring-[#1e3a5f]'} rounded-xl px-4 py-3 focus:outline-none focus:ring-1 text-[#0f172a] bg-white`}
                        placeholder="••••••••"
                    />
                    {error && <p className="text-red-500 text-sm mt-2">Contraseña incorrecta</p>}
                </div>

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={`bg-[#1e3a5f] text-white font-semibold w-full py-3 rounded-xl mt-6 transition-colors ${loading ? 'opacity-80 cursor-wait' : 'hover:bg-[#2563eb]'}`}
                >
                    {loading ? 'Verificando...' : 'Ingresar'}
                </button>

            </div>
        </div>
    );
}
