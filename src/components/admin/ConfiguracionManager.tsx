"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Config } from "@/types";

interface ConfiguracionManagerProps {
    config: Config;
}

export default function ConfiguracionManager({ config: initialConfig }: ConfiguracionManagerProps) {
    const [form, setForm] = useState<Config>(initialConfig);
    const [loading, setLoading] = useState(false);
    const [guardado, setGuardado] = useState(false);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const handleToggleDia = (dia: string) => {
        setForm(prev => {
            if (prev.dias_operacion.includes(dia)) {
                return { ...prev, dias_operacion: prev.dias_operacion.filter(d => d !== dia) };
            } else {
                return { ...prev, dias_operacion: [...prev.dias_operacion, dia] };
            }
        });
    };

    const handleGuardar = async () => {
        // Basic validation
        if (!form.negocio_nombre.trim()) {
            toast.error("El nombre del negocio es requerido");
            return;
        }

        setLoading(true);

        try {
            // Create updates promise array for each key
            const updates = [];
            const keys = Object.keys(form) as Array<keyof Config>;

            for (const key of keys) {
                let valueStr = form[key];

                // Handle array formatting
                if (key === 'dias_operacion') {
                    valueStr = (form[key] as string[]).join(', ');
                }

                updates.push(
                    fetch('/api/config', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clave: key, valor: typeof valueStr === 'string' ? valueStr : String(valueStr) })
                    })
                );
            }

            const results = await Promise.all(updates);

            const allOk = results.every(res => res.ok);

            if (allOk) {
                setGuardado(true);
                toast.success("Configuración guardada");
                setTimeout(() => setGuardado(false), 2000);
            } else {
                toast.error("Hubo un error al guardar algunas configuraciones");
            }
        } catch (_error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            {/* SECCIÓN 1: Info */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <h2 className="font-bold text-[#0f172a] text-lg">Información del negocio</h2>
                <p className="text-sm text-[#64748b] mt-1">Esta información aparece en la página pública</p>

                <div className="space-y-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Nombre del negocio *</label>
                        <input
                            type="text"
                            value={form.negocio_nombre}
                            onChange={(e) => setForm({ ...form, negocio_nombre: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Dirección</label>
                        <input
                            type="text"
                            value={form.direccion}
                            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Teléfono</label>
                        <input
                            type="tel"
                            value={form.telefono}
                            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Instagram</label>
                        <input
                            type="text"
                            placeholder="@tunegocio"
                            value={form.instagram}
                            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: Horarios */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <h2 className="font-bold text-[#0f172a] text-lg">Horarios de operación</h2>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Horario apertura</label>
                        <input
                            type="text"
                            placeholder="07:00 a.m."
                            value={form.horario_apertura}
                            onChange={(e) => setForm({ ...form, horario_apertura: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Horario cierre</label>
                        <input
                            type="text"
                            placeholder="11:00 p.m."
                            value={form.horario_cierre}
                            onChange={(e) => setForm({ ...form, horario_cierre: e.target.value })}
                            className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                        />
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
                    <p className="text-xs text-blue-700 leading-snug">
                        Formato libre (ej: &ldquo;07:00 a.m.&rdquo; o &ldquo;07:00&rdquo;). Los slots se generan automáticamente entre estos horarios.
                    </p>
                </div>
            </div>

            {/* SECCIÓN 3: Días de operación */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <h2 className="font-bold text-[#0f172a] text-lg mb-4">Días de operación</h2>

                <div className="flex flex-col">
                    {diasSemana.map((dia) => {
                        const activo = form.dias_operacion.includes(dia);
                        return (
                            <div key={dia} className="flex justify-between items-center py-3 border-b border-[#f1f5f9] last:border-0">
                                <span className="text-sm font-medium text-[#0f172a]">{dia}</span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleDia(dia)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-[#1e3a5f]' : 'bg-[#cbd5e1]'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activo ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BOTÓN GUARDAR (Sticky-like via mt-6 / outside regular cards) */}
            <button
                onClick={handleGuardar}
                disabled={loading}
                className={`w-full font-semibold px-8 py-3 rounded-xl transition-colors mt-6 ${guardado
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-[#1e3a5f] text-white hover:bg-[#2563eb] ' + (loading ? 'opacity-70 cursor-not-allowed' : '')
                    }`}
            >
                {guardado ? '✓ Cambios guardados' : loading ? 'Guardando...' : 'Guardar configuración'}
            </button>

        </div>
    );
}
