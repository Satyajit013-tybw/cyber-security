import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Rule } from '@/models/Rule';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const rules = await Rule.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json({ rules });
    } catch (err) {
        console.error('Rules GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req, ['admin', 'moderator']);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const body = await req.json();
        const rule = await Rule.create({ ...body, createdBy: auth.payload!.userId, orgId: auth.payload!.orgId || 'org-sentinel-001' });
        return NextResponse.json({ rule }, { status: 201 });
    } catch (err) {
        console.error('Rules POST error:', err);
        return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = requireAuth(req, ['admin', 'moderator']);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const { ruleId, ...updates } = await req.json();
        const rule = await Rule.findByIdAndUpdate(ruleId, updates, { new: true }).lean();
        if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        return NextResponse.json({ rule });
    } catch (err) {
        console.error('Rules PATCH error:', err);
        return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;
    try {
        await connectDB();
        const { ruleId } = await req.json();
        await Rule.findByIdAndDelete(ruleId);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Rules DELETE error:', err);
        return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }
}
