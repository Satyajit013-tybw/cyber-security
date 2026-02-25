import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const users = await User.find({}, '-passwordHash -mfaSecret').sort({ createdAt: -1 }).lean();
        return NextResponse.json({ users });
    } catch (err) {
        console.error('Users GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const { userId, action, role } = await req.json();
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (action === 'approve') user.isApproved = true;
        else if (action === 'suspend') user.isApproved = false;
        else if (action === 'flag') user.isSuspended = !user.isSuspended;
        else if (action === 'setRole' && role) user.role = role;

        await user.save();
        return NextResponse.json({ user: { ...user.toObject(), passwordHash: undefined, mfaSecret: undefined } });
    } catch (err) {
        console.error('Users PATCH error:', err);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
