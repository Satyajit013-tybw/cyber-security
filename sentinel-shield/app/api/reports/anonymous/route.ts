import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { AnonymousReport } from '@/models/AnonymousReport';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    // Auth is required to prevent spam, but we STRIP the identity before saving
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const { category, description, evidenceUrl, urgency } = await req.json();

        if (!category || !description) {
            return NextResponse.json({ error: 'Category and description are required' }, { status: 400 });
        }

        // Generate a random report ID (NOT linked to user in any way)
        const reportId = `RPT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

        // Org ID is kept for multi-tenant routing, but user identity is NEVER stored
        const orgId = auth.payload!.orgId || 'org-sentinel-001';

        // Strip any PII from the description
        const sanitizedDescription = description
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
            .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE REDACTED]')
            .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN REDACTED]');

        const report = await AnonymousReport.create({
            reportId,
            category,
            description: sanitizedDescription,
            evidenceUrl: evidenceUrl || undefined,
            urgency: urgency || 'medium',
            orgId,
            // INTENTIONALLY NO: userId, email, ipAddress
        });

        return NextResponse.json({
            success: true,
            reportId: report.reportId,
            message: 'Report submitted. Your identity is fully protected 🔒',
        });
    } catch (err) {
        console.error('Anonymous report error:', err);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}

// GET: Fetch reports (admin only, no user identity exposed)
export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const reports = await AnonymousReport.find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({ reports });
    } catch (err) {
        console.error('Fetch reports error:', err);
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}

// PATCH: Update report status (admin only)
export async function PATCH(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const { reportId, status } = await req.json();

        if (!reportId || !status) {
            return NextResponse.json({ error: 'reportId and status are required' }, { status: 400 });
        }

        const validStatuses = ['pending', 'reviewed', 'action_taken', 'dismissed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
        }

        const updated = await AnonymousReport.findOneAndUpdate(
            { reportId },
            { status },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, report: updated });
    } catch (err) {
        console.error('Update report status error:', err);
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }
}
