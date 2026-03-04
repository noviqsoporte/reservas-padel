import { Config } from "@/types";
import ConfiguracionManager from "@/components/admin/ConfiguracionManager";

async function getConfig() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/config`, { cache: 'no-store' });
        if (!res.ok) {
            return {
                negocio_nombre: 'Mi Club de Pádel',
                horario_apertura: '07:00',
                horario_cierre: '23:00',
                dias_operacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                direccion: '',
                telefono: '',
                instagram: ''
            };
        }
        const data = await res.json();
        return data.config as Config;
    } catch (error) {
        console.error("Error fetching config:", error);
        return {
            negocio_nombre: 'Mi Club de Pádel',
            horario_apertura: '07:00',
            horario_cierre: '23:00',
            dias_operacion: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
            direccion: '',
            telefono: '',
            instagram: ''
        };
    }
}

export default async function ConfiguracionPage() {
    const config = await getConfig();

    return (
        <div>
            <ConfiguracionManager config={config} />
        </div>
    );
}
