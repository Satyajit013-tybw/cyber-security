import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth-helpers';
import { verifyToken } from '@/lib/jwt';
import { addSelfHealingAction, getSelfHealingLog } from '@/lib/healing-log';

// ─── Self-Healing Security System API ─────────────────────────────
// GET  → Retrieve healing log + system status
// POST → Trigger manual healing action or simulated auto-response

const blockedIPs = new Set<string>();
const disabledAccounts = new Set<string>();
const firewallRules: { id: string; rule: string; created: string }[] = [];

// Simulate some existing blocked IPs for demo
['45.33.32.156', '185.220.101.34', '91.240.118.172', '198.51.100.44'].forEach(ip => blockedIPs.add(ip));

export async function GET(req: NextRequest) {
    try {
        const token = getTokenFromRequest(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        verifyToken(token);

        return NextResponse.json({
            success: true,
            status: {
                totalBlockedIPs: blockedIPs.size,
                blockedIPs: Array.from(blockedIPs).slice(0, 20),
                disabledAccounts: disabledAccounts.size,
                activeFirewallRules: firewallRules.length,
                systemHealth: 'ACTIVE',
                lastAction: getSelfHealingLog()[0] || null,
            },
            recentActions: getSelfHealingLog().slice(0, 20),
        });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = getTokenFromRequest(req);
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const user = verifyToken(token);

        const { action, target, severity, auto } = await req.json();

        const results: string[] = [];

        // Auto-healing pipeline: runs all steps for a detected threat
        if (auto && target) {
            const ip = target.ip || target;
            const sev = severity || 'HIGH';

            // Step 1: Block IP
            blockedIPs.add(ip);
            addSelfHealingAction('IP Blocked', ip, sev, '✅ Added to real-time blocklist');
            results.push(`IP ${ip} blocked`);

            // Step 2: Disable compromised accounts (if applicable)
            if (target.email) {
                disabledAccounts.add(target.email);
                addSelfHealingAction('Account Disabled', target.email, sev, '✅ Account suspended pending review');
                results.push(`Account ${target.email} disabled`);
            }

            // Step 3: Create firewall rule
            const ruleId = `FW-${Date.now().toString(36).toUpperCase()}`;
            firewallRules.unshift({
                id: ruleId,
                rule: `DENY ALL from ${ip} to ANY (auto-generated, severity: ${sev})`,
                created: new Date().toISOString(),
            });
            if (firewallRules.length > 50) firewallRules.pop();
            addSelfHealingAction('Firewall Rule Created', ruleId, sev, `✅ Rule deployed: DENY ALL from ${ip}`);
            results.push(`Firewall rule ${ruleId} deployed`);

            // Step 4: Trigger data backup snapshot
            addSelfHealingAction('Backup Triggered', 'critical-data-snapshot', sev, '✅ Incremental backup initiated');
            results.push('Data backup snapshot triggered');

            // Step 5: Alert dispatch
            addSelfHealingAction('Alert Dispatched', `${(user as any).email || 'security-team'}`, sev, '✅ Security team notified via email + Slack');
            results.push('Security team alerted');

            return NextResponse.json({
                success: true,
                message: `Self-healing pipeline executed: ${results.length} actions completed`,
                actions: results,
                summary: {
                    ipBlocked: ip,
                    firewallRule: ruleId,
                    totalBlockedIPs: blockedIPs.size,
                    severity: sev,
                },
            });
        }

        // Manual single action
        switch (action) {
            case 'block_ip':
                blockedIPs.add(target);
                addSelfHealingAction('IP Blocked (Manual)', target, severity || 'MEDIUM', '✅ Manually blocked by analyst');
                break;
            case 'unblock_ip':
                blockedIPs.delete(target);
                addSelfHealingAction('IP Unblocked', target, 'INFO', '✅ Removed from blocklist');
                break;
            case 'disable_account':
                disabledAccounts.add(target);
                addSelfHealingAction('Account Disabled (Manual)', target, severity || 'HIGH', '✅ Account suspended');
                break;
            case 'enable_account':
                disabledAccounts.delete(target);
                addSelfHealingAction('Account Enabled', target, 'INFO', '✅ Account re-enabled');
                break;
            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Action "${action}" completed for ${target}`,
            status: {
                totalBlockedIPs: blockedIPs.size,
                disabledAccounts: disabledAccounts.size,
                activeFirewallRules: firewallRules.length,
            },
        });
    } catch (error: any) {
        console.error('Self-healing error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
