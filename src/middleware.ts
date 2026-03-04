import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Solo aplicar al admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Si es login, dejar pasar
        if (request.nextUrl.pathname.startsWith('/admin/login')) {
            return NextResponse.next();
        }

        const session = request.cookies.get('admin_session');

        // Validar contraseña
        if (!session || session.value !== process.env.ADMIN_PASSWORD) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // Si es válida, continuar
        return NextResponse.next();
    }
}

export const config = {
    matcher: ['/admin/:path*']
};
