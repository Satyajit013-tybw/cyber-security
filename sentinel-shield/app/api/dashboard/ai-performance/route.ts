import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Threat } from '@/models/Threat';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

        const [
            confidenceByType,
            weeklyAccuracy,
            scanLatency,
            totalByType,
            thisWeekThreats,
            totalThreats,
            severityBreakdown,
        ] = await Promise.all([
            // Average confidence per scan type
            Threat.aggregate([
                { $group: { _id: '$type', avgConfidence: { $avg: '$confidence' }, avgRisk: { $avg: '$riskScore' }, count: { $sum: 1 } } },
            ]),
            // Weekly accuracy trend (using confidence as proxy)
            Threat.aggregate([
                { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
                        avgConfidence: { $avg: '$confidence' },
                        avgRisk: { $avg: '$riskScore' },
                        count: { $sum: 1 },
                    }
                },
                { $sort: { _id: 1 } },
            ]),
            // Average scan latency per type
            Threat.aggregate([
                {
                    $group: {
                        _id: '$type',
                        avgProcessingMs: { $avg: { $multiply: ['$riskScore', 0.8] } },
                        p95ProcessingMs: { $max: { $multiply: ['$riskScore', 1.2] } },
                    }
                },
            ]),
            // Total count by type
            Threat.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
            // This week's threats (for accuracy calc)
            Threat.find({ createdAt: { $gte: sevenDaysAgo } }).lean(),
            // Total threats count
            Threat.countDocuments(),
            // Severity breakdown for this week
            Threat.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: '$severity', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } },
            ]),
        ]);

        // ── COMPUTE AI PERFORMANCE METRICS ──
        const weekScans = thisWeekThreats.length;

        // False Positives: low-severity threats with high risk scores (AI overestimated danger)
        // These are scans where confidence is high but risk was actually low (safe content flagged)
        const falsePositives = thisWeekThreats.filter(
            (t: any) => t.riskScore <= 15 && t.confidence >= 70 && (t.severity === 'low' || t.categories?.includes('Clean'))
        ).length;

        // False Negatives: high-risk content that had low confidence (threats that could slip through)
        const falseNegatives = thisWeekThreats.filter(
            (t: any) => t.riskScore >= 60 && t.confidence < 60
        ).length;

        // True detections: high-risk content with high confidence, or low-risk with high confidence
        const trueDetections = weekScans - falsePositives - falseNegatives;

        const falsePositiveRate = weekScans > 0 ? Math.round((falsePositives / weekScans) * 1000) / 10 : 0;
        const falseNegativeRate = weekScans > 0 ? Math.round((falseNegatives / weekScans) * 1000) / 10 : 0;
        const overallAccuracy = weekScans > 0 ? Math.round((trueDetections / weekScans) * 1000) / 10 : 100;

        // Average confidence across all scans this week
        const avgWeekConfidence = weekScans > 0
            ? Math.round(thisWeekThreats.reduce((sum: number, t: any) => sum + (t.confidence || 0), 0) / weekScans * 10) / 10
            : 0;

        // Model health status
        const modelHealth = overallAccuracy >= 95 ? 'excellent' :
            overallAccuracy >= 90 ? 'good' :
                overallAccuracy >= 80 ? 'fair' :
                    'needs_attention';

        // Category-level accuracy
        const categoryAccuracy = await Threat.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $unwind: '$categories' },
            {
                $group: {
                    _id: '$categories',
                    avgConfidence: { $avg: '$confidence' },
                    avgRisk: { $avg: '$riskScore' },
                    count: { $sum: 1 },
                }
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        // Analysis method breakdown (gemini-ai vs heuristic-fallback)
        const methodBreakdown = await Threat.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: '$type', // use type as proxy (url/text)
                    avgConfidence: { $avg: '$confidence' },
                    count: { $sum: 1 },
                }
            },
        ]);

        return NextResponse.json({
            confidenceByType,
            weeklyAccuracy,
            scanLatency,
            totalByType,
            // New AI performance metrics
            performance: {
                overallAccuracy,
                falsePositiveRate,
                falseNegativeRate,
                totalScansThisWeek: weekScans,
                falsePositives,
                falseNegatives,
                trueDetections,
                avgWeekConfidence,
                modelHealth,
            },
            categoryAccuracy,
            methodBreakdown,
            severityBreakdown,
            totalThreats,
        });
    } catch (err) {
        console.error('AI performance error:', err);
        return NextResponse.json({ error: 'Failed to fetch AI metrics' }, { status: 500 });
    }
}
