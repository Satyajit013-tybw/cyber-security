import { NextRequest, NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    await connectDB();
    const user = await User.findById(auth.payload!.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const secret = speakeasy.generateSecret({
        name: `SentinelShield (${user.email})`,
        issuer: 'SentinelShield AI',
    });

    user.mfaSecret = secret.base32;
    await user.save();

    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!);
    return NextResponse.json({ qrCode: qrCodeDataURL, secret: secret.base32 });
}
