"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, ImageIcon, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { Config, FotoGaleria } from "@/types";

interface ConfiguracionManagerProps {
    config: Config;
}

interface RangoPico { inicio: string; fin: string }

function parseRangos(horasPico?: string): RangoPico[] {
    if (!horasPico?.trim()) return [{ inicio: '', fin: '' }]
    // Each token is "HH:MM-HH:MM"; use indexOf('-') to split only at the separator dash,
    // not inside the time strings (which use ':').
    const parsed = horasPico.split(',').map(r => {
        const token = r.trim()
        const dashIdx = token.indexOf('-')
        if (dashIdx === -1) return null
        return {
            inicio: token.slice(0, dashIdx).trim(),
            fin: token.slice(dashIdx + 1).trim(),
        }
    }).filter((r): r is RangoPico => !!r?.inicio && !!r?.fin)
    return parsed.length > 0 ? parsed : [{ inicio: '', fin: '' }]
}

const MAX_GALERIA = 8

export default function ConfiguracionManager({ config: initialConfig }: ConfiguracionManagerProps) {
    const [form, setForm] = useState<Config>(initialConfig);
    const [loading, setLoading] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [archivoHero, setArchivoHero] = useState<File | null>(null);
    const [previewHero, setPreviewHero] = useState<string | null>(initialConfig.hero_imagen_url || null);
    const [subiendoHero, setSubiendoHero] = useState(false);

    // Galería
    const [fotos, setFotos] = useState<FotoGaleria[]>([]);
    const [subiendoFoto, setSubiendoFoto] = useState(false);
    const galeriaInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/galeria')
            .then(r => r.json())
            .then(d => setFotos(d.fotos || []))
            .catch(() => {})
    }, []);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    const [rangosPico, setRangosPico] = useState<RangoPico[]>(() => parseRangos(initialConfig.horas_pico));
    const [diasPicoArray, setDiasPicoArray] = useState<string[]>(
        () => (initialConfig.dias_pico || '').split(',').map(d => d.trim()).filter(Boolean)
    );

    const handleToggleDiaPico = (dia: string) => {
        setDiasPicoArray(prev => {
            const next = prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
            setForm(f => ({ ...f, dias_pico: next.join(',') }))
            return next
        })
    }

    const handleRangoChange = (index: number, field: 'inicio' | 'fin', value: string) => {
        setRangosPico(prev => {
            const next = prev.map((r, i) => i === index ? { ...r, [field]: value } : r)
            const horasPico = next.filter(r => r.inicio && r.fin).map(r => `${r.inicio}-${r.fin}`).join(',')
            setForm(f => ({ ...f, horas_pico: horasPico }))
            return next
        })
    }

    const handleAddRango = () => {
        if (rangosPico.length < 3) setRangosPico(prev => [...prev, { inicio: '', fin: '' }])
    }

    const handleRemoveRango = (index: number) => {
        setRangosPico(prev => {
            const next = prev.filter((_, i) => i !== index)
            const final = next.length > 0 ? next : [{ inicio: '', fin: '' }]
            const horasPico = final.filter(r => r.inicio && r.fin).map(r => `${r.inicio}-${r.fin}`).join(',')
            setForm(f => ({ ...f, horas_pico: horasPico }))
            return final
        })
    }

    const handleToggleDia = (dia: string) => {
        setForm(prev => ({
            ...prev,
            dias_operacion: prev.dias_operacion.includes(dia)
                ? prev.dias_operacion.filter(d => d !== dia)
                : [...prev.dias_operacion, dia],
        }));
    };

    const handleHeroFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error("Solo se permiten imágenes");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no puede exceder los 5MB");
            return;
        }
        setArchivoHero(file);
        setPreviewHero(URL.createObjectURL(file));
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );
        if (!res.ok) throw new Error("Error subiendo imagen a Cloudinary");
        const data = await res.json();
        return data.secure_url;
    };

    const handleGuardar = async () => {
        // Basic validation
        if (!form.negocio_nombre.trim()) {
            toast.error("El nombre del negocio es requerido");
            return;
        }

        let heroUrl = form.hero_imagen_url;

        if (archivoHero) {
            setSubiendoHero(true);
            try {
                heroUrl = await uploadToCloudinary(archivoHero);
                setArchivoHero(null);
                setPreviewHero(heroUrl);
            } catch {
                toast.error("Error al subir la imagen del hero");
                setSubiendoHero(false);
                return;
            }
            setSubiendoHero(false);
        }

        const formToSave = { ...form, hero_imagen_url: heroUrl };
        setLoading(true);

        try {
            // Create updates promise array for each key
            const updates = [];
            const keys = Object.keys(formToSave) as Array<keyof Config>;

            for (const key of keys) {
                let valueStr = formToSave[key];

                // Handle array formatting
                if (key === 'dias_operacion') {
                    valueStr = (formToSave[key] as string[]).join(', ');
                }

                updates.push(
                    fetch('/api/config', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clave: key, valor: typeof valueStr === 'string' ? valueStr : String(valueStr ?? '') })
                    })
                );
            }

            const results = await Promise.all(updates);

            const allOk = results.every(res => res.ok);

            if (allOk) {
                setForm(formToSave);
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

    const handleAgregarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('La imagen no puede exceder 5 MB'); return; }
        if (fotos.length >= MAX_GALERIA) { toast.error(`Máximo ${MAX_GALERIA} fotos`); return; }

        setSubiendoFoto(true);
        try {
            const url = await uploadToCloudinary(file);
            const res = await fetch('/api/galeria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imagen_url: url }),
            });
            if (!res.ok) { toast.error('Error al guardar la foto'); return; }
            const data = await res.json();
            setFotos(prev => [...prev, data.foto]);
            toast.success('Foto agregada');
        } catch {
            toast.error('Error al subir la foto');
        } finally {
            setSubiendoFoto(false);
            if (galeriaInputRef.current) galeriaInputRef.current.value = '';
        }
    };

    const handleEliminarFoto = async (id: string) => {
        if (!confirm('¿Eliminar esta foto de la galería?')) return;
        try {
            const res = await fetch(`/api/galeria/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Error al eliminar'); return; }
            setFotos(prev => prev.filter(f => f.id !== id));
            toast.success('Foto eliminada');
        } catch {
            toast.error('Error de conexión');
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

            {/* SECCIÓN 4: Precios y horarios pico */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <h2 className="font-bold text-[#0f172a] text-lg">Precios y horarios pico</h2>
                <p className="text-sm text-[#64748b] mt-1">Los slots dentro de estos rangos mostrarán el precio pico configurado en cada cancha</p>

                {/* Días pico */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Días pico</h3>
                    <div className="flex flex-col">
                        {diasSemana.map((dia) => {
                            const activo = diasPicoArray.includes(dia);
                            return (
                                <div key={dia} className="flex justify-between items-center py-3 border-b border-[#f1f5f9] last:border-0">
                                    <span className="text-sm font-medium text-[#0f172a]">{dia}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDiaPico(dia)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activo ? 'bg-orange-500' : 'bg-[#cbd5e1]'}`}
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

                {/* Rangos de horas pico */}
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#0f172a] mb-1">Rangos de horas pico</h3>
                    <p className="text-xs text-[#64748b] mb-3">Máximo 3 rangos. Un slot es pico si su hora de inicio cae dentro del rango.</p>

                    <div className="space-y-3">
                        {rangosPico.map((rango, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <input
                                    type="time"
                                    value={rango.inicio}
                                    onChange={(e) => handleRangoChange(i, 'inicio', e.target.value)}
                                    className="border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white text-[#0f172a] w-32"
                                />
                                <span className="text-[#64748b] text-sm">–</span>
                                <input
                                    type="time"
                                    value={rango.fin}
                                    onChange={(e) => handleRangoChange(i, 'fin', e.target.value)}
                                    className="border border-[#e2e8f0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white text-[#0f172a] w-32"
                                />
                                {rangosPico.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRango(i)}
                                        className="text-[#94a3b8] hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {rangosPico.length < 3 && (
                        <button
                            type="button"
                            onClick={handleAddRango}
                            className="mt-3 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar rango
                        </button>
                    )}
                </div>
            </div>

            {/* SECCIÓN 5: Multimedia */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <h2 className="font-bold text-[#0f172a] text-lg">Multimedia</h2>
                <p className="text-sm text-[#64748b] mt-1">Foto principal que aparece como fondo en el hero de la landing</p>

                <div className="mt-6">
                    {previewHero ? (
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-[#e2e8f0] mb-4">
                            <Image
                                src={previewHero}
                                alt="Hero preview"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setPreviewHero(null);
                                    setArchivoHero(null);
                                    setForm(f => ({ ...f, hero_imagen_url: undefined }));
                                }}
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow transition-colors"
                            >
                                <X className="w-4 h-4 text-[#64748b]" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-[#e2e8f0] rounded-xl text-[#94a3b8] mb-4">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-sm">Sin imagen configurada</span>
                        </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleHeroFileChange}
                            disabled={subiendoHero}
                        />
                        <span className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                            {subiendoHero ? 'Subiendo...' : archivoHero ? 'Cambiar imagen' : 'Subir imagen'}
                        </span>
                        <span className="text-xs text-[#94a3b8]">JPG, PNG o WebP · máx. 5 MB</span>
                    </label>
                    {archivoHero && (
                        <p className="text-xs text-[#0057FF] mt-2">
                            Imagen seleccionada: {archivoHero.name} — se subirá al guardar
                        </p>
                    )}
                </div>
            </div>

            {/* SECCIÓN 6: Galería */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h2 className="font-bold text-[#0f172a] text-lg">Galería / Conócenos</h2>
                        <p className="text-sm text-[#64748b] mt-1">Fotos que aparecen en el slider de la landing</p>
                    </div>
                    <span className="text-sm font-semibold text-[#64748b]">
                        {fotos.length} / {MAX_GALERIA} fotos
                    </span>
                </div>

                {fotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                        {fotos.map(foto => (
                            <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-[#e2e8f0] aspect-video">
                                <Image
                                    src={foto.imagen_url}
                                    alt="Foto galería"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleEliminarFoto(foto.id)}
                                    className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-[#64748b] rounded-full p-1 shadow transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {fotos.length === 0 && !subiendoFoto && (
                    <div className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#e2e8f0] rounded-xl text-[#94a3b8] mt-5">
                        <ImageIcon className="w-7 h-7 mb-1.5" />
                        <span className="text-sm">Sin fotos en la galería</span>
                    </div>
                )}

                <div className="mt-4">
                    <label className={`flex items-center gap-2 w-fit ${fotos.length >= MAX_GALERIA || subiendoFoto ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input
                            ref={galeriaInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAgregarFoto}
                            disabled={fotos.length >= MAX_GALERIA || subiendoFoto}
                        />
                        <span className="flex items-center gap-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                            <Plus className="w-4 h-4" />
                            {subiendoFoto ? 'Subiendo...' : 'Agregar foto'}
                        </span>
                        <span className="text-xs text-[#94a3b8]">JPG, PNG o WebP · máx. 5 MB</span>
                    </label>
                    {fotos.length >= MAX_GALERIA && (
                        <p className="text-xs text-orange-500 mt-2">Límite de {MAX_GALERIA} fotos alcanzado. Elimina alguna para agregar otra.</p>
                    )}
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
