'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Download, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Log { _id: string; actor: string; actorEmail: string; action: string; target?: string; orgId: string; createdAt: string; }

const DEMO_LOGS: Log[] = [
    { _id: '1', actor: 'admin', actorEmail: 'admin@demo.com', action: 'THREAT_ANALYZED', target: 'text', orgId: 'demo', createdAt: new Date(Date.now() - 600000).toISOString() },
    { _id: '2', actor: 'admin', actorEmail: 'admin@demo.com', action: 'ALERT_RESOLVED', target: 'alert_123', orgId: 'demo', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { _id: '3', actor: 'mod1', actorEmail: 'mod@demo.com', action: 'ALERT_ESCALATED', target: 'alert_456', orgId: 'demo', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: '4', actor: 'admin', actorEmail: 'admin@demo.com', action: 'RULE_CREATED', target: 'rule_789', orgId: 'demo', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { _id: '5', actor: 'viewer1', actorEmail: 'viewer@demo.com', action: 'LOGIN_SUCCESS', orgId: 'demo', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { _id: '6', actor: 'admin', actorEmail: 'admin@demo.com', action: 'USER_APPROVE', target: 'user_abc', orgId: 'demo', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { _id: '7', actor: 'admin', actorEmail: 'admin@demo.com', action: 'MFA_ENABLED', orgId: 'demo', createdAt: new Date(Date.now() - 172800000).toISOString() },
];

const actionColors: Record<string, string> = {
    THREAT_ANALYZED: '#3b82f6',
    ALERT_RESOLVED: '#10b981',
    ALERT_ESCALATED: '#f59e0b',
    ALERT_DISMISSED: '#64748b',
    RULE_CREATED: '#8b5cf6',
    RULE_UPDATED: '#8b5cf6',
    RULE_DELETED: '#ef4444',
    LOGIN_SUCCESS: '#10b981',
    LOGIN_FAILED: '#ef4444',
    USER_APPROVE: '#06b6d4',
    USER_SETROLELEVEL: '#06b6d4',
    MFA_ENABLED: '#10b981',
    EMAIL_VERIFIED: '#10b981',
};

export default function AuditPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<Log[]>(DEMO_LOGS);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchLogs = useCallback(async () => {
        try {
            const params = actionFilter ? `?action=${actionFilter}` : '';
            const res = await fetch(`/api/audit${params}`);
            if (res.ok) { const data = await res.json(); if (data.logs.length > 0) setLogs(data.logs); }
        } catch { /* use demo */ }
    }, [actionFilter]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const exportCSV = () => {
        const header = 'Timestamp,Actor,Email,Action,Target\n';
        const rows = logs.map(l => `${format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm:ss')},${l.actor},${l.actorEmail},${l.action},${l.target || ''}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `sentinel-audit-${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
    };

    const uniqueActions = [...new Set(DEMO_LOGS.map(l => l.action))];

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>📋 Audit Logs & Compliance</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Complete event trail for all system activities</p>
                    </div>
                    <button className="btn-primary" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={14} /> Export CSV
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Filter size={14} color="var(--text-muted)" />
                    <button onClick={() => setActionFilter('')}
                        style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', background: !actionFilter ? 'rgba(59,130,246,0.15)' : 'transparent', color: !actionFilter ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                        All Events
                    </button>
                    {uniqueActions.map(action => (
                        <button key={action} onClick={() => setActionFilter(action)}
                            style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', transition: 'all 0.2s', background: actionFilter === action ? 'rgba(59,130,246,0.15)' : 'transparent', color: actionFilter === action ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                            {action.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Log Table */}
                <motion.div className="glass-card" style={{ overflow: 'hidden' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Time Ago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.filter(l => !actionFilter || l.action === actionFilter).map((log) => (
                                <tr key={log._id}>
                                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {format(new Date(log.createdAt), 'MMM dd, HH:mm:ss')}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{log.actor}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.actorEmail}</div>
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace', background: `${actionColors[log.action] || '#64748b'}15`, color: actionColors[log.action] || '#64748b', border: `1px solid ${actionColors[log.action] || '#64748b'}30` }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                        {log.target || '—'}
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </main>
        </div>
    );
}
