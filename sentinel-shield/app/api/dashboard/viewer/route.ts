import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Threat } from '@/models/Threat';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const userId = auth.payload!.userId;
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

        const [
            threatHistory,
            totalScansCount,
            threatsBlockedCount,
            riskTrendAvg,
            commonThreatsAgg,
            weeklyBlockedCount,
            monthlyBlockedCount,
            allUserThreats,
            weeklySafetyTrend,
            categoryBreakdownAgg
        ] = await Promise.all([
            // 1. Personal Threat History (Last 50 for the table)
            Threat.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),

            // 2. Total Scans (All time)
            Threat.countDocuments({ userId }),

            // 3. Threats Blocked (Critical & High)
            Threat.countDocuments({ userId, severity: { $in: ['critical', 'high'] } }),

            // 4. Risk Trend Graph (Last 14 days)
            Threat.aggregate([
                { $match: { userId, createdAt: { $gte: fourteenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        phishing: { $sum: { $cond: [{ $eq: [{ $arrayElemAt: ['$categories', 0] }, 'phishing'] }, 1, 0] } },
                        malware: { $sum: { $cond: [{ $eq: [{ $arrayElemAt: ['$categories', 0] }, 'malware'] }, 1, 0] } },
                        spam: { $sum: { $cond: [{ $eq: [{ $arrayElemAt: ['$categories', 0] }, 'spam'] }, 1, 0] } },
                        avgScore: { $avg: '$riskScore' },
                    }
                },
                { $sort: { _id: 1 } },
            ]),

            // 5. Most Common Threats (All time categories)
            Threat.aggregate([
                { $match: { userId } },
                { $unwind: '$categories' },
                { $group: { _id: '$categories', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
            ]),

            // 6. Weekly Threats Blocked (last 7 days, Critical & High)
            Threat.countDocuments({ userId, severity: { $in: ['critical', 'high'] }, createdAt: { $gte: sevenDaysAgo } }),

            // 7. Monthly Threats Blocked (last 30 days, Critical & High)
            Threat.countDocuments({ userId, severity: { $in: ['critical', 'high'] }, createdAt: { $gte: thirtyDaysAgo } }),

            // 8. All user threats for safety score calculation (last 30 days)
            Threat.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).select('riskScore severity categories').lean(),

            // 9. Weekly safety trend (last 7 days, daily safety score)
            Threat.aggregate([
                { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        avgRisk: { $avg: '$riskScore' },
                        totalScans: { $sum: 1 },
                        blocked: { $sum: { $cond: [{ $in: ['$severity', ['critical', 'high']] }, 1, 0] } },
                    }
                },
                { $sort: { _id: 1 } },
            ]),

            // 10. Category breakdown with percentages
            Threat.aggregate([
                { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
                { $unwind: '$categories' },
                { $group: { _id: '$categories', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        // Calculate Personal Safety Score (0-100, higher = safer)
        let safetyScore = 100;
        if (allUserThreats.length > 0) {
            const avgRisk = allUserThreats.reduce((sum: number, t: any) => sum + t.riskScore, 0) / allUserThreats.length;
            const criticalCount = allUserThreats.filter((t: any) => t.severity === 'critical').length;
            const highCount = allUserThreats.filter((t: any) => t.severity === 'high').length;
            // Deduct from 100 based on average risk and severe threat count
            safetyScore = Math.max(0, Math.round(100 - (avgRisk * 0.5) - (criticalCount * 5) - (highCount * 2)));
        }

        // Format risk trend for Recharts
        const riskTrend = riskTrendAvg.map((day: any) => ({
            date: day._id.slice(5), // MM-DD
            score: Math.round(day.avgScore),
            phishing: day.phishing,
            malware: day.malware,
            spam: day.spam,
        }));

        // Format common threats for Recharts
        const commonThreats = commonThreatsAgg.map((cat: any) => ({
            name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('_', ' '),
            val: cat.count
        }));

        // Format weekly safety trend
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const safetyTrend = weeklySafetyTrend.map((day: any) => ({
            day: dayNames[new Date(day._id).getDay()],
            date: day._id.slice(5),
            safetyScore: Math.max(0, Math.round(100 - (day.avgRisk * 0.5))),
            scans: day.totalScans,
            blocked: day.blocked,
        }));

        // Format category breakdown (with percentages)
        const totalCatCount = categoryBreakdownAgg.reduce((sum: number, c: any) => sum + c.count, 0);
        const categoryBreakdown = categoryBreakdownAgg.map((cat: any) => ({
            name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace('_', ' '),
            count: cat.count,
            percentage: totalCatCount > 0 ? Math.round((cat.count / totalCatCount) * 100) : 0,
        }));

        // Generate personalized tips based on activity
        const tips: { tip: string; priority: 'info' | 'warning' | 'success' }[] = [];
        const critCount = allUserThreats.filter((t: any) => t.severity === 'critical').length;
        const phishCount = allUserThreats.filter((t: any) => t.categories?.includes('Phishing')).length;
        const malwareCount = allUserThreats.filter((t: any) => t.categories?.includes('Malware')).length;
        const suspiciousCount = allUserThreats.filter((t: any) => t.categories?.includes('Suspicious Domain') || t.categories?.includes('Suspicious Link')).length;

        if (critCount > 2) tips.push({ tip: 'You have encountered multiple critical threats recently. Avoid clicking unknown links and enable 2FA on all accounts.', priority: 'warning' });
        if (phishCount > 0) tips.push({ tip: 'Phishing attempts detected in your activity. Always verify sender identity before clicking links in emails.', priority: 'warning' });
        if (malwareCount > 0) tips.push({ tip: 'Malware-associated content was flagged. Keep your browser and OS updated, and avoid downloading files from untrusted sources.', priority: 'warning' });
        if (suspiciousCount > 0) tips.push({ tip: 'You visited suspicious domains recently. Consider using a VPN and avoid entering credentials on unfamiliar sites.', priority: 'warning' });
        if (safetyScore >= 80) tips.push({ tip: 'Great job! Your safety score is excellent. Keep up the safe browsing habits.', priority: 'success' });
        if (allUserThreats.length === 0) tips.push({ tip: 'No threats detected yet. Use the Threat Scanner or Browser Protector extension to start monitoring your safety.', priority: 'info' });
        if (tips.length === 0) tips.push({ tip: 'Stay vigilant! Regularly scan suspicious content and keep your safety score high.', priority: 'info' });

        return NextResponse.json({
            threatHistory,
            stats: {
                totalScans: totalScansCount,
                threatsBlocked: threatsBlockedCount,
            },
            riskTrend,
            commonThreats,
            // Personal Safety Dashboard data
            safety: {
                safetyScore,
                weeklyBlocked: weeklyBlockedCount,
                monthlyBlocked: monthlyBlockedCount,
                safetyTrend,
                categoryBreakdown,
                tips,
                totalScansThisMonth: allUserThreats.length,
            }
        });
    } catch (err) {
        console.error('Viewer dashboard error:', err);
        return NextResponse.json({ error: 'Failed to fetch viewer data' }, { status: 500 });
    }
}
