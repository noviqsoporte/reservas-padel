import {
    CalendarCheck,
    TrendingUp,
    BarChart3,
    DollarSign,
    Activity,
    XCircle
} from "lucide-react";

interface DashboardKPIsProps {
    reservasHoy: number;
    reservasSemana: number;
    reservasMes: number;
    ingresosMes: number;
    cancelacionesMes: number;
    ocupacionHoy: number;
    canchasActivas: number;
}

export default function DashboardKPIs(props: DashboardKPIsProps) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            {/* 1. Reservas hoy */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-[#1e3a5f]">
                        <CalendarCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Reservas hoy
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">{props.reservasHoy}</div>
                <div className="text-sm text-[#64748b] mt-1">confirmadas para hoy</div>
            </div>

            {/* 2. Esta semana */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Esta semana
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">{props.reservasSemana}</div>
                <div className="text-sm text-[#64748b] mt-1">semana actual</div>
            </div>

            {/* 3. Este mes */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Este mes
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">{props.reservasMes}</div>
                <div className="text-sm text-[#64748b] mt-1">reservas del mes</div>
            </div>

            {/* 4. Ingresos del mes */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
                        <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Ingresos del mes
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">
                    ${props.ingresosMes.toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-[#64748b] mt-1">ingresos estimados</div>
            </div>

            {/* 5. Ocupación hoy */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600">
                        <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Ocupación hoy
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">{props.ocupacionHoy}%</div>
                <div className="text-sm text-[#64748b] mt-1">{props.canchasActivas} canchas activas</div>
                <div className="bg-[#f1f5f9] rounded-full h-2 mt-3 w-full">
                    <div
                        className="bg-[#1e3a5f] rounded-full h-2 transition-all duration-500"
                        style={{ width: `${props.ocupacionHoy}%` }}
                    />
                </div>
            </div>

            {/* 6. Cancelaciones */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500">
                        <XCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-[#64748b] font-medium uppercase tracking-wide">
                        Cancelaciones
                    </span>
                </div>
                <div className="text-3xl font-bold text-[#0f172a] mt-3">{props.cancelacionesMes}</div>
                <div className="text-sm text-[#64748b] mt-1">este mes</div>
            </div>

        </div>
    );
}
