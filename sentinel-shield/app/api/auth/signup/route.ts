import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, orgName, adminKey } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        await connectDB();

        // Check if email already exists in MongoDB
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return NextResponse.json({ error: 'Email already registered. Please login.' }, { status: 409 });
        }

        // Determine role
        const isAdmin = adminKey === 'abhishek@116';
        const role = isAdmin ? 'admin' : 'viewer';
        const resolvedOrgName = orgName || 'My Organization';
        const orgId = `org_${Date.now()}`;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Save to MongoDB
        const newUser = await User.create({
            name,
            email: normalizedEmail,
            passwordHash,
            role,
            orgName: resolvedOrgName,
            orgId,
            isVerified: true,
            isApproved: true,
            mfaEnabled: false,
            trustedDevices: [],
            isOnline: true,
            lastLogin: new Date(),
            totalLogins: 1,
            safetyScore: 100,
            qrScansCount: 0,
            reportsFiled: 0,
            safeModeUsage: 0,
            reportsDownloaded: 0,
            isSuspended: false,
        });

        const userId = newUser._id.toString();

        // Auto-login by returning a token
        const token = signToken({ userId, email: normalizedEmail, role, orgId });
        const res = NextResponse.json({
            message: isAdmin ? 'Admin account created successfully!' : 'Account created successfully! Logging you in...',
            autoLogin: true,
            user: { id: userId, name, email: normalizedEmail, role, orgName: resolvedOrgName },
        }, { status: 201 });
        res.cookies.set('ss_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
        return res;

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 });
    }
}
