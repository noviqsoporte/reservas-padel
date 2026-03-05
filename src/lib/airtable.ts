import Airtable from 'airtable';
import { Cancha, Reserva, Bloqueo, Config } from '../types';

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable credentials in .env.local');
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const canchasTable = base(process.env.AIRTABLE_TABLE_CANCHAS as string);
const reservasTable = base(process.env.AIRTABLE_TABLE_RESERVAS as string);
const bloqueosTable = base(process.env.AIRTABLE_TABLE_BLOQUEOS as string);
const configTable = base(process.env.AIRTABLE_TABLE_CONFIG as string);

export async function getCanchas(): Promise<Cancha[]> {
    try {
        const records = await canchasTable.select().all();
        return records.map((record: { id: string; fields: Record<string, unknown> }) => ({
            id: record.id,
            nombre: record.fields['Nombre'] as string,
            descripcion: record.fields['Descripcion'] as string,
            foto_url: record.fields['Foto_URL'] as string,
            activa: record.fields['Activa'] as boolean,
            precio: record.fields['Precio'] as number,
            color: record.fields['Color'] as string,
        }));
    } catch (error) {
        console.error('Error fetching canchas:', error);
        throw error;
    }
}

export async function getCancha(id: string): Promise<Cancha | null> {
    try {
        const record = await canchasTable.find(id);
        return {
            id: record.id,
            nombre: record.get('Nombre') as string,
            descripcion: record.get('Descripcion') as string,
            foto_url: record.get('Foto_URL') as string,
            activa: record.get('Activa') as boolean,
            precio: record.get('Precio') as number,
            color: record.get('Color') as string,
        };
    } catch (error) {
        console.error(`Error fetching cancha ${id}:`, error);
        return null;
    }
}

export async function crearCancha(data: Omit<Cancha, 'id'>): Promise<Cancha> {
    try {
        const records = await canchasTable.create([
            {
                fields: {
                    Nombre: data.nombre,
                    Descripcion: data.descripcion,
                    Foto_URL: data.foto_url,
                    Activa: data.activa,
                    Precio: data.precio,
                    Color: data.color || '#1e3a5f',
                }
            }
        ]);
        const record = records[0];
        return {
            id: record.id,
            nombre: record.get('Nombre') as string,
            descripcion: record.get('Descripcion') as string,
            foto_url: record.get('Foto_URL') as string,
            activa: record.get('Activa') as boolean,
            precio: record.get('Precio') as number,
            color: record.get('Color') as string,
        };
    } catch (error) {
        console.error('Error creating cancha:', error);
        throw error;
    }
}

export async function actualizarCancha(id: string, data: Partial<Cancha>): Promise<Cancha> {
    try {
        const fields: any = {};
        if (data.nombre !== undefined) fields.Nombre = data.nombre;
        if (data.descripcion !== undefined) fields.Descripcion = data.descripcion;
        if (data.foto_url !== undefined) fields.Foto_URL = data.foto_url;
        if (data.activa !== undefined) fields.Activa = data.activa;
        if (data.precio !== undefined) fields.Precio = data.precio;
        if (data.color !== undefined) fields.Color = data.color;

        const records = await canchasTable.update([
            {
                id: id,
                fields: fields
            }
        ]);
        const record = records[0];

        return {
            id: record.id,
            nombre: record.get('Nombre') as string,
            descripcion: record.get('Descripcion') as string,
            foto_url: record.get('Foto_URL') as string,
            activa: record.get('Activa') as boolean,
            precio: record.get('Precio') as number,
            color: record.get('Color') as string,
        };
    } catch (error) {
        console.error(`Error updating cancha ${id}:`, error);
        throw error;
    }
}

export async function getReservas(fecha?: string): Promise<Reserva[]> {
    try {
        const queryOptions: { filterByFormula?: string; sort?: Array<{ field: string; direction: "asc" | "desc" }> } = {};
        if (fecha) {
            queryOptions.filterByFormula = `Fecha = '${fecha}'`;
        }
        const records = await reservasTable.select(queryOptions).all();
        return records.map((record: { id: string; fields: Record<string, unknown> }) => {
            const canchaField = record.fields['Cancha'] as string[] | undefined;
            return {
                id: record.id,
                cancha_id: canchaField && canchaField.length > 0 ? canchaField[0] : '',
                fecha: record.fields['Fecha'] as string,
                hora_inicio: record.fields['Hora_Inicio'] as string,
                hora_fin: record.fields['Hora_Fin'] as string,
                nombre_cliente: record.fields['Nombre_Cliente'] as string,
                telefono: record.fields['Telefono'] as string,
                email: record.fields['Email'] as string,
                estado: record.fields['Estado'] as Reserva['estado'],
                notas: record.fields['Notas'] as string | undefined,
            };
        });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        throw error;
    }
}

export async function crearReserva(data: Omit<Reserva, 'id'>): Promise<Reserva> {
    try {
        const records = await reservasTable.create([
            {
                fields: {
                    ID_Reserva: "RES-" + Date.now(),
                    Cancha: [data.cancha_id],
                    Fecha: data.fecha,
                    Hora_Inicio: data.hora_inicio,
                    Hora_Fin: data.hora_fin,
                    Nombre_Cliente: data.nombre_cliente,
                    Telefono: data.telefono,
                    Email: data.email,
                    Estado: data.estado,
                    Notas: data.notas || "",
                }
            }
        ]);
        const record = records[0];
        const canchaField = record.get('Cancha') as string[] | undefined;
        return {
            id: record.id,
            cancha_id: canchaField && canchaField.length > 0 ? canchaField[0] : data.cancha_id,
            fecha: record.get('Fecha') as string,
            hora_inicio: record.get('Hora_Inicio') as string,
            hora_fin: record.get('Hora_Fin') as string,
            nombre_cliente: record.get('Nombre_Cliente') as string,
            telefono: record.get('Telefono') as string,
            email: record.get('Email') as string,
            estado: record.get('Estado') as Reserva['estado'],
            notas: record.get('Notas') as string | undefined,
        };
    } catch (error) {
        console.error('Error creating reserva:', error);
        throw error;
    }
}

