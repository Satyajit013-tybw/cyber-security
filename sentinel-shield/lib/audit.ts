import connectDB from './db';
import { AuditLog } from '@/models/AuditLog';

export async function logEvent(
    actor: string,
    actorEmail: string,
    action: string,
    orgId: string,
    target?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string
) {
    try {
        await connectDB();
        await AuditLog.create({ actor, actorEmail, action, target, metadata, orgId, ipAddress });
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
