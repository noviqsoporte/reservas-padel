import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: reservas, error } = await serviceClient
        .from('reservas')
        .select('*, canchas(nombre, precio, color)')
        .or(`profile_id.eq.${user.id},email.eq.${user.email}`)
        .neq('estado', 'Cancelada')
        .order('fecha', { ascending: false })
        .order('hora_inicio', { ascending: false });

    if (error) {
        console.error('[mis-reservas] error supabase:', error);
        return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    return NextResponse.json({ reservas: reservas ?? [] });
}
