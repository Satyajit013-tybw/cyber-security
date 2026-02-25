'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
    AlertTriangle, Activity, CheckCircle, Shield, Bell, Clock, ClipboardList,
    ChevronRight, X, ArrowUpRight, ArrowDownRight, Ban, Eye, Terminal, Zap, User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
const SEV_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };

type ModSection = 'dashboard' | 'triage' | 'timeline' | 'activity';

const REASON_TAGS = ['Confirmed Threat', 'False Positive', 'Needs Investigation', 'Duplicate', 'Low Priority', 'Policy Violation', 'Spam/Noise'];

async function apiFetch(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export default function ModeratorDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [section, setSection] = useState<ModSection>('dashboard');

    // Data
    const [stats, setStats] = useState<any>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
    const [triageReason, setTriageReason] = useState<string>('');
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
        if (!loading && user && user.role !== 'moderator' && user.role !== 'admin') router.push('/');
    }, [user, loading, router]);

    // Fetch data per section
    useEffect(() => {
        if (!user) return;
        setDataLoading(true);
        const load = async () => {
            try {
                switch (section) {
                    case 'dashboard':
                        setStats(await apiFetch('/api/dashboard/stats'));
                        break;
                    case 'triage':
                        const ad = await apiFetch('/api/alerts?status=open');
                        setAlerts(ad.alerts || []);
                        break;
                    case 'activity':
                        setActivityData(await apiFetch('/api/dashboard/user-analytics'));
                        break;
                }
            } catch (err) { console.error('Load error:', err); }
            setDataLoading(false);
        };
        load();
    }, [section, user]);

    // Load timeline for selected alert
    useEffect(() => {
        if (!selectedAlert) { setTimeline(null); return; }
        const loadTimeline = async () => {
            try {
                const data = await apiFetch(`/api/alerts/${selectedAlert}/timeline`);
                setTimeline(data);
            } catch { setTimeline(null); }
        };
        loadTimeline();
    }, [selectedAlert]);

    // Triage action
    const handleTriage = async (alertId: string, action: 'accept' | 'escalate' | 'dismiss') => {
        if (!triageReason) return;
        try {
            await fetch('/api/alerts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, action, reasonTag: triageReason }),
            });
            setAlerts(prev => prev.filter(a => a._id !== alertId));
            setTriageReason('');
        } catch (err) { console.error('Triage error:', err); }
    };

    if (loading || !user) return null;

    const NAV: { key: ModSection; label: string; icon: React.ElementType }[] = [
        { key: 'dashboard', label: 'Overview', icon: Activity },
        { key: 'triage', label: 'Threat Triage', icon: ClipboardList },
        { key: 'timeline', label: 'Incident Timeline', icon: Clock },
        { key: 'activity', label: 'My Activity', icon: Eye },
    ];

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar activeSection={section} onNav={setSection as any} navItemsOverride={NAV as any} />
            <main className="main-content" style={{ flex: 1 }}>
                <AnimatePresence mode="wait">

                    {/* ═══════════════════════════════════════════════════════
                        1. DASHBOARD OVERVIEW
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'dashboard' && (
                        <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Moderator Workspace</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Welcome back, <span style={{ color: 'var(--accent-cyan)' }}>{user.name}</span></p>

                            {dataLoading || !stats ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="glass-card" style={{ padding: '24px', height: '80px', background: 'rgba(255,255,255,0.02)' }} />)}
                                </div>
                            ) : (<>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
                                    <div className="glass-card" style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Open Alerts</div>
                                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#ef4444' }}>{stats.stats?.openAlerts || 0}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Awaiting your review</div>
                                    </div>
                                    <div className="glass-card" style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Critical Threats</div>
                                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#f59e0b' }}>{stats.stats?.criticalThreats || 0}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Last 30 days</div>
                                    </div>
                                    <div className="glass-card" style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Resolved Today</div>
                                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>{stats.stats?.resolvedToday || 0}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>By all moderators</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>Threat Types</h3>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie data={stats.threatTypeBreakdown || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="_id" paddingAngle={2}>
                                                    {(stats.threatTypeBreakdown || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Threat Volume (30 days)</h3>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <AreaChart data={stats.riskTrend || []}>
                                                <defs><linearGradient id="gMod" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#gMod)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>)}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        2. THREAT TRIAGE WORKSPACE
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'triage' && (
                        <motion.div key="triage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Threat Triage Workspace</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Review flagged content. Every decision requires a reason tag for accountability.</p>

                            {dataLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="glass-card" style={{ padding: '24px', height: '100px', background: 'rgba(255,255,255,0.02)' }} />)}
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Queue Clear</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No open alerts awaiting review.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {alerts.map((a: any) => (
                                        <div key={a._id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${SEV_COLOR[a.severity]}` }}>
                                            {/* Alert header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', background: `${SEV_COLOR[a.severity]}20`, color: SEV_COLOR[a.severity], textTransform: 'uppercase' }}>{a.severity}</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                                                    </div>
                                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{a.title}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.description}</div>
                                                </div>
                                                <button onClick={() => { setSelectedAlert(a._id); setSection('timeline'); }}
                                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <Clock size={14} /> View Timeline
                                                </button>
                                            </div>

                                            {/* XAI Explainability Card */}
                                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <Zap size={14} color="#60a5fa" />
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa' }}>AI Explanation — Why this was flagged</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                                                    {a.description || 'AI analysis detected suspicious signals in this content based on pattern matching and behavioral analysis.'}
                                                </div>
                                                {a.suggestedActions && (
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                        {a.suggestedActions.map((sa: string, i: number) => (
                                                            <span key={i} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', borderRadius: '4px', border: '1px solid rgba(139,92,246,0.2)' }}>{sa}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Triage actions */}
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <select value={triageReason} onChange={e => setTriageReason(e.target.value)}
                                                    className="input" style={{ minWidth: '200px', fontSize: '12px' }}>
                                                    <option value="">Select reason tag...</option>
                                                    {REASON_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <button onClick={() => handleTriage(a._id, 'accept')} disabled={!triageReason}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: triageReason ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '8px', cursor: triageReason ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700', opacity: triageReason ? 1 : 0.4 }}>
                                                    <CheckCircle size={14} /> Accept
                                                </button>
                                                <button onClick={() => handleTriage(a._id, 'escalate')} disabled={!triageReason}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: triageReason ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: '8px', cursor: triageReason ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700', opacity: triageReason ? 1 : 0.4 }}>
                                                    <ArrowUpRight size={14} /> Escalate
                                                </button>
                                                <button onClick={() => handleTriage(a._id, 'dismiss')} disabled={!triageReason}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: triageReason ? 'rgba(100,116,139,0.15)' : 'rgba(100,116,139,0.05)', border: '1px solid rgba(100,116,139,0.3)', color: '#94a3b8', borderRadius: '8px', cursor: triageReason ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700', opacity: triageReason ? 1 : 0.4 }}>
                                                    <Ban size={14} /> Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        3. INCIDENT TIMELINE VIEW
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'timeline' && (
                        <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Incident Timeline</h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Full event chain for the selected alert.</p>
                                </div>
                                <button onClick={() => setSection('triage')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>← Back to Triage</button>
                            </div>

                            {!selectedAlert ? (
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <Clock size={48} color="#64748b" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>No Alert Selected</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Select an alert from the Triage workspace to view its timeline.</div>
                                </div>
                            ) : !timeline ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="glass-card" style={{ padding: '24px', height: '60px', background: 'rgba(255,255,255,0.02)' }} />)}
                                </div>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '40px' }}>
                                    {/* Vertical line */}
                                    <div style={{ position: 'absolute', left: '15px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #3b82f6, #10b981)', opacity: 0.3 }} />

                                    {(timeline.timeline || []).map((evt: any, i: number) => {
                                        const iconMap: Record<string, React.ElementType> = { shield: Shield, bell: Bell, terminal: Terminal, user: User, activity: Activity, check: CheckCircle };
                                        const Icon = iconMap[evt.icon] || Activity;
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                style={{ position: 'relative', marginBottom: '24px' }}>
                                                {/* Dot on timeline */}
                                                <div style={{ position: 'absolute', left: '-33px', top: '8px', width: '18px', height: '18px', borderRadius: '50%', background: evt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${evt.color}40` }}>
                                                    <Icon size={10} color="white" />
                                                </div>

                                                <div className="glass-card" style={{ padding: '20px', borderLeft: `3px solid ${evt.color}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{evt.label}</div>
                                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{evt.detail}</div>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '16px' }}>
                                                            {new Date(evt.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        4. PERSONAL ACTIVITY LOG
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'activity' && (
                        <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>My Activity Log</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Your personal action history — scans run, alerts reviewed, decisions made.</p>

                            {dataLoading || !activityData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="glass-card" style={{ padding: '24px', height: '60px', background: 'rgba(255,255,255,0.02)' }} />)}
                                </div>
                            ) : (
                                <div className="glass-card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>Recent Actions</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 15 entries</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {(activityData.recentLogs || []).map((log: any, i: number) => (
                                            <div key={log._id || i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Activity size={16} color="#3b82f6" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{log.action.replace(/\./g, ' → ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {log.actorEmail} {log.target ? `• Target: ${log.target}` : ''} {log.ipAddress ? `• IP: ${log.ipAddress}` : ''}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                        {(activityData.recentLogs || []).length === 0 && (
                                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No activity logged yet.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
