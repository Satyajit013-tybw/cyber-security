import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    const token = req.cookies.get('ss_token')?.value;
    const path = req.nextUrl.pathname;
    const isAuthRoute = path === '/login' || path === '/signup' || path === '/verify-email';

    // Allow next _next system paths and static api endpoints
    if (path.startsWith('/_next') || path.startsWith('/api') || path === '/favicon.ico') {
        return NextResponse.next();
    }

    // Let the landing page always be publicly accessible
    if (path === '/') {
        return NextResponse.next();
    }

    // Redirect to login if unauthenticated on private route
    if (!token && !isAuthRoute) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    // Handle authenticated routing logic
    if (token) {
        try {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

            // If going to login while authenticated, send to dash
            if (isAuthRoute && path !== '/verify-email') {
                return NextResponse.redirect(new URL(`/${payload.role === 'admin' ? 'admin' : payload.role === 'moderator' ? 'moderator' : 'viewer'}`, req.url));
            }

            // Basic client-side role guarding (true validation happens at API layer)
            if (path.startsWith('/admin') && payload.role !== 'admin') {
                return NextResponse.redirect(new URL('/viewer', req.url));
            }
            if (path.startsWith('/moderator') && !['admin', 'moderator'].includes(payload.role)) {
                return NextResponse.redirect(new URL('/viewer', req.url));
            }

        } catch {
            // Invalid token format
            const res = NextResponse.redirect(new URL('/login', req.url));
            res.cookies.delete('ss_token');
            return res;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
