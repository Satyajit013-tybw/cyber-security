import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
    const res = NextResponse.json({ message: 'Logged out successfully' });
    res.cookies.delete('ss_token');

    // Track logout activity
    try {
        const token = req.cookies.get('ss_token')?.value;
        if (token) {
            const payload = verifyToken(token);
            if (payload?.userId) {
                const connectDB = (await import('@/lib/db')).default;
                const { User } = await import('@/models/User');
                await connectDB();
                const user = await User.findById(payload.userId);
                if (user) {
                    const now = new Date();
                    user.lastLogout = now;
                    user.isOnline = false;
                    if (user.lastLogin) {
                        user.lastSessionDuration = Math.round((now.getTime() - new Date(user.lastLogin).getTime()) / 1000);
                    }
                    await user.save();
                }
            }
        }
    } catch (err) {
        // Don't block logout on tracking errors
        console.error('Logout tracking error:', err);
    }

    return res;
}
