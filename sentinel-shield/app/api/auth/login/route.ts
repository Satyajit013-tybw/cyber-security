import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

// ─── HARDCODED DEMO ACCOUNTS ─────────────────────────────────────────────────
// These work even without any database connection
const DEMO_USERS = [
    {
        id: 'admin-001',
        name: 'Admin User',
        email: 'admin@sentinelshield.ai',
        password: 'Admin@12345!',
        role: 'admin' as const,
        orgName: 'SentinelShield HQ',
        orgId: 'org-001',
    },
    {
        id: 'user-001',
        name: 'Demo User',
        email: 'user@sentinelshield.ai',
        password: 'User@12345!',
        role: 'viewer' as const,
        orgName: 'Demo Organization',
        orgId: 'org-001',
    },
    {
        id: 'mod-001',
        name: 'Moderator User',
        email: 'mod@sentinelshield.ai',
        password: 'Mod@12345!',
        role: 'moderator' as const,
        orgName: 'SentinelShield HQ',
        orgId: 'org-001',
    },
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // ── Step 1: Check hardcoded demo accounts first (no DB needed) ──────
        const demoUser = DEMO_USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (demoUser) {
            if (demoUser.password !== password) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const token = signToken({
                userId: demoUser.id,
                email: demoUser.email,
                role: demoUser.role,
                orgId: demoUser.orgId,
            });

            const res = NextResponse.json({
                user: {
                    id: demoUser.id,
                    name: demoUser.name,
                    email: demoUser.email,
                    role: demoUser.role,
                    orgName: demoUser.orgName,
                },
            });

            res.cookies.set('ss_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return res;
        }

        // ── Step 2: Try real DB login (if MongoDB is configured) ─────────────
        try {
            const bcrypt = (await import('bcryptjs')).default;
            const connectDB = (await import('@/lib/db')).default;
            const { User } = await import('@/models/User');

            await connectDB();
            const user = await User.findOne({ email });

            if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            if (!user.isVerified) return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 });
            if (!user.isApproved) return NextResponse.json({ error: 'Account pending admin approval' }, { status: 403 });

            const validPassword = await bcrypt.compare(password, user.passwordHash);
            if (!validPassword) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

            const token = signToken({
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                orgId: user.orgId,
            });

            // Track login activity
            user.lastLogin = new Date();
            user.isOnline = true;
            user.totalLogins = (user.totalLogins || 0) + 1;
            await user.save();

            const res = NextResponse.json({
                user: { id: user._id, name: user.name, email: user.email, role: user.role, orgName: user.orgName },
            });
            res.cookies.set('ss_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
            return res;
        } catch {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
