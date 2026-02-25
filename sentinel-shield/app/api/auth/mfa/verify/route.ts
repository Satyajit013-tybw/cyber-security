import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth-helpers';
import { logEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    const { token } = await req.json();
    await connectDB();
    const user = await User.findById(auth.payload!.userId);
    if (!user || !user.mfaSecret) return NextResponse.json({ error: 'MFA not configured' }, { status: 400 });

    const valid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 401 });

    user.mfaEnabled = true;
    await user.save();
    await logEvent(user._id.toString(), user.email, 'MFA_ENABLED', user.orgId);
    return NextResponse.json({ message: 'MFA enabled successfully' });
}
