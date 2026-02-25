import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Threat } from '@/models/Threat';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();

        // Group threats by userId that have multiple scan types
        const profiles = await Threat.aggregate([
            // Group by userId
            {
                $group: {
                    _id: '$userId',
                    scanTypes: { $addToSet: '$type' },
                    totalScans: { $sum: 1 },
                    avgRisk: { $avg: '$riskScore' },
                    maxRisk: { $max: '$riskScore' },
                    criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
                    highCount: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
                    categories: { $addToSet: { $arrayElemAt: ['$categories', 0] } },
                    lastScan: { $max: '$createdAt' },
                    ips: { $addToSet: '$ipAddress' },
                    countries: { $addToSet: '$countryCode' },
                }
            },
            // Only keep users with multiple scan types (composite)
            { $match: { $expr: { $gt: [{ $size: '$scanTypes' }, 1] } } },
            // Calculate composite risk score (weighted)
            {
                $addFields: {
                    compositeRisk: {
                        $min: [100, {
                            $add: [
                                '$avgRisk',
                                { $multiply: ['$criticalCount', 5] },
                                { $multiply: [{ $subtract: [{ $size: '$scanTypes' }, 1] }, 8] },
                            ]
                        }]
                    }
                }
            },
            { $sort: { compositeRisk: -1 } },
            { $limit: 10 },
        ]);

        return NextResponse.json({ profiles });
    } catch (err) {
        console.error('Composite profiles error:', err);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
}
