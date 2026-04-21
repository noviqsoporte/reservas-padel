import { Config } from "@/types";
import ConfiguracionManager from "@/components/admin/ConfiguracionManager";
import { getConfig } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
    const config = await getConfig().catch(() => ({
        negocio_nombre: 'Padel Club',
        horario_apertura: '07:00',
        horario_cierre: '23:00',
        dias_operacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        direccion: 'Dirección del club',
        telefono: '+52 55 0000 0000',
        instagram: '@padelclub',
        horas_pico: '',
        dias_pico: '',
    } as Config));

    return (
        <div>
            <ConfiguracionManager config={config} />
        </div>
    );
}
