import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Threat } from '@/models/Threat';

// ─── Demo fallback data ──────────────────────────────────────────────────
const DEMO_ACTIVITY = [
    { userId: 'admin-001', name: 'Admin User', email: 'admin@sentinelshield.ai', role: 'admin', lastLogin: new Date().toISOString(), lastLogout: null, lastSessionDuration: 0, totalLogins: 42, threatsDetected: 5, qrScansCount: 12, reportsFiled: 3, safeModeUsage: 8, reportsDownloaded: 6, safetyScore: 870, isOnline: true, isSuspended: false, createdAt: new Date('2026-01-15').toISOString() },
    { userId: 'user-001', name: 'Demo User', email: 'user@sentinelshield.ai', role: 'viewer', lastLogin: new Date(Date.now() - 3600000).toISOString(), lastLogout: new Date(Date.now() - 1800000).toISOString(), lastSessionDuration: 1800, totalLogins: 18, threatsDetected: 2, qrScansCount: 7, reportsFiled: 1, safeModeUsage: 4, reportsDownloaded: 2, safetyScore: 620, isOnline: false, isSuspended: false, createdAt: new Date('2026-01-20').toISOString() },
    { userId: 'mod-001', name: 'Moderator User', email: 'mod@sentinelshield.ai', role: 'moderator', lastLogin: new Date(Date.now() - 7200000).toISOString(), lastLogout: new Date(Date.now() - 5400000).toISOString(), lastSessionDuration: 1800, totalLogins: 31, threatsDetected: 8, qrScansCount: 22, reportsFiled: 5, safeModeUsage: 11, reportsDownloaded: 9, safetyScore: 780, isOnline: false, isSuspended: false, createdAt: new Date('2026-01-18').toISOString() },
    { userId: 'user-002', name: 'Alex Rivera', email: 'alex@example.com', role: 'viewer', lastLogin: new Date(Date.now() - 86400000).toISOString(), lastLogout: new Date(Date.now() - 82800000).toISOString(), lastSessionDuration: 3600, totalLogins: 55, threatsDetected: 12, qrScansCount: 34, reportsFiled: 7, safeModeUsage: 15, reportsDownloaded: 4, safetyScore: 920, isOnline: false, isSuspended: false, createdAt: new Date('2026-01-10').toISOString() },
    { userId: 'user-003', name: 'Sam Chen', email: 'sam@example.com', role: 'viewer', lastLogin: new Date(Date.now() - 172800000).toISOString(), lastLogout: new Date(Date.now() - 169200000).toISOString(), lastSessionDuration: 3600, totalLogins: 9, threatsDetected: 0, qrScansCount: 3, reportsFiled: 0, safeModeUsage: 1, reportsDownloaded: 1, safetyScore: 340, isOnline: false, isSuspended: false, createdAt: new Date('2026-02-01').toISOString() },
    { userId: 'user-004', name: 'Jordan Kim', email: 'jordan@example.com', role: 'viewer', lastLogin: new Date().toISOString(), lastLogout: null, lastSessionDuration: 0, totalLogins: 27, threatsDetected: 3, qrScansCount: 15, reportsFiled: 2, safeModeUsage: 6, reportsDownloaded: 3, safetyScore: 710, isOnline: true, isSuspended: false, createdAt: new Date('2026-01-25').toISOString() },
    { userId: 'user-005', name: 'Taylor Morgan', email: 'taylor@example.com', role: 'viewer', lastLogin: new Date(Date.now() - 43200000).toISOString(), lastLogout: new Date(Date.now() - 39600000).toISOString(), lastSessionDuration: 3600, totalLogins: 4, threatsDetected: 1, qrScansCount: 1, reportsFiled: 0, safeModeUsage: 0, reportsDownloaded: 0, safetyScore: 180, isOnline: false, isSuspended: true, createdAt: new Date('2026-02-10').toISOString() },
];

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const filter = url.searchParams.get('filter') || '';
    const sortField = url.searchParams.get('sort') || 'createdAt';
    const sortOrder = url.searchParams.get('order') === 'asc' ? 1 : -1;

    try {
        await connectDB();

        // Fetch all users (exclude sensitive fields)
        const users = await User.find({}, '-passwordHash -mfaSecret -trustedDevices').lean();

        // Get threat counts per userId
        const threatCounts = await Threat.aggregate([
            { $group: { _id: '$userId', count: { $sum: 1 } } },
        ]);
        const threatMap: Record<string, number> = {};
        threatCounts.forEach((t: any) => { threatMap[t._id] = t.count; });

        // Build activity list
        let activity = users.map((u: any) => ({
            userId: u._id?.toString() || u.id,
            name: u.name || 'Anonymous',
            email: u.email,
            role: u.role,
            lastLogin: u.lastLogin || null,
            lastLogout: u.lastLogout || null,
            lastSessionDuration: u.lastSessionDuration || 0,
            totalLogins: u.totalLogins || 0,
            threatsDetected: threatMap[u._id?.toString()] || 0,
            qrScansCount: u.qrScansCount || 0,
            reportsFiled: u.reportsFiled || 0,
            safeModeUsage: u.safeModeUsage || 0,
            reportsDownloaded: u.reportsDownloaded || 0,
            safetyScore: u.safetyScore || 0,
            isOnline: u.isOnline || false,
            isSuspended: u.isSuspended || false,
            createdAt: u.createdAt,
        }));

        // If no DB users, use demo data
        if (activity.length === 0) activity = DEMO_ACTIVITY;

        // Search
        if (search) {
            activity = activity.filter(
                (u) => u.name.toLowerCase().includes(search) || u.userId.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
            );
        }

        // Filter
        if (filter === 'online') activity = activity.filter((u) => u.isOnline);
        else if (filter === 'most_threats') activity = [...activity].sort((a, b) => b.threatsDetected - a.threatsDetected);
        else if (filter === 'most_active') activity = [...activity].sort((a, b) => b.totalLogins - a.totalLogins);
        else if (filter === 'newest') activity = [...activity].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Sort (if not already sorted by filter)
        if (!filter || filter === 'online') {
            activity.sort((a: any, b: any) => {
                const aVal = a[sortField] ?? '';
                const bVal = b[sortField] ?? '';
                if (typeof aVal === 'string') return sortOrder * aVal.localeCompare(bVal);
                return sortOrder * ((aVal as number) - (bVal as number));
            });
        }

        // Summary stats
        const summary = {
            totalUsers: activity.length,
            onlineNow: activity.filter((u) => u.isOnline).length,
            totalThreats: activity.reduce((s, u) => s + u.threatsDetected, 0),
            avgSafetyScore: activity.length > 0 ? Math.round(activity.reduce((s, u) => s + u.safetyScore, 0) / activity.length) : 0,
            suspendedCount: activity.filter((u) => u.isSuspended).length,
        };

        return NextResponse.json({ activity, summary });
    } catch (err) {
        // Fallback to demo data on DB error
        console.error('User activity error, using demo data:', err);
        let activity = [...DEMO_ACTIVITY];
        if (search) activity = activity.filter((u) => u.name.toLowerCase().includes(search) || u.userId.toLowerCase().includes(search));
        const summary = {
            totalUsers: activity.length,
            onlineNow: activity.filter((u) => u.isOnline).length,
            totalThreats: activity.reduce((s, u) => s + u.threatsDetected, 0),
            avgSafetyScore: activity.length > 0 ? Math.round(activity.reduce((s, u) => s + u.safetyScore, 0) / activity.length) : 0,
            suspendedCount: activity.filter((u) => u.isSuspended).length,
        };
        return NextResponse.json({ activity, summary });
    }
}
