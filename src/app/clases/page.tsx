"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Clock, Users, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useSession";
import { Clase } from "@/types";

const formatTime = (t: string) => t.slice(0, 5);

function formatFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(fecha + "T00:00:00Z"));
}

function groupByFecha(clases: Clase[]): Record<string, Clase[]> {
  return clases.reduce((acc, clase) => {
    if (!acc[clase.fecha]) acc[clase.fecha] = [];
    acc[clase.fecha].push(clase);
    return acc;
  }, {} as Record<string, Clase[]>);
}

export default function ClasesPage() {
  const router = useRouter();
  const { user, profile } = useSession();

  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservados, setReservados] = useState<Set<string>>(new Set());

  const [modalClase, setModalClase] = useState<Clase | null>(null);
  const [formInscripcion, setFormInscripcion] = useState({ nombre: "", telefono: "" });
  const [loadingInscripcion, setLoadingInscripcion] = useState(false);

  useEffect(() => {
    fetch("/api/clases?activas=true")
      .then((r) => r.json())
      .then((data: { clases: Clase[] }) => {
        setClases(Array.isArray(data.clases) ? data.clases : []);
      })
      .catch(() => setClases([]))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenModal = (clase: Clase) => {
    if (!user) {
      router.push("/auth?next=/clases");
      return;
    }
    setFormInscripcion({ nombre: profile?.nombre ?? "", telefono: "" });
    setModalClase(clase);
  };

  const handleConfirmarInscripcion = async () => {
    if (!user || !modalClase) return;
    if (!formInscripcion.nombre.trim()) {
      toast.error("Por favor ingresa tu nombre");
      return;
    }
    setLoadingInscripcion(true);
    try {
      const res = await fetch(`/api/clases/${modalClase.id}/reservar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_cliente: formInscripcion.nombre,
          email: user.email,
          telefono: formInscripcion.telefono,
          profile_id: profile?.id,
        }),
      });
      if (res.ok) {
        setReservados((prev) => new Set(prev).add(modalClase.id));
        setClases((prev) =>
          prev.map((c) =>
            c.id === modalClase.id
              ? { ...c, cupo_disponible: c.cupo_disponible - 1 }
              : c
          )
        );
        setModalClase(null);
        toast.success("¡Lugar reservado! Te esperamos el día de la clase.");
      } else if (res.status === 409) {
        const body = await res.json();
        toast.error(body.error ?? "No se pudo completar la reserva");
        setModalClase(null);
      } else {
        toast.error("Error al reservar. Intenta de nuevo.");
      }
    } finally {
      setLoadingInscripcion(false);
    }
  };

  const grouped = groupByFecha(clases);
  const fechas = Object.keys(grouped).sort();

  return (
    <main className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0]">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-[#eef3ff] text-[#0057FF] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <Dumbbell className="w-4 h-4" />
            Clases & Wellness
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f172a] mt-2">Próximas clases</h1>
          <p className="text-[#64748b] mt-3 max-w-xl mx-auto">
            Descubre nuestras actividades y reserva tu lugar fácilmente.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-center py-24 text-[#64748b]">Cargando clases...</div>
        ) : fechas.length === 0 ? (
          <div className="text-center py-24">
            <Dumbbell className="w-14 h-14 text-[#cbd5e1] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0f172a]">No hay clases próximas</h2>
            <p className="text-[#64748b] mt-2">Vuelve pronto, se agregarán nuevas actividades.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {fechas.map((fecha) => (
              <div key={fecha}>
                <h2 className="text-base font-bold text-[#0f172a] mb-4 capitalize">
                  {formatFecha(fecha)}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {grouped[fecha].map((clase) => {
                    const hayLugares = clase.cupo_disponible > 0;
                    const yaReservado = reservados.has(clase.id);

                    return (
                      <div
                        key={clase.id}
                        className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-[#0f172a] text-base">{clase.titulo}</h3>
                            {clase.instructor && (
                              <p className="text-sm text-[#64748b] mt-0.5">{clase.instructor}</p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              hayLugares
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            {hayLugares ? `${clase.cupo_disponible} lugares` : "Lleno"}
                          </span>
                        </div>

                        {clase.descripcion && (
                          <p className="text-sm text-[#475569] leading-relaxed">{clase.descripcion}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#64748b]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(clase.hora_inicio)} – {formatTime(clase.hora_fin)}
                          </span>
                          {clase.precio > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              ${clase.precio.toLocaleString("es-MX")} MXN
                            </span>
                          )}
                        </div>

                        {yaReservado ? (
                          <span className="mt-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-green-50 text-green-700">
                            ✓ Lugar reservado
                          </span>
                        ) : !hayLugares ? (
                          <button
                            disabled
                            className="mt-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
                          >
                            Clase llena
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(clase)}
                            className="mt-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-[#0057FF] text-white hover:bg-[#0041cc] transition-colors"
                          >
                            Reservar lugar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE INSCRIPCIÓN */}
      {modalClase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center">
              <h3 className="font-bold text-[#0f172a] text-lg">Reservar lugar</h3>
              <button
                onClick={() => setModalClase(null)}
                className="text-[#94a3b8] hover:text-[#0f172a] rounded-full p-1 hover:bg-[#f1f5f9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="font-semibold text-[#0f172a]">{modalClase.titulo}</p>
                <p className="text-sm text-[#64748b] mt-0.5 capitalize">{formatFecha(modalClase.fecha)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formInscripcion.nombre}
                  onChange={(e) => setFormInscripcion({ ...formInscripcion, nombre: e.target.value })}
                  placeholder="Tu nombre completo"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0057FF] bg-white text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formInscripcion.telefono}
                  onChange={(e) => setFormInscripcion({ ...formInscripcion, telefono: e.target.value })}
                  placeholder="Tu número de teléfono"
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0057FF] bg-white text-[#0f172a]"
                />
              </div>

              <div className="text-sm text-[#64748b]">
                Reservando como <span className="font-semibold text-[#0f172a]">{user?.email}</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                💳 El pago se realiza en recepción el día de la clase
              </div>
            </div>

            <div className="px-6 py-5 border-t border-[#e2e8f0] flex gap-3 justify-end">
              <button
                onClick={() => setModalClase(null)}
                disabled={loadingInscripcion}
                className="text-[#64748b] font-medium hover:text-[#0f172a] px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarInscripcion}
                disabled={loadingInscripcion}
                className="bg-[#0057FF] text-white font-semibold rounded-xl px-6 py-2.5 hover:bg-[#0041cc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingInscripcion ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
