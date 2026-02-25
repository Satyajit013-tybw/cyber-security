'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, XCircle, ArrowUpCircle, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert { _id: string; title: string; description: string; severity: string; status: string; suggestedActions: string[]; createdAt: string; }

export default function AlertsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filter, setFilter] = useState({ severity: '', status: '' });
    const [fetching, setFetching] = useState(true);

    const demoAlerts: Alert[] = [
        { _id: '1', title: 'CRITICAL – Phishing URL Detected', description: 'Detected phishing pattern matching known PayPal impersonation campaign', severity: 'critical', status: 'open', suggestedActions: ['Block content immediately', 'Escalate to admin', 'Lock user account'], createdAt: new Date(Date.now() - 1800000).toISOString() },
        { _id: '2', title: 'HIGH – Violent Threat in Submission', description: 'Text contains explicit violent threat keywords with 92% confidence', severity: 'high', status: 'open', suggestedActions: ['Review manually', 'Block content', 'Escalate to admin'], createdAt: new Date(Date.now() - 3600000).toISOString() },
        { _id: '3', title: 'HIGH – Hate Speech Detected', description: 'Multiple hate speech keywords detected targeting religious group', severity: 'high', status: 'escalated', suggestedActions: ['Block content', 'Escalate to admin'], createdAt: new Date(Date.now() - 7200000).toISOString() },
        { _id: '4', title: 'MEDIUM – Suspicious URL Pattern', description: 'URL uses IP address as hostname with suspicious login keywords', severity: 'medium', status: 'dismissed', suggestedActions: ['Review manually', 'Flag for review'], createdAt: new Date(Date.now() - 10800000).toISOString() },
        { _id: '5', title: 'LOW – Mild Toxicity Detected', description: 'Profanity detected in user submission (low severity)', severity: 'low', status: 'resolved', suggestedActions: ['Review manually'], createdAt: new Date(Date.now() - 86400000).toISOString() },
    ];

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const fetchAlerts = useCallback(async () => {
        setFetching(true);
        try {
            const params = new URLSearchParams();
            if (filter.severity) params.set('severity', filter.severity);
            if (filter.status) params.set('status', filter.status);
            const res = await fetch(`/api/alerts?${params}`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts.length > 0 ? data.alerts : demoAlerts);
            } else { setAlerts(demoAlerts); }
        } catch { setAlerts(demoAlerts); }
        setFetching(false);
    }, [filter]);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    const updateAlert = async (alertId: string, status: string) => {
        try {
            await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId, status }) });
            setAlerts(a => a.map(alert => alert._id === alertId ? { ...alert, status } : alert));
        } catch { /* ignore */ }
    };

    const displayAlerts = alerts.filter(a => {
        if (filter.severity && a.severity !== filter.severity) return false;
        if (filter.status && a.status !== filter.status) return false;
        return true;
    });

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>🚨 Alert Management</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Review, escalate, and resolve security alerts</p>
                    </div>
                    <button className="btn-ghost" onClick={fetchAlerts} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Filter size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
                    {['', 'critical', 'high', 'medium', 'low'].map(s => (
                        <button key={s} onClick={() => setFilter(f => ({ ...f, severity: s }))}
                            style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '500', transition: 'all 0.2s', textTransform: 'capitalize', background: filter.severity === s ? 'rgba(59,130,246,0.15)' : 'transparent', color: filter.severity === s ? 'var(--accent-blue)' : 'var(--text-muted)', borderColor: filter.severity === s ? 'rgba(59,130,246,0.3)' : 'var(--border)' }}>
                            {s || 'All Severity'}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
                    {['', 'open', 'escalated', 'dismissed', 'resolved'].map(s => (
                        <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
                            style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: '500', transition: 'all 0.2s', textTransform: 'capitalize', background: filter.status === s ? 'rgba(59,130,246,0.15)' : 'transparent', color: filter.status === s ? 'var(--accent-blue)' : 'var(--text-muted)', borderColor: filter.status === s ? 'rgba(59,130,246,0.3)' : 'var(--border)' }}>
                            {s || 'All Status'}
                        </button>
                    ))}
                </div>

                {/* Alerts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {fetching ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading alerts...</div>
                    ) : displayAlerts.map((alert, i) => (
                        <motion.div key={alert._id} className="glass-card" style={{ padding: '20px' }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <Bell size={14} color={alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f59e0b' : '#3b82f6'} />
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{alert.title}</span>
                                        <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                                        <span className={`badge badge-${alert.status}`}>{alert.status}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.6 }}>{alert.description}</p>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {alert.suggestedActions.map(a => (
                                            <span key={a} style={{ padding: '2px 8px', background: 'rgba(59,130,246,0.08)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', border: '1px solid rgba(59,130,246,0.1)' }}>→ {a}</span>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</div>
                                </div>
                                {alert.status === 'open' && (user.role === 'admin' || user.role === 'moderator') && (
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => updateAlert(alert._id, 'escalated')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>
                                            <ArrowUpCircle size={13} /> Escalate
                                        </button>
                                        <button onClick={() => updateAlert(alert._id, 'resolved')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', color: '#10b981', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>
                                            <CheckCircle size={13} /> Resolve
                                        </button>
                                        <button onClick={() => updateAlert(alert._id, 'dismissed')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: '8px', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}>
                                            <XCircle size={13} /> Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
