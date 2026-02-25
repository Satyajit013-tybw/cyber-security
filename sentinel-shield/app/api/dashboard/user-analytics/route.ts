import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        const [actionBreakdown, userActivity, recentLogs, dailyActivity] = await Promise.all([
            // Aggregate actions by type
            AuditLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Activity per user
            AuditLog.aggregate([
                { $group: { _id: { actor: '$actor', email: '$actorEmail' }, actions: { $sum: 1 }, lastActive: { $max: '$createdAt' } } },
                { $sort: { actions: -1 } },
                { $limit: 10 },
            ]),
            // Recent audit log entries
            AuditLog.find().sort({ createdAt: -1 }).limit(15).lean(),
            // Daily activity over last 14 days
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
                { $group: { _id: { $dateToString: { format: '%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
        ]);

        return NextResponse.json({ actionBreakdown, userActivity, recentLogs, dailyActivity });
    } catch (err) {
        console.error('User analytics error:', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
