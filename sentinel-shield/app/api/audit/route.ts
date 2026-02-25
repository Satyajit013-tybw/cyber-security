import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

const MOCK_LOGS = [
    { _id: 'l1', actor: 'admin@sentinelshield.ai', action: 'LOGIN_SUCCESS', target: null, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { _id: 'l2', actor: 'admin@sentinelshield.ai', action: 'THREAT_ANALYZED', target: 'text-scan-001', createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { _id: 'l3', actor: 'mod@sentinelshield.ai', action: 'ALERT_RESOLVED', target: 'alert-a3', createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
    { _id: 'l4', actor: 'admin@sentinelshield.ai', action: 'RULE_CREATED', target: 'rule-phishing-001', createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
    { _id: 'l5', actor: 'user@sentinelshield.ai', action: 'LOGIN_SUCCESS', target: null, createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString() },
    { _id: 'l6', actor: 'admin@sentinelshield.ai', action: 'USER_APPROVE', target: 'user-001', createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
    { _id: 'l7', actor: 'mod@sentinelshield.ai', action: 'THREAT_ANALYZED', target: 'url-scan-008', createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
    { _id: 'l8', actor: 'admin@sentinelshield.ai', action: 'ROLE_CHANGED', target: 'mod-001', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    { _id: 'l9', actor: 'user@sentinelshield.ai', action: 'LOGIN_FAILED', target: null, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
    { _id: 'l10', actor: 'admin@sentinelshield.ai', action: 'USER_SIGNUP', target: 'pending@example.com', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
];

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, ['admin']);
    if (auth.error) return auth.error;
    return NextResponse.json({ logs: MOCK_LOGS });
}