export async function actualizarReserva(id: string, data: Partial<Reserva>): Promise<Reserva> {
    try {
        const fields: any = {};
        if (data.cancha_id) fields.Cancha = [data.cancha_id];
        if (data.fecha) fields.Fecha = data.fecha;
        if (data.hora_inicio) fields.Hora_Inicio = data.hora_inicio;
        if (data.hora_fin) fields.Hora_Fin = data.hora_fin;
        if (data.nombre_cliente) fields.Nombre_Cliente = data.nombre_cliente;
        if (data.telefono) fields.Telefono = data.telefono;
        if (data.email) fields.Email = data.email;
        if (data.estado) fields.Estado = data.estado;
        if (data.notas !== undefined) fields.Notas = data.notas;

        const records = await reservasTable.update([
            {
                id: id,
                fields: fields
            }
        ]);
        const record = records[0];
        const canchaField = record.get('Cancha') as string[] | undefined;

        return {
            id: record.id,
            cancha_id: canchaField && canchaField.length > 0 ? canchaField[0] : '',
            fecha: record.get('Fecha') as string,
            hora_inicio: record.get('Hora_Inicio') as string,
            hora_fin: record.get('Hora_Fin') as string,
            nombre_cliente: record.get('Nombre_Cliente') as string,
            telefono: record.get('Telefono') as string,
            email: record.get('Email') as string,
            estado: record.get('Estado') as Reserva['estado'],
            notas: record.get('Notas') as string | undefined,
        };
    } catch (error) {
        console.error(`Error updating reserva ${id}:`, error);
        throw error;
    }
}

export async function cancelarReserva(id: string): Promise<void> {
    try {
        await reservasTable.update([
            {
                id: id,
                fields: {
                    Estado: 'Cancelada'
                }
            }
        ]);
    } catch (error) {
        console.error(`Error canceling reserva ${id}:`, error);
        throw error;
    }
}

export async function getBloqueos(): Promise<Bloqueo[]> {
    try {
        const records = await bloqueosTable.select().all();
        return records.map((record: { id: string; fields: Record<string, unknown> }) => {
            const canchaField = record.fields['Cancha'] as string[] | undefined;
            return {
                id: record.id,
                motivo: record.fields['Motivo'] as string,
                cancha_id: canchaField && canchaField.length > 0 ? canchaField[0] : '',
                fecha_inicio: record.fields['Fecha_Inicio'] as string,
                fecha_fin: record.fields['Fecha_Fin'] as string,
            };
        });
    } catch (error) {
        console.error('Error fetching bloqueos:', error);
        throw error;
    }
}

export async function crearBloqueo(data: Omit<Bloqueo, 'id'>): Promise<Bloqueo> {
    try {
        const records = await bloqueosTable.create([
            {
                fields: {
                    Motivo: data.motivo,
                    Cancha: [data.cancha_id],
                    Fecha_Inicio: data.fecha_inicio,
                    Fecha_Fin: data.fecha_fin,
                }
            }
        ]);
        const record = records[0];
        const canchaField = record.get('Cancha') as string[] | undefined;
        return {
            id: record.id,
            motivo: record.get('Motivo') as string,
            cancha_id: canchaField && canchaField.length > 0 ? canchaField[0] : data.cancha_id,
            fecha_inicio: record.get('Fecha_Inicio') as string,
            fecha_fin: record.get('Fecha_Fin') as string,
        };
    } catch (error) {
        console.error('Error creating bloqueo:', error);
        throw error;
    }
}

export async function eliminarBloqueo(id: string): Promise<void> {
    try {
        await bloqueosTable.destroy([id]);
    } catch (error) {
        console.error(`Error deleting bloqueo ${id}:`, error);
        throw error;
    }
}

export async function getConfig(): Promise<Config> {
    try {
        const records = await configTable.select().all();
        const configObj: any = {};

        records.forEach(record => {
            const clave = record.get('Clave') as string;
            const valor = record.get('Valor') as string;
            if (clave && valor) {
                configObj[clave] = valor;
            }
        });

        return {
            negocio_nombre: configObj['negocio_nombre'] || '',
            horario_apertura: configObj['horario_apertura'] || '',
            horario_cierre: configObj['horario_cierre'] || '',
            dias_operacion: configObj['dias_operacion'] ? configObj['dias_operacion'].split(',').map((d: string) => d.trim()) : [],
            direccion: configObj['direccion'] || '',
            telefono: configObj['telefono'] || '',
            instagram: configObj['instagram'] || '',
        };
    } catch (error) {
        console.error('Error fetching config:', error);
        throw error;
    }
}

export async function actualizarConfig(clave: string, valor: string): Promise<void> {
    try {
        const records = await configTable.select({
            filterByFormula: `Clave = '${clave}'`
        }).firstPage();

        if (records.length > 0) {
            await configTable.update([
                {
                    id: records[0].id,
                    fields: {
                        Valor: valor
                    }
                }
            ]);
        } else {
            // Optional fallback if clave doesn't exist, create it.
            await configTable.create([
                {
                    fields: {
                        Clave: clave,
                        Valor: valor
                    }
                }
            ]);
        }
    } catch (error) {
        console.error(`Error updating config ${clave}:`, error);
        throw error;
    }
}
