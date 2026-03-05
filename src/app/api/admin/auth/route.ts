import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (password === process.env.ADMIN_PASSWORD) {
            const response = NextResponse.json({ success: true });

            response.cookies.set('admin_session', password, {
                maxAge: 60 * 60 * 24 * 7, // 7 días
                httpOnly: true,
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });

            return response;
        }

        return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    } catch (_error) {
        return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
    }
}
