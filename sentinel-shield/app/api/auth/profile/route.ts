import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { verifyToken, signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get('ss_token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = verifyToken(token);
        if (!decoded || !decoded.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        await connectDB();
        const user = await User.findById(decoded.userId);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await req.json();
        const { name, currentPassword, newPassword, avatar, mfaEnabled, emailNotifications } = body;

        let needsNewToken = false;

        // Update Name
        if (name && name.trim() !== '' && name !== user.name) {
            user.name = name.trim();
            needsNewToken = true;
        }

        // Update Avatar
        if (avatar !== undefined) {
            user.avatar = avatar; // Will save as base64 string
        }

        // Update Security Toggles
        if (mfaEnabled !== undefined) {
            user.mfaEnabled = mfaEnabled;
            // Note: A full implementation would prompt for a QR code setup here before enabling.
            // For now we just save the preference as requested.
        }
        if (emailNotifications !== undefined) {
            user.emailNotifications = emailNotifications;
        }

        // Update Password
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }
            if (newPassword.length < 8) {
                return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
            }
            user.passwordHash = await bcrypt.hash(newPassword, 12);
        }

        await user.save();

        if (needsNewToken) {
            // Give them a new token with the new name
            const newToken = signToken({ userId: user._id.toString(), email: user.email, role: user.role, orgId: user.orgId });
            const res = NextResponse.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, mfaEnabled: user.mfaEnabled, emailNotifications: user.emailNotifications } }, { status: 200 });
            res.cookies.set('ss_token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });
            return res;
        }

        return NextResponse.json({ message: 'Profile updated successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, mfaEnabled: user.mfaEnabled, emailNotifications: user.emailNotifications } }, { status: 200 });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
