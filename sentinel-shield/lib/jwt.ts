import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'admin' | 'moderator' | 'viewer';
    orgId: string;
}

export function signToken(payload: JWTPayload, expiresIn = '7d'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function signEmailToken(payload: object, expiresIn = '24h'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}
