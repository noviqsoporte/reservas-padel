"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Clock, Users, Tag } from "lucide-react";
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
  const { user } = useSession();

  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservando, setReservando] = useState<Set<string>>(new Set());
  const [reservados, setReservados] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/clases?activas=true")
      .then((r) => r.json())
      .then((data: { clases: Clase[] }) => {
        setClases(Array.isArray(data.clases) ? data.clases : []);
      })
      .catch(() => setClases([]))
      .finally(() => setLoading(false));
  }, []);

  const handleReservar = async (claseId: string) => {
    if (!user) {
      router.push("/auth?next=/clases");
      return;
    }
    setReservando((prev) => new Set(prev).add(claseId));
    try {
      const res = await fetch(`/api/clases/${claseId}/reservar`, { method: "POST" });
      if (res.ok) {
        setReservados((prev) => new Set(prev).add(claseId));
        toast.success("¡Lugar reservado con éxito!");
      } else if (res.status === 409) {
        toast.error("Esta clase ya está llena");
      } else {
        toast.error("Error al reservar. Intenta de nuevo.");
      }
    } finally {
      setReservando((prev) => {
        const s = new Set(prev);
        s.delete(claseId);
        return s;
      });
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
                    const estaReservando = reservando.has(clase.id);

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
                            onClick={() => handleReservar(clase.id)}
                            disabled={estaReservando}
                            className="mt-1 text-center text-sm font-semibold py-2.5 rounded-xl bg-[#0057FF] text-white hover:bg-[#0041cc] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {estaReservando ? "Reservando..." : "Reservar lugar"}
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
    </main>
  );
}
