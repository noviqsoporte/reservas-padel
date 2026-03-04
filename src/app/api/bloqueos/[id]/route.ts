import { NextResponse } from 'next/server';
import { eliminarBloqueo } from '@/lib/airtable';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        await eliminarBloqueo(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(`Error in DELETE /api/bloqueos/${params.id}:`, error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
