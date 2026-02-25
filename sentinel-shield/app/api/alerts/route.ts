import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Alert } from '@/models/Alert';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const url = new URL(req.url);
        const status = url.searchParams.get('status');
        const filter: any = {};
        if (status) filter.status = status;

        const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(50).lean();
        return NextResponse.json({ alerts });
    } catch (err) {
        console.error('Alerts GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = requireAuth(req, ['admin', 'moderator']);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const { alertId, action, reasonTag } = await req.json();

        if (!alertId || !action) {
            return NextResponse.json({ error: 'alertId and action required' }, { status: 400 });
        }

        const statusMap: Record<string, string> = {
            accept: 'resolved',
            escalate: 'escalated',
            dismiss: 'dismissed',
        };

        const newStatus = statusMap[action];
        if (!newStatus) {
            return NextResponse.json({ error: 'Invalid action. Use: accept, escalate, dismiss' }, { status: 400 });
        }

        const update: any = {
            status: newStatus,
            reasonTag: reasonTag || action,
            reviewedBy: auth.payload?.email || auth.payload?.userId || 'unknown',
        };

        if (action === 'accept') {
            update.resolvedBy = auth.payload?.email || auth.payload?.userId;
            update.resolvedAt = new Date();
        }

        const alert = await Alert.findByIdAndUpdate(alertId, update, { new: true }).lean();
        if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

        return NextResponse.json({ alert });
    } catch (err) {
        console.error('Alerts PATCH error:', err);
        return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }
}
