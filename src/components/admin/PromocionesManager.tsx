"use client";

import { useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Upload,
    X,
    Tag,
    ImageOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Promocion } from "@/types";

interface PromocionesManagerProps {
    promociones: Promocion[];
}

export default function PromocionesManager({ promociones: promoIniciales }: PromocionesManagerProps) {
    const [promociones, setPromociones] = useState<Promocion[]>(promoIniciales);
    const [modalAbierto, setModalAbierto] = useState<'crear' | 'editar' | null>(null);
    const [promoEditando, setPromoEditando] = useState<Promocion | null>(null);
    const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Form state
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [descuento, setDescuento] = useState(0);
    const [activa, setActiva] = useState(true);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Cloudinary
    const [archivoBanner, setArchivoBanner] = useState<File | null>(null);
    const [previewBanner, setPreviewBanner] = useState<string | null>(null);
    const [subiendoBanner, setSubiendoBanner] = useState(false);

    const resetForm = () => {
        setTitulo('');
        setDescripcion('');
        setDescuento(0);
        setActiva(true);
        setFechaInicio('');
        setFechaFin('');
        setArchivoBanner(null);
        setPreviewBanner(null);
        setPromoEditando(null);
    };

    const handleOpenCrear = () => {
        resetForm();
        setModalAbierto('crear');
    };

    const handleOpenEditar = (promo: Promocion) => {
        resetForm();
        setPromoEditando(promo);
        setTitulo(promo.titulo);
        setDescripcion(promo.descripcion || '');
        setDescuento(promo.descuento);
        setActiva(promo.activa);
        setFechaInicio(promo.fecha_inicio || '');
        setFechaFin(promo.fecha_fin || '');
        setModalAbierto('editar');
    };

    const handleCloseModal = () => {
        setModalAbierto(null);
        resetForm();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no puede exceder los 5MB");
            return;
        }
        setArchivoBanner(file);
        setPreviewBanner(URL.createObjectURL(file));
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
        if (!titulo.trim()) {
            toast.error("El título es obligatorio");
            return;
        }
        if (descuento < 0 || descuento > 100) {
            toast.error("El descuento debe estar entre 0 y 100");
            return;
        }

        let imagenUrlFinal = promoEditando?.imagen_url ?? undefined;

        if (archivoBanner) {
            setSubiendoBanner(true);
            try {
                imagenUrlFinal = await uploadToCloudinary(archivoBanner);
            } catch {
                toast.error("Error al subir la imagen");
                setSubiendoBanner(false);
                return;
            }
            setSubiendoBanner(false);
        }

        setLoading(true);
        try {
            const payload = {
                titulo,
                descripcion,
                descuento,
                activa,
                imagen_url: imagenUrlFinal || null,
                fecha_inicio: fechaInicio || null,
                fecha_fin: fechaFin || null,
            };

            if (modalAbierto === 'crear') {
                const res = await fetch('/api/promociones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    const data = await res.json();
                    setPromociones([data.promocion, ...promociones]);
                    toast.success("Promoción creada");
                    handleCloseModal();
                } else {
                    toast.error("Error al crear la promoción");
                }
            } else if (modalAbierto === 'editar' && promoEditando) {
                const res = await fetch(`/api/promociones/${promoEditando.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) {
                    const data = await res.json();
                    setPromociones(promociones.map(p => p.id === data.promocion.id ? data.promocion : p));
                    toast.success("Promoción actualizada");
                    handleCloseModal();
                } else {
                    toast.error("Error al actualizar la promoción");
                }
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/promociones/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setPromociones(promociones.filter(p => p.id !== id));
                toast.success("Promoción eliminada");
                setConfirmandoEliminar(null);
            } else {
                toast.error("Error al eliminar");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActiva = async (promo: Promocion) => {
        try {
            const res = await fetch(`/api/promociones/${promo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activa: !promo.activa }),
            });
            if (res.ok) {
                const data = await res.json();
                setPromociones(promociones.map(p => p.id === data.promocion.id ? data.promocion : p));
                toast.success(data.promocion.activa ? "Promoción activada" : "Promoción desactivada");
            } else {
                toast.error("Error al cambiar estado");
            }
        } catch {
            toast.error("Error de conexión");
        }
    };

    const activasCount = promociones.filter(p => p.activa).length;

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-[#64748b]">
                    Promociones ({activasCount} / {promociones.length} activas)
                </div>
                <button
                    onClick={handleOpenCrear}
                    className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nueva promoción
                </button>
            </div>

            {/* TABLA / LISTA */}
            {promociones.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-[#e2e8f0]">
                    <Tag className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#0f172a]">No hay promociones registradas</h3>
                    <p className="text-[#64748b] mt-2 mb-6">Crea tu primera promoción para mostrarla a los clientes.</p>
                    <button
                        onClick={handleOpenCrear}
                        className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors"
                    >
                        Crear primera promoción
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Promoción</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Descuento</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Vigencia</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Estado</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {promociones.map(promo => (
                                <tr key={promo.id} className="hover:bg-[#f8f9fa] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            {promo.imagen_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={promo.imagen_url}
                                                    alt={promo.titulo}
                                                    className="w-12 h-12 rounded-lg object-cover border border-[#e2e8f0] flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-[#f1f5f9] flex items-center justify-center flex-shrink-0 border border-[#e2e8f0]">
                                                    <ImageOff className="w-5 h-5 text-[#cbd5e1]" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-[#0f172a] text-sm">{promo.titulo}</div>
                                                {promo.descripcion && (
                                                    <div className="text-xs text-[#64748b] mt-0.5 line-clamp-1">{promo.descripcion}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 font-bold text-sm px-2.5 py-1 rounded-lg">
                                            {promo.descuento}% OFF
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 hidden md:table-cell">
                                        <div className="text-xs text-[#64748b]">
                                            {promo.fecha_inicio || promo.fecha_fin ? (
                                                <>
                                                    {promo.fecha_inicio && <div>Desde: {promo.fecha_inicio}</div>}
                                                    {promo.fecha_fin && <div>Hasta: {promo.fecha_fin}</div>}
                                                </>
                                            ) : (
                                                <span className="text-[#94a3b8]">Sin fecha límite</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => handleToggleActiva(promo)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${promo.activa ? 'bg-[#1e3a5f]' : 'bg-[#cbd5e1]'}`}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${promo.activa ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEditar(promo)}
                                                className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setConfirmandoEliminar(promo.id)}
                                                className="p-1.5 rounded-lg text-[#64748b] hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CREAR/EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">

                        <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-[#0f172a] text-lg">
                                {modalAbierto === 'crear' ? 'Nueva promoción' : 'Editar promoción'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-[#94a3b8] hover:text-[#0f172a] rounded-full p-1 hover:bg-[#f1f5f9] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Título *</label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej. 20% en reservas de fin de semana"
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Detalles de la promoción..."
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Descuento (%) *</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={descuento === 0 ? '' : descuento}
                                        onChange={(e) => setDescuento(Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b] font-medium">%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha inicio</label>
                                    <input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha fin</label>
                                    <input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                        className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between border border-[#e2e8f0] rounded-xl p-4">
                                    <div>
                                        <div className="font-medium text-[#0f172a] text-sm">Promoción activa</div>
                                        <div className="text-xs text-[#64748b] mt-0.5">Los clientes podrán ver esta promoción</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiva(!activa)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activa ? 'bg-[#1e3a5f]' : 'bg-[#cbd5e1]'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activa ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Banner / Imagen</label>

                                {promoEditando?.imagen_url && !previewBanner && (
                                    <div className="flex items-center mb-3 bg-[#f8f9fa] p-2 rounded-xl border border-[#e2e8f0]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={promoEditando.imagen_url} alt="Actual" className="w-16 h-16 rounded-lg object-cover mr-3 border border-[#e2e8f0]" />
                                        <div className="flex-grow">
                                            <div className="text-sm font-medium text-[#0f172a]">Banner actual</div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${previewBanner ? 'border-[#1e3a5f] bg-[#f8f9fa]' : 'border-[#e2e8f0] hover:border-[#1e3a5f] hover:bg-[#f8f9fa]'}`}
                                    onClick={() => document.getElementById('banner-upload')?.click()}
                                >
                                    <input
                                        id="banner-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    {previewBanner ? (
                                        <div className="absolute inset-0 rounded-xl overflow-hidden group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={previewBanner} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-white text-[#0f172a] text-sm font-medium px-4 py-2 rounded-lg">Cambiar imagen</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 text-[#94a3b8] mx-auto" />
                                            <div className="text-sm text-[#0f172a] font-medium mt-3">Haz clic para subir un banner</div>
                                            <div className="text-xs text-[#64748b] mt-1">JPG, PNG o WEBP · Máx 5MB</div>
                                        </div>
                                    )}
                                </div>

                                {subiendoBanner && (
                                    <div className="mt-3 flex items-center gap-2 justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1e3a5f] border-t-transparent"></div>
                                        <span className="text-sm text-[#64748b]">Subiendo imagen...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-[#e2e8f0] flex gap-3 justify-end sticky bottom-0 bg-white z-10">
                            <button
                                onClick={handleCloseModal}
                                disabled={loading || subiendoBanner}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={loading || subiendoBanner}
                                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${(loading || subiendoBanner) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CONFIRMAR ELIMINAR */}
            {confirmandoEliminar && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0f172a]">Eliminar promoción</h3>
                                <p className="text-sm text-[#64748b]">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmandoEliminar(null)}
                                disabled={loading}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleEliminar(confirmandoEliminar)}
                                disabled={loading}
                                className="bg-red-500 text-white font-semibold rounded-xl px-5 py-2 hover:bg-red-600 transition-colors disabled:opacity-70"
                            >
                                {loading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
