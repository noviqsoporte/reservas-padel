"use client";

import { useState } from "react";
import {
    Pencil,
    ImageOff,
    Upload,
    X,
    Plus
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Cancha } from "@/types";

interface CanchasManagerProps {
    canchas: Cancha[];
}

export default function CanchasManager({ canchas: canchasIniciales }: CanchasManagerProps) {
    const [canchas, setCanchas] = useState<Cancha[]>(canchasIniciales);

    // Modales
    const [modalAbierto, setModalAbierto] = useState<'crear' | 'editar' | null>(null);
    const [canchaEditando, setCanchaEditando] = useState<Cancha | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState(0);
    const [color, setColor] = useState('#1e3a5f');
    const [activa, setActiva] = useState(true);

    // Cloudinary State
    const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
    const [previewFoto, setPreviewFoto] = useState<string | null>(null);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    const canchasActivasCount = canchas.filter(c => c.activa).length;

    const resetForm = () => {
        setNombre('');
        setDescripcion('');
        setPrecio(0);
        setColor('#1e3a5f');
        setActiva(true);
        setArchivoFoto(null);
        setPreviewFoto(null);
        setCanchaEditando(null);
    };

    const handleOpenCrear = () => {
        resetForm();
        setModalAbierto('crear');
    };

    const handleOpenEditar = (cancha: Cancha) => {
        resetForm();
        setCanchaEditando(cancha);
        setNombre(cancha.nombre);
        setDescripcion(cancha.descripcion);
        setPrecio(cancha.precio);
        setColor(cancha.color || '#1e3a5f');
        setActiva(cancha.activa);
        setModalAbierto('editar');
    };

    const handleCloseModal = () => {
        setModalAbierto(null);
        resetForm();
    };

    // Upload Logic
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (<5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("La imagen no puede exceder los 5MB");
            return;
        }

        setArchivoFoto(file);
        setPreviewFoto(URL.createObjectURL(file));
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: 'POST', body: formData }
        );

        if (!res.ok) {
            throw new Error("Error subiendo imagen a Cloudinary");
        }

        const data = await res.json();
        return data.secure_url;
    };

    // CRUD
    const handleGuardar = async () => {
        if (!nombre.trim()) {
            toast.error("El nombre de la cancha es obligatorio");
            return;
        }

        let fotoUrlFinal = canchaEditando?.foto_url ?? '';

        if (archivoFoto) {
            setSubiendoFoto(true);
            try {
                fotoUrlFinal = await uploadToCloudinary(archivoFoto);
            } catch (_error) {
                toast.error("Error al subir la imagen");
                setSubiendoFoto(false);
                return;
            }
            setSubiendoFoto(false);
        }

        setLoading(true);

        try {
            const payload = {
                nombre,
                descripcion,
                foto_url: fotoUrlFinal,
                activa,
                precio,
                color
            };

            if (modalAbierto === 'crear') {
                const res = await fetch('/api/canchas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    setCanchas([data.cancha, ...canchas]);
                    toast.success("Cancha creada exitosamente");
                    handleCloseModal();
                } else {
                    toast.error("Error al crear la cancha");
                }
            } else if (modalAbierto === 'editar' && canchaEditando) {
                const res = await fetch(`/api/canchas/${canchaEditando.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    setCanchas(canchas.map(c => c.id === data.cancha.id ? data.cancha : c));
                    toast.success("Cancha actualizada");
                    handleCloseModal();
                } else {
                    toast.error("Error al actualizar la cancha");
                }
            }
        } catch (_error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActiva = async (cancha: Cancha) => {
        try {
            const res = await fetch(`/api/canchas/${cancha.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activa: !cancha.activa })
            });

            if (res.ok) {
                const data = await res.json();
                setCanchas(canchas.map(c => c.id === data.cancha.id ? data.cancha : c));
                toast.success(data.cancha.activa ? "Cancha activada" : "Cancha desactivada");
            } else {
                toast.error("Error al cambiar estado");
            }
        } catch (_error) {
            toast.error("Error de conexión");
        }
    };

    return (
        <div>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-sm text-[#64748b]">
                    Canchas registradas ({canchasActivasCount} / {canchas.length} activas)
                </div>
                <button
                    onClick={handleOpenCrear}
                    className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nueva cancha
                </button>
            </div>

            {/* GRID */}
            {canchas.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-[#e2e8f0]">
                    <ImageOff className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-[#0f172a]">No hay canchas registradas</h3>
                    <p className="text-[#64748b] mt-2 mb-6">Crea tu primera cancha para empezar a recibir reservas.</p>
                    <button
                        onClick={handleOpenCrear}
                        className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors"
                    >
                        Crear primera cancha
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canchas.map(cancha => (
                        <div key={cancha.id} className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">

                            {/* IMAGEN */}
                            <div className="h-48 relative">
                                {cancha.foto_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cancha.foto_url} alt={cancha.nombre} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="bg-[#f1f5f9] flex items-center justify-center w-full h-full">
                                        <ImageOff className="w-12 h-12 text-[#cbd5e1]" />
                                    </div>
                                )}

                                <div className="absolute top-3 right-3">
                                    {cancha.activa ? (
                                        <span className="bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                                            Activa
                                        </span>
                                    ) : (
                                        <span className="bg-[#94a3b8] text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                                            Inactiva
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CONTENIDO */}
                            <div className="p-5 flex-grow flex flex-col">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cancha.color || '#1e3a5f' }} />
                                    <h3 className="text-lg font-bold text-[#0f172a] line-clamp-1">{cancha.nombre}</h3>
                                </div>

                                <p className="text-sm text-[#64748b] mt-1 line-clamp-2 h-10">
                                    {cancha.descripcion || "Sin descripción"}
                                </p>

                                <div className="mt-4 flex-grow">
                                    {cancha.precio > 0 ? (
                                        <div className="text-[#1e3a5f] font-bold text-lg">
                                            ${cancha.precio.toLocaleString('es-MX')} <span className="text-sm font-normal text-[#64748b]">/ hora</span>
                                        </div>
                                    ) : (
                                        <div className="text-[#94a3b8] italic text-sm mt-1">Precio no definido</div>
                                    )}
                                </div>

                                <div className="border-t border-[#e2e8f0] mt-4 pt-4 flex gap-2">
                                    <button
                                        onClick={() => handleOpenEditar(cancha)}
                                        className="flex-1 border border-[#e2e8f0] text-[#64748b] text-sm font-medium rounded-lg py-2 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Pencil className="w-4 h-4" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleToggleActiva(cancha)}
                                        className={`flex-1 text-sm font-medium rounded-lg py-2 border transition-colors ${cancha.activa
                                            ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                                            : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                            }`}
                                    >
                                        {cancha.activa ? "Desactivar" : "Activar"}
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CREAR/EDITAR */}
            {modalAbierto && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col">

                        <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-[#0f172a] text-lg">
                                {modalAbierto === 'crear' ? 'Nueva cancha' : 'Editar cancha'}
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
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Nombre *</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej. Cancha 1"
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    placeholder="Detalles de la cancha..."
                                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a] resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Precio por hora</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748b] font-medium">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={precio === 0 ? '' : precio}
                                            onChange={(e) => setPrecio(Number(e.target.value))}
                                            placeholder="0"
                                            className="w-full border border-[#e2e8f0] rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Color identificador</label>
                                    <div className="flex items-center gap-3 border border-[#e2e8f0] rounded-xl px-3 py-1.5">
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <span className="text-sm text-[#64748b] uppercase">{color}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between border border-[#e2e8f0] rounded-xl p-4">
                                    <div>
                                        <div className="font-medium text-[#0f172a] text-sm">Cancha activa</div>
                                        <div className="text-xs text-[#64748b] mt-0.5">Los clientes podrán ver y reservar esta cancha</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiva(!activa)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${activa ? 'bg-[#1e3a5f]' : 'bg-[#cbd5e1]'}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activa ? 'translate-x-6' : 'translate-x-1'}`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Foto de la cancha</label>

                                {canchaEditando?.foto_url && !previewFoto && (
                                    <div className="flex items-center mb-3 bg-[#f8f9fa] p-2 rounded-xl border border-[#e2e8f0]">
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={canchaEditando.foto_url} alt="Actual" className="w-16 h-16 rounded-lg object-cover mr-3 border border-[#e2e8f0]" />
                                        <div className="flex-grow">
                                            <div className="text-sm font-medium text-[#0f172a]">Foto actual</div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${previewFoto ? 'border-[#1e3a5f] bg-[#f8f9fa]' : 'border-[#e2e8f0] hover:border-[#1e3a5f] hover:bg-[#f8f9fa]'
                                        }`}
                                    onClick={() => document.getElementById('foto-upload')?.click()}
                                >
                                    <input
                                        id="foto-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />

                                    {previewFoto ? (
                                        <div className="absolute inset-0 rounded-xl overflow-hidden group">
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={previewFoto} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="bg-white text-[#0f172a] text-sm font-medium px-4 py-2 rounded-lg">Cambiar foto</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="w-8 h-8 text-[#94a3b8] mx-auto" />
                                            <div className="text-sm text-[#0f172a] font-medium mt-3">Haz clic para subir una foto</div>
                                            <div className="text-xs text-[#64748b] mt-1">JPG, PNG o WEBP · Máx 5MB</div>
                                        </div>
                                    )}
                                </div>

                                {subiendoFoto && (
                                    <div className="mt-3 flex items-center gap-2 justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1e3a5f] border-t-transparent"></div>
                                        <span className="text-sm text-[#64748b]">Subiendo foto...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-[#e2e8f0] flex gap-3 justify-end sticky bottom-0 bg-white z-10">
                            <button
                                onClick={handleCloseModal}
                                disabled={loading || subiendoFoto}
                                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={loading || subiendoFoto}
                                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${(loading || subiendoFoto) ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? 'Guardando...' : 'Guardar cancha'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
