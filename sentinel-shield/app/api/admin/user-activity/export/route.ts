import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Threat } from '@/models/Threat';

// ─── Demo fallback ───────────────────────────────────────────────────────
const DEMO_ACTIVITY = [
    { userId: 'admin-001', name: 'Admin User', email: 'admin@sentinelshield.ai', role: 'admin', lastLogin: new Date().toISOString(), lastLogout: '', lastSessionDuration: 0, totalLogins: 42, threatsDetected: 5, qrScansCount: 12, reportsFiled: 3, safeModeUsage: 8, reportsDownloaded: 6, safetyScore: 870, isOnline: true, isSuspended: false, createdAt: new Date('2026-01-15').toISOString() },
    { userId: 'user-001', name: 'Demo User', email: 'user@sentinelshield.ai', role: 'viewer', lastLogin: new Date(Date.now() - 3600000).toISOString(), lastLogout: new Date(Date.now() - 1800000).toISOString(), lastSessionDuration: 1800, totalLogins: 18, threatsDetected: 2, qrScansCount: 7, reportsFiled: 1, safeModeUsage: 4, reportsDownloaded: 2, safetyScore: 620, isOnline: false, isSuspended: false, createdAt: new Date('2026-01-20').toISOString() },
    { userId: 'mod-001', name: 'Moderator User', email: 'mod@sentinelshield.ai', role: 'moderator', lastLogin: new Date(Date.now() - 7200000).toISOString(), lastLogout: new Date(Date.now() - 5400000).toISOString(), lastSessionDuration: 1800, totalLogins: 31, threatsDetected: 8, qrScansCount: 22, reportsFiled: 5, safeModeUsage: 11, reportsDownloaded: 9, safetyScore: 780, isOnline: false, isSuspended: false, createdAt: new Date('2026-01-18').toISOString() },
];

function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
}

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;

    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const filter = url.searchParams.get('filter') || '';

    try {
        await connectDB();
        const users = await User.find({}, '-passwordHash -mfaSecret -trustedDevices').lean();
        const threatCounts = await Threat.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]);
        const threatMap: Record<string, number> = {};
        threatCounts.forEach((t: any) => { threatMap[t._id] = t.count; });

        let activity = users.map((u: any) => ({
            userId: u._id?.toString() || u.id,
            name: u.name || 'Anonymous',
            email: u.email,
            role: u.role,
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : '',
            lastLogout: u.lastLogout ? new Date(u.lastLogout).toISOString() : '',
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
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
        }));

        if (activity.length === 0) activity = [...DEMO_ACTIVITY];
        if (search) activity = activity.filter((u) => u.name.toLowerCase().includes(search) || u.userId.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
        if (filter === 'online') activity = activity.filter((u) => u.isOnline);
        else if (filter === 'most_threats') activity.sort((a, b) => b.threatsDetected - a.threatsDetected);
        else if (filter === 'most_active') activity.sort((a, b) => b.totalLogins - a.totalLogins);
        else if (filter === 'newest') activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Build CSV
        const headers = ['User ID', 'Name', 'Email', 'Role', 'Last Login', 'Last Logout', 'Session Duration', 'Total Logins', 'Threats Detected', 'QR Scans', 'Reports Filed', 'Safe Mode Usage', 'Reports Downloaded', 'Safety Score', 'Status', 'Suspended'];
        const rows = activity.map((u) => [
            u.userId, u.name, u.email, u.role,
            formatDate(u.lastLogin), formatDate(u.lastLogout),
            formatDuration(u.lastSessionDuration), u.totalLogins,
            u.threatsDetected, u.qrScansCount, u.reportsFiled,
            u.safeModeUsage, u.reportsDownloaded, u.safetyScore,
            u.isOnline ? 'Online' : 'Offline', u.isSuspended ? 'Yes' : 'No',
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="user-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (err) {
        console.error('Export error, using demo data:', err);
        // Fallback to demo
        const headers = ['User ID', 'Name', 'Email', 'Role', 'Last Login', 'Last Logout', 'Session Duration', 'Total Logins', 'Threats Detected', 'QR Scans', 'Reports Filed', 'Safe Mode Usage', 'Reports Downloaded', 'Safety Score', 'Status', 'Suspended'];
        const rows = DEMO_ACTIVITY.map((u) => [
            u.userId, u.name, u.email, u.role,
            formatDate(u.lastLogin), formatDate(u.lastLogout),
            formatDuration(u.lastSessionDuration), u.totalLogins,
            u.threatsDetected, u.qrScansCount, u.reportsFiled,
            u.safeModeUsage, u.reportsDownloaded, u.safetyScore,
            u.isOnline ? 'Online' : 'Offline', u.isSuspended ? 'Yes' : 'No',
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="user-activity-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    }
}
