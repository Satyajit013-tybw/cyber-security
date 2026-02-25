import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export type UserRole = 'admin' | 'moderator' | 'viewer';

export function getTokenFromRequest(req: NextRequest): string | null {
    const cookie = req.cookies.get('ss_token');
    if (cookie) return cookie.value;
    const auth = req.headers.get('Authorization');
    if (auth?.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

export function requireAuth(req: NextRequest, allowedRoles?: UserRole[]) {
    const token = getTokenFromRequest(req);
    if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

    try {
        const payload = verifyToken(token);
        if (allowedRoles && !allowedRoles.includes(payload.role)) {
            return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
        }
        return { payload };
    } catch {
        return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
    }
}
