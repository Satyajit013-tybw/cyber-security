import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { logEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get('token');
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

        const payload = verifyToken(token) as { userId: string; email: string };
        await connectDB();

        const user = await User.findById(payload.userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        if (user.isVerified) return NextResponse.json({ message: 'Already verified' });

        user.isVerified = true;
        await user.save();

        await logEvent(user._id.toString(), user.email, 'EMAIL_VERIFIED', user.orgId);

        // Redirect to login with success message
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`);
    } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
}
