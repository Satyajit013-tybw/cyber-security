import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Threat } from '@/models/Threat';
import { Alert } from '@/models/Alert';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Date ranges
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

        // Parallel queries
        const [
            totalThreats,
            threatsToday,
            criticalThreats,
            openAlerts,
            resolvedToday,
            riskTrend,
            threatTypeBreakdown,
            severityBreakdown,
            recentAlerts,
            geoBreakdown,
        ] = await Promise.all([
            Threat.countDocuments(),
            Threat.countDocuments({ createdAt: { $gte: todayStart } }),
            Threat.countDocuments({ severity: 'critical' }),
            Alert.countDocuments({ status: 'open' }),
            Alert.countDocuments({ status: 'resolved', resolvedAt: { $gte: todayStart } }),
            // Daily threat volume for last 30 days
            Threat.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: { $dateToString: { format: '%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avgScore: { $avg: '$riskScore' } } },
                { $sort: { _id: 1 } },
            ]),
            // Attack type distribution
            Threat.aggregate([
                { $unwind: '$categories' },
                { $group: { _id: '$categories', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),
            // Severity distribution
            Threat.aggregate([
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            // Recent alerts
            Alert.find().sort({ createdAt: -1 }).limit(8).lean(),
            // Geographic origin
            Threat.aggregate([
                { $match: { countryCode: { $ne: null } } },
                { $group: { _id: '$countryCode', count: { $sum: 1 }, avgRisk: { $avg: '$riskScore' } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
        ]);

        return NextResponse.json({
            stats: { totalThreats, threatsToday, criticalThreats, openAlerts, resolvedToday },
            riskTrend,
            threatTypeBreakdown,
            severityBreakdown,
            recentAlerts,
            geoBreakdown,
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
