import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import connectDB from '@/lib/db';
import { Alert } from '@/models/Alert';
import { AuditLog } from '@/models/AuditLog';
import { Threat } from '@/models/Threat';
import { Rule } from '@/models/Rule';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        await connectDB();
        const alert = await Alert.findById(resolvedParams.id).lean();
        if (!alert) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });

        // Get the associated threat
        const threat = await Threat.findById((alert as any).threatId).lean();

        // Find related audit logs
        const auditLogs = await AuditLog.find({
            $or: [
                { target: (alert as any).threatId },
                { target: resolvedParams.id },
                { action: { $regex: /alert|threat/i } },
            ]
        }).sort({ createdAt: 1 }).limit(10).lean();

        // Find the rule that may have triggered this
        const matchedRules = threat ? await Rule.find({
            'conditions.value': { $in: (threat as any).categories || [] }
        }).lean() : [];

        // Build timeline
        const timeline: any[] = [];

        // 1. Threat detected
        if (threat) {
            timeline.push({
                event: 'threat_detected',
                label: `${(threat as any).type.toUpperCase()} threat detected`,
                detail: `Risk score: ${(threat as any).riskScore} | Severity: ${(threat as any).severity} | Confidence: ${(threat as any).confidence}%`,
                timestamp: (threat as any).createdAt,
                icon: 'shield',
                color: '#ef4444',
            });
        }

        // 2. Rule matched
        if (matchedRules.length > 0) {
            matchedRules.forEach((rule: any) => {
                timeline.push({
                    event: 'rule_matched',
                    label: `Rule triggered: "${rule.name}"`,
                    detail: rule.description || `Condition matched on ${rule.conditions[0]?.field}`,
                    timestamp: (threat as any)?.createdAt || (alert as any).createdAt,
                    icon: 'terminal',
                    color: '#f59e0b',
                });
            });
        }

        // 3. Alert created
        timeline.push({
            event: 'alert_created',
            label: (alert as any).title,
            detail: (alert as any).description,
            timestamp: (alert as any).createdAt,
            icon: 'bell',
            color: '#3b82f6',
        });

        // 4. Assignment
        if ((alert as any).assignedTo) {
            timeline.push({
                event: 'assigned',
                label: `Assigned to ${(alert as any).assignedTo}`,
                detail: 'Alert was routed to a reviewer',
                timestamp: (alert as any).createdAt,
                icon: 'user',
                color: '#8b5cf6',
            });
        }

        // 5. Audit log events
        auditLogs.forEach((log: any) => {
            timeline.push({
                event: 'audit_action',
                label: `Action: ${log.action}`,
                detail: `By ${log.actorEmail} from ${log.ipAddress || 'unknown IP'}`,
                timestamp: log.createdAt,
                icon: 'activity',
                color: '#06b6d4',
            });
        });

        // 6. Resolution
        if ((alert as any).status !== 'open') {
            timeline.push({
                event: 'resolved',
                label: `Alert ${(alert as any).status}`,
                detail: (alert as any).reasonTag ? `Reason: ${(alert as any).reasonTag}` : `Status changed to ${(alert as any).status}`,
                timestamp: (alert as any).resolvedAt || (alert as any).updatedAt,
                icon: 'check',
                color: '#10b981',
            });
        }

        // Sort by timestamp
        timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return NextResponse.json({ alert, threat, timeline, matchedRules });
    } catch (err) {
        console.error('Timeline error:', err);
        return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }
}
