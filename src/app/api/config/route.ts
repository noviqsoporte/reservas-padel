import { NextResponse } from 'next/server';
import { getConfig, actualizarConfig } from '@/lib/airtable';

export async function GET() {
    try {
        const config = await getConfig();
        return NextResponse.json({ config });
    } catch (error) {
        console.error('Error in GET /api/config:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { clave, valor } = body;

        if (!clave || valor === undefined) {
            return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
        }

        await actualizarConfig(clave, valor);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in PATCH /api/config:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
