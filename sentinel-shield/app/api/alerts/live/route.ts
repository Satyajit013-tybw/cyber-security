import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Alert } from '@/models/Alert';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const orgId = auth.payload!.orgId || 'org-sentinel-001';

        // Simply fetch the last 10 open alerts for the organization for the ticker
        const alerts = await Alert.find({ orgId, status: 'open' })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        return NextResponse.json({ alerts });
    } catch (err) {
        console.error('Live alerts error:', err);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}
