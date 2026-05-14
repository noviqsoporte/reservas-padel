"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Dumbbell } from "lucide-react";
import { toast } from "react-hot-toast";
import { Clase } from "@/types";

interface ClasesManagerProps {
  clases: Clase[];
}

const EMPTY_FORM = {
  titulo: "",
  instructor: "",
  descripcion: "",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
  cupo_maximo: 10,
  precio: 0,
  activa: true,
};

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(fecha + "T00:00:00Z"));
}

export default function ClasesManager({ clases: clasesIniciales }: ClasesManagerProps) {
  const [clases, setClases] = useState<Clase[]>(clasesIniciales);
  const [modalAbierto, setModalAbierto] = useState<"crear" | "editar" | null>(null);
  const [claseEditando, setClaseEditando] = useState<Clase | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setClaseEditando(null);
  };

  const handleOpenCrear = () => {
    resetForm();
    setModalAbierto("crear");
  };

  const handleOpenEditar = (clase: Clase) => {
    setClaseEditando(clase);
    setForm({
      titulo: clase.titulo,
      instructor: clase.instructor || "",
      descripcion: clase.descripcion || "",
      fecha: clase.fecha,
      hora_inicio: clase.hora_inicio,
      hora_fin: clase.hora_fin,
      cupo_maximo: clase.cupo_maximo,
      precio: clase.precio,
      activa: clase.activa,
    });
    setModalAbierto("editar");
  };

  const handleCloseModal = () => {
    setModalAbierto(null);
    resetForm();
  };

  const handleGuardar = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return; }
    if (!form.fecha || !form.hora_inicio || !form.hora_fin) { toast.error("Fecha y horario son obligatorios"); return; }
    if (form.cupo_maximo < 1) { toast.error("El cupo máximo debe ser mayor a 0"); return; }

    setLoading(true);
    try {
      if (modalAbierto === "crear") {
        const res = await fetch("/api/clases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form }),
        });
        if (res.ok) {
          const data = await res.json();
          setClases([...clases, data.clase]);
          toast.success("Clase creada");
          handleCloseModal();
        } else {
          const err = await res.json();
          toast.error(err.error || "Error al crear la clase");
        }
      } else if (modalAbierto === "editar" && claseEditando) {
        const res = await fetch(`/api/clases/${claseEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const data = await res.json();
          setClases(clases.map((c) => (c.id === data.clase.id ? data.clase : c)));
          toast.success("Clase actualizada");
          handleCloseModal();
        } else {
          toast.error("Error al actualizar la clase");
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
      const res = await fetch(`/api/clases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setClases(clases.filter((c) => c.id !== id));
        toast.success("Clase eliminada");
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

  const handleToggleActiva = async (clase: Clase) => {
    try {
      const res = await fetch(`/api/clases/${clase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !clase.activa }),
      });
      if (res.ok) {
        const data = await res.json();
        setClases(clases.map((c) => (c.id === data.clase.id ? data.clase : c)));
        toast.success(data.clase.activa ? "Clase activada" : "Clase desactivada");
      } else {
        toast.error("Error al cambiar estado");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-[#64748b]">
          Clases ({clases.filter((c) => c.activa).length} / {clases.length} activas)
        </div>
        <button
          onClick={handleOpenCrear}
          className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva clase
        </button>
      </div>

      {/* TABLA */}
      {clases.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <Dumbbell className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#0f172a]">No hay clases registradas</h3>
          <p className="text-[#64748b] mt-2 mb-6">Crea tu primera clase para mostrarla a los clientes.</p>
          <button
            onClick={handleOpenCrear}
            className="bg-[#1e3a5f] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#2563eb] transition-colors"
          >
            Crear primera clase
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-[#f8f9fa]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Clase</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Horario</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Cupo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Precio</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {clases.map((clase) => (
                <tr key={clase.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0f172a] text-sm">{clase.titulo}</div>
                    {clase.instructor && (
                      <div className="text-xs text-[#64748b] mt-0.5">{clase.instructor}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="text-sm text-[#0f172a]">{formatFecha(clase.fecha)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-[#0f172a]">{clase.hora_inicio} – {clase.hora_fin}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-lg ${clase.cupo_disponible > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {clase.cupo_disponible}/{clase.cupo_maximo}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#0f172a]">${clase.precio.toLocaleString("es-MX")}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleActiva(clase)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${clase.activa ? "bg-[#1e3a5f]" : "bg-[#cbd5e1]"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${clase.activa ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditar(clase)}
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#1e3a5f] hover:bg-[#f1f5f9] transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(clase.id)}
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
                {modalAbierto === "crear" ? "Nueva clase" : "Editar clase"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-[#94a3b8] hover:text-[#0f172a] rounded-full p-1 hover:bg-[#f1f5f9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej. Yoga matutino"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Instructor</label>
                <input
                  type="text"
                  value={form.instructor}
                  onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  placeholder="Nombre del instructor"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción de la clase..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Fecha *</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora inicio *</label>
                  <input
                    type="time"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Hora fin *</label>
                  <input
                    type="time"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Cupo máximo *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.cupo_maximo}
                    onChange={(e) => setForm({ ...form, cupo_maximo: Number(e.target.value) })}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Precio (MXN)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
                    className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] bg-white text-[#0f172a]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border border-[#e2e8f0] rounded-xl p-4">
                <div>
                  <div className="font-medium text-[#0f172a] text-sm">Clase activa</div>
                  <div className="text-xs text-[#64748b] mt-0.5">Los clientes podrán ver esta clase</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, activa: !form.activa })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.activa ? "bg-[#1e3a5f]" : "bg-[#cbd5e1]"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.activa ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-[#e2e8f0] flex gap-3 justify-end sticky bottom-0 bg-white z-10">
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className={`bg-[#1e3a5f] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#2563eb] transition-colors ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "Guardando..." : "Guardar"}
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
                <h3 className="font-bold text-[#0f172a]">Eliminar clase</h3>
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
                {loading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
