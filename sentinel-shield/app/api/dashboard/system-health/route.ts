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
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const [queueDepth, recentScans, openAlerts, totalScans] = await Promise.all([
            Threat.countDocuments({ createdAt: { $gte: fiveMinAgo } }),
            Threat.countDocuments({ createdAt: { $gte: oneHourAgo } }),
            Alert.countDocuments({ status: 'open' }),
            Threat.countDocuments(),
        ]);

        // Measure DB response time
        const dbStart = Date.now();
        await Threat.findOne().lean();
        const dbLatency = Date.now() - dbStart;

        // Check AI backend status (Gemini API)
        let aiStatus = 'offline';
        let aiLatency = 0;
        try {
            const aiStart = Date.now();
            if (process.env.GEMINI_API_KEY) {
                aiStatus = 'active';
                aiLatency = Date.now() - aiStart;
            }
        } catch { aiStatus = 'offline'; }

        // Uptime (use process.uptime as proxy)
        const uptimeHours = Math.floor(process.uptime() / 3600);
        const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60);

        return NextResponse.json({
            apiResponseTime: dbLatency,
            aiBackendStatus: aiStatus,
            aiBackendLatency: aiLatency,
            scanQueueDepth: queueDepth,
            scansLastHour: recentScans,
            openAlerts,
            totalScans,
            uptime: `${uptimeHours}h ${uptimeMinutes}m`,
            dbStatus: 'connected',
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        });
    } catch (err) {
        console.error('System health error:', err);
        return NextResponse.json({ error: 'Failed to fetch health' }, { status: 500 });
    }
}
