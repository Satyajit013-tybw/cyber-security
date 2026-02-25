'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
    Shield, AlertTriangle, Activity, Bell, Lock, CheckCircle, Search, Trash2,
    ChevronUp, ChevronDown, ToggleLeft, ToggleRight, Terminal, Smartphone, Users,
    Cpu, Server, Zap, Globe, BarChart3, Eye, TrendingUp, Clock, Database, Wifi, WifiOff,
    ClipboardList, ArrowUpRight, Ban, User as UserIcon, Download, Flag, ArrowUp, ArrowDown,
    QrCode, FileText, ShieldCheck, AlertCircle, Upload
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ─── TYPES ─────────────────────────────────────────────────────────────
type AdminSection = 'command_center' | 'users' | 'threats' | 'alerts' | 'rules' | 'ai_performance' | 'user_analytics' | 'composite' | 'system_health' | 'privacy' | 'profile' | 'triage' | 'timeline';

const SEV_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981', safe: '#10b981' };
const REASON_TAGS = ['Confirmed Threat', 'False Positive', 'Needs Investigation', 'Duplicate', 'Low Priority', 'Policy Violation', 'Spam/Noise'];
const PIE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// ─── Fetch helper ──────────────────────────────────────────────────────
async function apiFetch(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

// ─── Loading Skeleton ──────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
                <div key={i} className="glass-card" style={{ padding: '24px', height: '80px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ width: '60%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
                    <div style={{ width: '40%', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />
                </div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
    const { user, loading: authLoading, login } = useAuth();
    const router = useRouter();
    const [section, setSection] = useState<AdminSection>('command_center');

    // ── Data states ─────────────────────────────────────────
    const [dashData, setDashData] = useState<any>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [threats, setThreats] = useState<any[]>([]);
    const [healthData, setHealthData] = useState<any>(null);
    const [aiData, setAiData] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [compositeData, setCompositeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ── Anonymous Reports state ─────────────────────────────
    const [anonReports, setAnonReports] = useState<any[]>([]);
    const [anonStatusFilter, setAnonStatusFilter] = useState('');
    const [anonUpdating, setAnonUpdating] = useState<string | null>(null);

    // ── User Activity states ─────────────────────────────────
    const [activityData, setActivityData] = useState<any>(null);
    const [activitySearch, setActivitySearch] = useState('');
    const [activityFilter, setActivityFilter] = useState('');
    const [activitySort, setActivitySort] = useState('totalLogins');
    const [activitySortOrder, setActivitySortOrder] = useState<'asc' | 'desc'>('desc');

    // ── Sidebar expanded threat ──────────────────────────────
    const [expandedThreat, setExpandedThreat] = useState<string | null>(null);
    const [triageAlerts, setTriageAlerts] = useState<any[]>([]);
    const [triageReason, setTriageReason] = useState<string>('');
    const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
    const [timelineData, setTimelineData] = useState<any>(null);

    // ── Profile State ───────────────────────────────────────────
    const [newName, setNewName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

    const handleProfileUpdate = async (type: 'name' | 'password') => {
        setProfileMessage({ text: '', type: '' });
        try {
            const body: any = {};
            if (type === 'name') {
                if (!newName) return;
                body.name = newName;
            } else if (type === 'password') {
                if (!currentPassword || !newPassword) return;
                body.currentPassword = currentPassword;
                body.newPassword = newPassword;
            }

            const res = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                setProfileMessage({ text: data.error || 'Failed to update profile', type: 'error' });
                return;
            }

            setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
            if (type === 'password') {
                setCurrentPassword('');
                setNewPassword('');
            }
            if (data.user) {
                login(data.user);
                if (type === 'name') setNewName('');
            }
        } catch (error) {
            setProfileMessage({ text: 'Network error occurred.', type: 'error' });
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            try {
                const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ avatar: base64String }),
                });
                const data = await res.json();
                if (res.ok && data.user) {
                    setProfileMessage({ text: 'Avatar updated successfully!', type: 'success' });
                    login(data.user);
                } else {
                    setProfileMessage({ text: data.error || 'Failed to update avatar', type: 'error' });
                }
            } catch (error) {
                setProfileMessage({ text: 'Network error updating avatar.', type: 'error' });
            }
        };
        reader.readAsDataURL(file);
    };

    // ── Fetch data on section change ────────────────────────
    useEffect(() => {
        if (authLoading || !user) return;
        setLoading(true);
        const load = async () => {
            try {
                switch (section) {
                    case 'command_center':
                        setDashData(await apiFetch('/api/dashboard/stats'));
                        break;
                    case 'rules':
                        const rData = await apiFetch('/api/rules');
                        setRules(rData.rules || []);
                        break;
                    case 'users':
                        const actParams = new URLSearchParams();
                        if (activitySearch) actParams.set('search', activitySearch);
                        if (activityFilter) actParams.set('filter', activityFilter);
                        actParams.set('sort', activitySort);
                        actParams.set('order', activitySortOrder);
                        setActivityData(await apiFetch(`/api/admin/user-activity?${actParams.toString()}`));
                        break;
                    case 'threats':
                        setDashData(await apiFetch('/api/dashboard/stats'));
                        break;
                    case 'system_health':
                        setHealthData(await apiFetch('/api/dashboard/system-health'));
                        break;
                    case 'ai_performance':
                        setAiData(await apiFetch('/api/dashboard/ai-performance'));
                        break;
                    case 'user_analytics':
                        setAnalyticsData(await apiFetch('/api/dashboard/user-analytics'));
                        break;
                    case 'composite':
                        setCompositeData(await apiFetch('/api/dashboard/composite-profiles'));
                        break;
                    case 'triage':
                        const aData = await apiFetch('/api/alerts?status=open');
                        setTriageAlerts(aData.alerts || []);
                        break;
                    case 'privacy':
                        const rData2 = await apiFetch('/api/reports/anonymous');
                        setAnonReports(rData2.reports || []);
                        break;
                }
            } catch (err) { console.error('Load error:', err); }
            setLoading(false);
        };
        load();

        // Auto-refresh for User Control every 15s to show live online status
        if (section === 'users') {
            const interval = setInterval(async () => {
                try {
                    const p = new URLSearchParams();
                    if (activitySearch) p.set('search', activitySearch);
                    if (activityFilter) p.set('filter', activityFilter);
                    p.set('sort', activitySort);
                    p.set('order', activitySortOrder);
                    setActivityData(await apiFetch(`/api/admin/user-activity?${p.toString()}`));
                } catch { }
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [section, user, authLoading]);

    useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);
    if (authLoading || !user || user.role === 'viewer') return null;

    // Triage handler
    const handleTriage = async (alertId: string, action: 'accept' | 'escalate' | 'dismiss') => {
        if (!triageReason) return;
        try {
            await fetch('/api/alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId, action, reasonTag: triageReason }) });
            setTriageAlerts(prev => prev.filter(a => a._id !== alertId));
            setTriageReason('');
        } catch (err) { console.error('Triage error:', err); }
    };

    // Timeline loader
    const loadTimeline = async (alertId: string) => {
        setSelectedAlert(alertId);
        setSection('timeline');
        try { setTimelineData(await apiFetch(`/api/alerts/${alertId}/timeline`)); } catch { setTimelineData(null); }
    };

    const NAV: { key: AdminSection; label: string; icon: React.ElementType }[] = [
        { key: 'command_center', label: 'Command Center', icon: Activity },
        { key: 'users', label: 'User Control', icon: Users },
        { key: 'rules', label: 'Rule Engine', icon: Terminal },
        { key: 'ai_performance', label: 'AI Performance', icon: Cpu },
        { key: 'system_health', label: 'System Health', icon: Server },
        { key: 'privacy', label: 'Privacy & Reports', icon: ShieldCheck },
    ];

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar activeSection={section} onNav={setSection as any} navItemsOverride={NAV as any} />
            <main className="main-content" style={{ flex: 1 }}>
                <AnimatePresence mode="wait">

                    {/* ═══════════════════════════════════════════════════════
                        1. THREAT INTELLIGENCE COMMAND CENTER
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'command_center' && (
                        <motion.div key="cc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Threat Intelligence Command Center</h1>

                            {loading || !dashData ? <LoadingSkeleton /> : (<>
                                {/* Stats row */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '24px' }}>
                                    {[
                                        { label: 'Total Threats', value: dashData.stats.totalThreats, color: '#8b5cf6' },
                                        { label: 'Threats Today', value: dashData.stats.threatsToday, color: '#3b82f6' },
                                        { label: 'Critical', value: dashData.stats.criticalThreats, color: '#ef4444' },
                                        { label: 'Open Alerts', value: dashData.stats.openAlerts, color: '#f59e0b' },
                                        { label: 'Resolved Today', value: dashData.stats.resolvedToday, color: '#10b981' },
                                    ].map((s, i) => (
                                        <div key={i} className="glass-card" style={{ padding: '18px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>{s.label}</div>
                                            <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    {/* Threat Volume Trend */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Live Threat Volume (30 days)</h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <AreaChart data={dashData.riskTrend}>
                                                <defs><linearGradient id="gVol" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#gVol)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Attack Type Distribution */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Attack Type Distribution</h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <PieChart>
                                                <Pie data={dashData.threatTypeBreakdown} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={(entry: any) => entry._id}>
                                                    {dashData.threatTypeBreakdown.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Bottom row: Geo heatmap + Recent alerts */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {/* Geographic Origins */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={16} color="#06b6d4" /> Geographic Threat Origins</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(dashData.geoBreakdown || []).map((g: any) => (
                                                <div key={g._id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ width: '32px', fontWeight: '700', color: 'white', fontSize: '13px' }}>{g._id}</span>
                                                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min(100, g.count * 10)}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ef4444)', borderRadius: '4px' }} />
                                                    </div>
                                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '50px', textAlign: 'right' }}>{g.count} hits</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Alerts */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={16} color="#ef4444" /> Live Alert Feed</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
                                            {(dashData.recentAlerts || []).map((a: any) => (
                                                <div key={a._id} style={{ padding: '12px', background: `${SEV_COLOR[a.severity]}08`, borderLeft: `3px solid ${SEV_COLOR[a.severity]}`, borderRadius: '4px' }}>
                                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{a.title || a.message}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{a.severity?.toUpperCase()} • {a.status}</span>
                                                        <span>{new Date(a.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>)}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        2. THREAT LOGS
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'threats' && (
                        <motion.div key="threats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Threat Logs</h1>
                            {loading || !dashData ? <LoadingSkeleton /> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Severity breakdown */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '12px' }}>
                                        {(dashData.severityBreakdown || []).map((s: any) => (
                                            <div key={s._id} className="glass-card" style={{ padding: '16px', borderLeft: `3px solid ${SEV_COLOR[s._id]}` }}>
                                                <div style={{ fontSize: '11px', color: SEV_COLOR[s._id], textTransform: 'uppercase', fontWeight: '800' }}>{s._id}</div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>{s.count}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Recent alerts as threat entries */}
                                    {(dashData.recentAlerts || []).map((t: any) => (
                                        <div key={t._id} className="glass-card" style={{ borderLeft: `4px solid ${SEV_COLOR[t.severity]}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                                            onClick={() => setExpandedThreat(expandedThreat === t._id ? null : t._id)}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{t.title || t.message}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    Type: {t.type} • Score: {t.riskScore} • {new Date(t.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <span style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', background: `${SEV_COLOR[t.severity]}20`, color: SEV_COLOR[t.severity], textTransform: 'uppercase' }}>{t.severity}</span>
                                            <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}>{t.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        3. RULE ENGINE with Effectiveness Scorecard
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'rules' && (
                        <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Rule Engine & Effectiveness Scorecard</h1>
                            {loading ? <LoadingSkeleton /> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {rules.map((r: any) => (
                                        <div key={r._id} className="glass-card" style={{ padding: '24px', opacity: r.isActive ? 1 : 0.5, borderLeft: `3px solid ${r.isActive ? '#3b82f6' : '#64748b'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{r.name}</div>
                                                        <span style={{ fontSize: '10px', background: r.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: r.isActive ? '#10b981' : '#64748b', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                                                            {r.isActive ? 'Active' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{r.description}</div>
                                                </div>
                                                <button onClick={async () => {
                                                    await fetch('/api/rules', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId: r._id, isActive: !r.isActive }) });
                                                    setRules(prev => prev.map(x => x._id === r._id ? { ...x, isActive: !x.isActive } : x));
                                                }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                    {r.isActive ? <ToggleRight size={28} color="#3b82f6" /> : <ToggleLeft size={28} color="#64748b" />}
                                                </button>
                                            </div>

                                            {/* Scorecard metrics */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Total Hits</div>
                                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#3b82f6' }}>{r.triggeredCount}</div>
                                                </div>
                                                <div style={{ background: 'rgba(16,185,129,0.05)', padding: '14px', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '10px', color: '#10b981', textTransform: 'uppercase', fontWeight: '800' }}>Hit Rate</div>
                                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{r.hitRate || 0}%</div>
                                                </div>
                                                <div style={{ background: 'rgba(245,158,11,0.05)', padding: '14px', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: '800' }}>False Positive</div>
                                                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#f59e0b' }}>{r.falsePositiveRate || 0}%</div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Last Triggered</div>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{r.lastTriggered ? new Date(r.lastTriggered).toLocaleDateString() : 'Never'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        4. ALERTS
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'alerts' && (
                        <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Alerts Configuration</h1>
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Global Alert Responses</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><label style={{ fontSize: '12px', fontWeight: '700' }}>Critical Alert Threshold (Score &gt; X triggers notification)</label><span style={{ color: '#ef4444', fontWeight: '800' }}>90/100</span></div>
                                        <input type="range" min="0" max="100" defaultValue="90" style={{ width: '100%', accentColor: '#ef4444' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><div style={{ fontSize: '14px', fontWeight: '700' }}>Send Email Alerts</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Notify SOC team for critical incidents</div></div>
                                        <ToggleRight size={32} color="#10b981" />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div><div style={{ fontSize: '14px', fontWeight: '700' }}>Auto-Ban Users</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Suspend accounts if threshold met</div></div>
                                        <ToggleRight size={32} color="#ef4444" />
                                    </div>
                                    <div><label style={{ fontSize: '12px', fontWeight: '700' }}>Webhook (Slack/PagerDuty)</label>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <input className="input" placeholder="https://api.pagerduty.com/..." style={{ width: '100%' }} />
                                            <button className="btn-primary" style={{ padding: '0 16px', borderRadius: '8px', border: 'none', fontWeight: '800' }}>Test</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        5. COMPLETE USER ACTIVITY LIST
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>👥 Complete User Activity</h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Full user activity overview — login sessions, safety metrics, and admin controls. No private content is exposed.</p>
                                </div>
                                <button
                                    onClick={() => { window.open('/api/admin/user-activity/export' + (activitySearch ? `?search=${activitySearch}` : '') + (activityFilter ? `${activitySearch ? '&' : '?'}filter=${activityFilter}` : ''), '_blank'); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>
                                    <Download size={14} /> Export CSV
                                </button>
                            </div>

                            {loading || !activityData ? <LoadingSkeleton /> : (<>
                                {/* ── SUMMARY STATS ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Total Users', value: activityData.summary?.totalUsers ?? 0, color: '#8b5cf6', icon: Users },
                                        { label: 'Online Now', value: activityData.summary?.onlineNow ?? 0, color: '#10b981', icon: Wifi },
                                        { label: 'Total Threats', value: activityData.summary?.totalThreats ?? 0, color: '#ef4444', icon: AlertTriangle },
                                        { label: 'Avg Safety Score', value: activityData.summary?.avgSafetyScore ?? 0, color: '#f59e0b', icon: ShieldCheck },
                                        { label: 'Suspended', value: activityData.summary?.suspendedCount ?? 0, color: '#64748b', icon: Ban },
                                    ].map((s, i) => (
                                        <div key={i} className="glass-card" style={{ padding: '18px', borderTop: `3px solid ${s.color}` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <s.icon size={14} color={s.color} />
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>{s.label}</span>
                                            </div>
                                            <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── SEARCH & FILTERS ── */}
                                <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            className="input"
                                            placeholder="Search by username or User ID..."
                                            value={activitySearch}
                                            onChange={(e) => setActivitySearch(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); const load = async () => { try { const p = new URLSearchParams(); if (activitySearch) p.set('search', activitySearch); if (activityFilter) p.set('filter', activityFilter); p.set('sort', activitySort); p.set('order', activitySortOrder); setActivityData(await apiFetch(`/api/admin/user-activity?${p.toString()}`)); } catch { } setLoading(false); }; load(); } }}
                                            style={{ width: '100%', paddingLeft: '36px', fontSize: '13px' }}
                                        />
                                    </div>
                                    {[
                                        { key: '', label: 'All Users' },
                                        { key: 'online', label: '🟢 Online Now' },
                                        { key: 'most_threats', label: '🚨 Most Threats' },
                                        { key: 'most_active', label: '⚡ Most Active' },
                                        { key: 'newest', label: '🆕 Newest' },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => {
                                                setActivityFilter(f.key);
                                                setLoading(true);
                                                const load = async () => {
                                                    try {
                                                        const p = new URLSearchParams();
                                                        if (activitySearch) p.set('search', activitySearch);
                                                        if (f.key) p.set('filter', f.key);
                                                        p.set('sort', activitySort); p.set('order', activitySortOrder);
                                                        setActivityData(await apiFetch(`/api/admin/user-activity?${p.toString()}`));
                                                    } catch { } setLoading(false);
                                                }; load();
                                            }}
                                            style={{
                                                padding: '6px 14px', borderRadius: '6px', border: '1px solid',
                                                borderColor: activityFilter === f.key ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)',
                                                background: activityFilter === f.key ? 'rgba(59,130,246,0.15)' : 'transparent',
                                                color: activityFilter === f.key ? '#60a5fa' : 'var(--text-muted)',
                                                fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                                                transition: 'all 0.2s',
                                            }}
                                        >{f.label}</button>
                                    ))}
                                </div>

                                {/* ── DATA TABLE ── */}
                                {(() => {
                                    const COLS: { key: string; label: string; icon: string; width?: string }[] = [
                                        { key: 'userId', label: 'User ID', icon: '👤', width: '140px' },
                                        { key: 'lastLogin', label: 'Last Login', icon: '📅', width: '130px' },
                                        { key: 'lastLogout', label: 'Last Logout', icon: '🕐', width: '130px' },
                                        { key: 'lastSessionDuration', label: 'Session', icon: '⏱️', width: '80px' },
                                        { key: 'totalLogins', label: 'Logins', icon: '🔢', width: '70px' },
                                        { key: 'threatsDetected', label: 'Threats', icon: '🚨', width: '70px' },
                                        { key: 'qrScansCount', label: 'QR Scans', icon: '📷', width: '70px' },
                                        { key: 'reportsFiled', label: 'Reports', icon: '🕵️', width: '70px' },
                                        { key: 'safeModeUsage', label: 'Safe Mode', icon: '🛡️', width: '75px' },
                                        { key: 'reportsDownloaded', label: 'Downloads', icon: '📥', width: '80px' },
                                        { key: 'safetyScore', label: 'Score', icon: '🏅', width: '70px' },
                                        { key: 'isOnline', label: 'Status', icon: '📊', width: '80px' },
                                    ];
                                    const sortedData = [...(activityData.activity || [])];
                                    // Client-side sort
                                    sortedData.sort((a: any, b: any) => {
                                        const av = a[activitySort] ?? '';
                                        const bv = b[activitySort] ?? '';
                                        const dir = activitySortOrder === 'asc' ? 1 : -1;
                                        if (typeof av === 'string') return dir * String(av).localeCompare(String(bv));
                                        if (typeof av === 'boolean') return dir * ((av ? 1 : 0) - (bv ? 1 : 0));
                                        return dir * (Number(av) - Number(bv));
                                    });
                                    const toggleSort = (key: string) => {
                                        if (activitySort === key) setActivitySortOrder(o => o === 'asc' ? 'desc' : 'asc');
                                        else { setActivitySort(key); setActivitySortOrder('desc'); }
                                    };
                                    const fmtDate = (d: string) => {
                                        if (!d) return '—';
                                        const dt = new Date(d);
                                        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                    };
                                    const fmtDur = (s: number) => {
                                        if (!s || s <= 0) return '—';
                                        const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
                                        return h > 0 ? `${h}h ${m}m` : `${m}m`;
                                    };
                                    const handleSuspend = async (userId: string) => {
                                        try {
                                            await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'flag' }) });
                                            setActivityData((prev: any) => ({
                                                ...prev,
                                                activity: prev.activity.map((u: any) => u.userId === userId ? { ...u, isSuspended: !u.isSuspended } : u),
                                            }));
                                        } catch { }
                                    };

                                    return (
                                        <div className="glass-card" style={{ overflow: 'hidden' }}>
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                    <thead>
                                                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                                            {COLS.map(c => (
                                                                <th
                                                                    key={c.key}
                                                                    onClick={() => toggleSort(c.key)}
                                                                    style={{ padding: '12px 10px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontSize: '11px', fontWeight: '800', color: activitySort === c.key ? '#60a5fa' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', width: c.width }}
                                                                >
                                                                    {c.icon} {c.label}
                                                                    {activitySort === c.key && (
                                                                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>{activitySortOrder === 'asc' ? '▲' : '▼'}</span>
                                                                    )}
                                                                </th>
                                                            ))}
                                                            <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sortedData.map((u: any, i: number) => (
                                                            <tr key={u.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: u.isSuspended ? 'rgba(239,68,68,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = u.isSuspended ? 'rgba(239,68,68,0.03)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                                                            >
                                                                {/* User ID */}
                                                                <td style={{ padding: '10px' }}>
                                                                    <div style={{ fontWeight: '700', color: 'white', fontSize: '12px' }}>{u.name || 'Anonymous'}</div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>{u.userId?.slice(0, 12)}…</div>
                                                                </td>
                                                                {/* Last Login */}
                                                                <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '11px' }}>{fmtDate(u.lastLogin)}</td>
                                                                {/* Last Logout */}
                                                                <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '11px' }}>{fmtDate(u.lastLogout)}</td>
                                                                {/* Session Duration */}
                                                                <td style={{ padding: '10px', color: 'white', fontWeight: '600', fontSize: '11px' }}>{fmtDur(u.lastSessionDuration)}</td>
                                                                {/* Total Logins */}
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                    <span style={{ fontWeight: '800', color: '#3b82f6' }}>{u.totalLogins}</span>
                                                                </td>
                                                                {/* Threats */}
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                    <span style={{ fontWeight: '800', color: u.threatsDetected > 5 ? '#ef4444' : u.threatsDetected > 0 ? '#f59e0b' : '#10b981', padding: '2px 8px', borderRadius: '4px', background: u.threatsDetected > 5 ? 'rgba(239,68,68,0.1)' : u.threatsDetected > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)' }}>{u.threatsDetected}</span>
                                                                </td>
                                                                {/* QR Scans */}
                                                                <td style={{ padding: '10px', textAlign: 'center', color: 'white', fontWeight: '600' }}>{u.qrScansCount}</td>
                                                                {/* Reports Filed */}
                                                                <td style={{ padding: '10px', textAlign: 'center', color: 'white', fontWeight: '600' }}>{u.reportsFiled}</td>
                                                                {/* Safe Mode */}
                                                                <td style={{ padding: '10px', textAlign: 'center', color: '#06b6d4', fontWeight: '600' }}>{u.safeModeUsage}</td>
                                                                {/* Reports Downloaded */}
                                                                <td style={{ padding: '10px', textAlign: 'center', color: 'white', fontWeight: '600' }}>{u.reportsDownloaded}</td>
                                                                {/* Safety Score */}
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        fontWeight: '900', fontSize: '13px',
                                                                        color: u.safetyScore >= 800 ? '#10b981' : u.safetyScore >= 500 ? '#f59e0b' : u.safetyScore >= 200 ? '#3b82f6' : '#ef4444',
                                                                    }}>{u.safetyScore}</span>
                                                                </td>
                                                                {/* Status */}
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                        fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
                                                                        background: u.isOnline ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                                                                        color: u.isOnline ? '#10b981' : '#64748b',
                                                                    }}>
                                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.isOnline ? '#10b981' : '#64748b' }} />
                                                                        {u.isOnline ? 'Online' : 'Offline'}
                                                                    </span>
                                                                </td>
                                                                {/* Actions */}
                                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleSuspend(u.userId)}
                                                                        title={u.isSuspended ? 'Unsuspend this user' : 'Suspend / Flag this user'}
                                                                        style={{
                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                            padding: '5px 12px', borderRadius: '6px', border: '1px solid',
                                                                            borderColor: u.isSuspended ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                                                                            background: u.isSuspended ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                                                            color: u.isSuspended ? '#10b981' : '#ef4444',
                                                                            fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                                                                            transition: 'all 0.2s',
                                                                        }}
                                                                    >
                                                                        {u.isSuspended ? <><CheckCircle size={12} /> Restore</> : <><Flag size={12} /> Suspend</>}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {sortedData.length === 0 && (
                                                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                    <Users size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>No users found</div>
                                                    <div style={{ fontSize: '13px' }}>Try adjusting your search or filters.</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>)}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        6. AI MODEL PERFORMANCE PANEL
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'ai_performance' && (
                        <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>🤖 AI Model Performance</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Real-time accuracy metrics — monitor false positives, missed threats, and overall AI reliability.</p>
                            {loading || !aiData ? <LoadingSkeleton /> : (<>

                                {/* ── HEADLINE METRICS ── */}
                                {aiData.performance && (
                                    <>
                                        {/* This Week Summary Banner */}
                                        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06))', border: '1px solid rgba(16,185,129,0.15)' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                <span>This week:</span>
                                                <span style={{ color: aiData.performance.overallAccuracy >= 90 ? '#10b981' : aiData.performance.overallAccuracy >= 80 ? '#f59e0b' : '#ef4444', fontSize: '20px' }}>
                                                    {aiData.performance.overallAccuracy}% accuracy
                                                </span>
                                                <span style={{ color: '#64748b' }}>|</span>
                                                <span style={{ color: '#f59e0b' }}>{aiData.performance.falsePositiveRate}% false positives</span>
                                                <span style={{ color: '#64748b' }}>|</span>
                                                <span style={{ color: '#ef4444' }}>{aiData.performance.falseNegativeRate}% missed threats</span>
                                            </div>
                                        </div>

                                        {/* Main Metrics Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px', marginBottom: '24px' }}>
                                            {/* Overall Accuracy */}
                                            <div className="glass-card" style={{ padding: '20px', borderTop: `3px solid ${aiData.performance.overallAccuracy >= 90 ? '#10b981' : '#f59e0b'}` }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Overall Accuracy</div>
                                                <div style={{ fontSize: '36px', fontWeight: '900', color: aiData.performance.overallAccuracy >= 90 ? '#10b981' : aiData.performance.overallAccuracy >= 80 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                                                    {aiData.performance.overallAccuracy}%
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{aiData.performance.trueDetections} correct of {aiData.performance.totalScansThisWeek}</div>
                                            </div>

                                            {/* False Positive Rate */}
                                            <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #f59e0b' }}>
                                                <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>False Positives</div>
                                                <div style={{ fontSize: '36px', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>
                                                    {aiData.performance.falsePositiveRate}%
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{aiData.performance.falsePositives} safe content flagged</div>
                                            </div>

                                            {/* False Negative Rate */}
                                            <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #ef4444' }}>
                                                <div style={{ fontSize: '10px', color: '#ef4444', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Missed Threats</div>
                                                <div style={{ fontSize: '36px', fontWeight: '900', color: '#ef4444', lineHeight: 1 }}>
                                                    {aiData.performance.falseNegativeRate}%
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{aiData.performance.falseNegatives} threats slipped through</div>
                                            </div>

                                            {/* Avg Confidence */}
                                            <div className="glass-card" style={{ padding: '20px', borderTop: '3px solid #3b82f6' }}>
                                                <div style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Avg Confidence</div>
                                                <div style={{ fontSize: '36px', fontWeight: '900', color: '#3b82f6', lineHeight: 1 }}>
                                                    {aiData.performance.avgWeekConfidence}%
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>AI certainty in decisions</div>
                                            </div>

                                            {/* Model Health */}
                                            <div className="glass-card" style={{ padding: '20px', borderTop: `3px solid ${aiData.performance.modelHealth === 'excellent' ? '#10b981' : aiData.performance.modelHealth === 'good' ? '#3b82f6' : aiData.performance.modelHealth === 'fair' ? '#f59e0b' : '#ef4444'}` }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '8px' }}>Model Health</div>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: aiData.performance.modelHealth === 'excellent' ? '#10b981' : aiData.performance.modelHealth === 'good' ? '#3b82f6' : aiData.performance.modelHealth === 'fair' ? '#f59e0b' : '#ef4444', textTransform: 'uppercase', lineHeight: 1.2 }}>
                                                    {aiData.performance.modelHealth === 'excellent' ? '✅ Excellent' : aiData.performance.modelHealth === 'good' ? '🟢 Good' : aiData.performance.modelHealth === 'fair' ? '🟡 Fair' : '🔴 Attention'}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{aiData.performance.modelHealth === 'needs_attention' ? 'Retrain recommended' : 'Operating normally'}</div>
                                            </div>
                                        </div>

                                        {/* Accuracy vs Error Visual Bar */}
                                        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: '800', color: 'white', marginBottom: '12px' }}>Accuracy Breakdown — This Week ({aiData.performance.totalScansThisWeek} scans)</div>
                                            <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                {aiData.performance.overallAccuracy > 0 && (
                                                    <div style={{ width: `${aiData.performance.overallAccuracy}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: 'white' }}>
                                                        {aiData.performance.overallAccuracy}% correct
                                                    </div>
                                                )}
                                                {aiData.performance.falsePositiveRate > 0 && (
                                                    <div style={{ width: `${Math.max(aiData.performance.falsePositiveRate, 3)}%`, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                                                        FP
                                                    </div>
                                                )}
                                                {aiData.performance.falseNegativeRate > 0 && (
                                                    <div style={{ width: `${Math.max(aiData.performance.falseNegativeRate, 3)}%`, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: 'white' }}>
                                                        FN
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '24px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} /> Correct ({aiData.performance.trueDetections})</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }} /> False Positive ({aiData.performance.falsePositives})</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> False Negative ({aiData.performance.falseNegatives})</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ── CHARTS ROW ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    {/* Accuracy Drift Chart */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} color="#10b981" /> Accuracy Trend (Weekly)</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <LineChart data={aiData.weeklyAccuracy || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[50, 100]} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Line type="monotone" dataKey="avgConfidence" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} name="Avg Confidence %" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Scan Latency Chart */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="#f59e0b" /> Scan Latency by Type</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={aiData.scanLatency || []}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Bar dataKey="avgProcessingMs" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg ms" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* ── CONFIDENCE BY TYPE + CATEGORY ACCURACY ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    {/* Confidence per scan type */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={16} color="#8b5cf6" /> Confidence by Scan Type</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(aiData.confidenceByType || []).map((m: any) => {
                                                const conf = Math.round(m.avgConfidence || 0);
                                                const confColor = conf >= 85 ? '#10b981' : conf >= 70 ? '#3b82f6' : conf >= 50 ? '#f59e0b' : '#ef4444';
                                                return (
                                                    <div key={m._id} style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: '700', color: 'white', textTransform: 'capitalize' }}>{m._id || 'Unknown'}</span>
                                                            <span style={{ fontSize: '13px', fontWeight: '900', color: confColor }}>{conf}%</span>
                                                        </div>
                                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${conf}%`, height: '100%', background: `linear-gradient(90deg, ${confColor}, ${confColor}80)`, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{m.count} scans • Avg risk: {Math.round(m.avgRisk || 0)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Category Accuracy */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={16} color="#06b6d4" /> Category-Level Accuracy</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {(aiData.categoryAccuracy || []).map((c: any) => {
                                                const conf = Math.round(c.avgConfidence || 0);
                                                const catColor = conf >= 85 ? '#10b981' : conf >= 70 ? '#3b82f6' : conf >= 50 ? '#f59e0b' : '#ef4444';
                                                return (
                                                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                        <span style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: 'white' }}>{c._id || 'Other'}</span>
                                                        <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${conf}%`, height: '100%', background: catColor, borderRadius: '3px' }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: '800', color: catColor, width: '40px', textAlign: 'right' }}>{conf}%</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>{c.count}</span>
                                                    </div>
                                                );
                                            })}
                                            {(aiData.categoryAccuracy || []).length === 0 && (
                                                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No category data available yet.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>)}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        7. USER BEHAVIOUR ANALYTICS
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'user_analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>User Behaviour Analytics</h1>
                            {loading || !analyticsData ? <LoadingSkeleton /> : (<>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                    {/* Action breakdown */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Action Distribution</h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={analyticsData.actionBreakdown} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis dataKey="_id" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={120} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Daily activity */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Daily Activity (14 days)</h3>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <AreaChart data={analyticsData.dailyActivity}>
                                                <defs><linearGradient id="gAct" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#gAct)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* User activity table */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', color: 'white' }}>Top Active Users</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {(analyticsData.userActivity || []).map((u: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: 'white' }}>{i + 1}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{u._id.email}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {u._id.actor}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#8b5cf6' }}>{u.actions}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>actions</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>)}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        8. COMPOSITE THREAT PROFILES
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'composite' && (
                        <motion.div key="composite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Composite Threat Profiling</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Cross-vector sessions where the same user triggered multiple scan types (text + URL + image).</p>
                            {loading || !compositeData ? <LoadingSkeleton /> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {(compositeData.profiles || []).map((p: any) => {
                                        const riskColor = p.compositeRisk > 80 ? '#ef4444' : p.compositeRisk > 60 ? '#f59e0b' : p.compositeRisk > 40 ? '#3b82f6' : '#10b981';
                                        return (
                                            <div key={p._id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${riskColor}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>User: {p._id}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                            Vectors: {p.scanTypes.join(', ')} • IPs: {(p.ips || []).filter(Boolean).join(', ')} • Origins: {(p.countries || []).filter(Boolean).join(', ')}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Composite Risk</div>
                                                        <div style={{ fontSize: '36px', fontWeight: '900', color: riskColor, lineHeight: 1 }}>{Math.round(p.compositeRisk)}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Scans</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{p.totalScans}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(239,68,68,0.05)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: '#ef4444', textTransform: 'uppercase' }}>Critical</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444' }}>{p.criticalCount}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(245,158,11,0.05)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: '#f59e0b', textTransform: 'uppercase' }}>High</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>{p.highCount}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(59,130,246,0.05)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: '#3b82f6', textTransform: 'uppercase' }}>Avg Risk</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>{Math.round(p.avgRisk)}</div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categories</div>
                                                        <div style={{ fontSize: '11px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{(p.categories || []).filter(Boolean).slice(0, 3).join(', ')}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(compositeData.profiles || []).length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No multi-vector threat profiles detected.</div>}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        9. SYSTEM HEALTH
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'system_health' && (
                        <motion.div key="health" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>System Health Panel</h1>
                            {loading || !healthData ? <LoadingSkeleton /> : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                                    {/* API Response Time */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Zap size={18} color="#f59e0b" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>API Latency</span></div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: healthData.apiResponseTime < 100 ? '#10b981' : '#f59e0b' }}>{healthData.apiResponseTime}ms</div>
                                    </div>
                                    {/* AI Backend */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Cpu size={18} color="#8b5cf6" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>AI Backend</span></div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {healthData.aiBackendStatus === 'active' ? <Wifi size={20} color="#10b981" /> : <WifiOff size={20} color="#ef4444" />}
                                            <span style={{ fontSize: '18px', fontWeight: '800', color: healthData.aiBackendStatus === 'active' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>{healthData.aiBackendStatus}</span>
                                        </div>
                                        {healthData.aiBackendLatency > 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Latency: {healthData.aiBackendLatency}ms</div>}
                                    </div>
                                    {/* Scan Queue */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Database size={18} color="#3b82f6" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Scan Queue (5min)</span></div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#3b82f6' }}>{healthData.scanQueueDepth}</div>
                                    </div>
                                    {/* Uptime */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Clock size={18} color="#10b981" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Uptime</span></div>
                                        <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{healthData.uptime}</div>
                                    </div>
                                    {/* Total Scans */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Activity size={18} color="#06b6d4" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Total Scans</span></div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#06b6d4' }}>{healthData.totalScans}</div>
                                    </div>
                                    {/* Memory */}
                                    <div className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Server size={18} color="#ec4899" /><span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Memory Usage</span></div>
                                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#ec4899' }}>{healthData.memoryUsage}MB</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        10. PRIVACY & RETENTION
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'privacy' && (
                        <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Privacy & Data Retention</h1>
                            <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div><label style={{ fontSize: '13px', fontWeight: '800', display: 'block', marginBottom: '8px' }}>Log Retention Period</label>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>How long should threat logs be stored?</p>
                                    <select className="input" defaultValue="30 Days" style={{ width: '100%' }}><option>14 Days (Strict)</option><option>30 Days (Standard)</option><option>90 Days</option></select>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                                    <div><div style={{ fontSize: '15px', fontWeight: '800' }}>Automated PII Masking</div><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Auto-obfuscate PII in logs</div></div>
                                    <ToggleRight size={32} color="#10b981" />
                                </div>
                                <div style={{ borderTop: '1px solid rgba(239,68,68,0.3)', paddingTop: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ef4444', marginBottom: '8px' }}>Manual Data Wipe</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Permanently erase all historical scan data. Cannot be undone.</p>
                                    <button style={{ padding: '12px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={16} /> Wipe All Data</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        11. THREAT TRIAGE WORKSPACE
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'triage' && (
                        <motion.div key="triage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Threat Triage Workspace</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Review flagged content. Every decision requires a reason tag for accountability.</p>

                            {loading ? <LoadingSkeleton /> : triageAlerts.length === 0 ? (
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Queue Clear</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No open alerts awaiting review.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {triageAlerts.map((a: any) => (
                                        <div key={a._id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${SEV_COLOR[a.severity]}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                        <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', background: `${SEV_COLOR[a.severity]}20`, color: SEV_COLOR[a.severity], textTransform: 'uppercase' }}>{a.severity}</span>
                                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                                                    </div>
                                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{a.title}</div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{a.description}</div>
                                                </div>
                                                <button onClick={() => loadTimeline(a._id)}
                                                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <Clock size={14} /> Timeline
                                                </button>
                                            </div>
                                            {/* XAI Card */}
                                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <Zap size={14} color="#60a5fa" />
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#60a5fa' }}>AI Explanation</span>
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>{a.description || 'AI detected suspicious patterns.'}</div>
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
                                                <select value={triageReason} onChange={e => setTriageReason(e.target.value)} className="input" style={{ minWidth: '200px', fontSize: '12px' }}>
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
                        12. INCIDENT TIMELINE
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
                            ) : !timelineData ? <LoadingSkeleton /> : (
                                <div style={{ position: 'relative', paddingLeft: '40px' }}>
                                    <div style={{ position: 'absolute', left: '15px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(to bottom, #3b82f6, #10b981)', opacity: 0.3 }} />
                                    {(timelineData.timeline || []).map((evt: any, i: number) => {
                                        const iconMap: Record<string, React.ElementType> = { shield: Shield, bell: Bell, terminal: Terminal, user: UserIcon, activity: Activity, check: CheckCircle };
                                        const Icon = iconMap[evt.icon] || Activity;
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} style={{ position: 'relative', marginBottom: '24px' }}>
                                                <div style={{ position: 'absolute', left: '-33px', top: '8px', width: '18px', height: '18px', borderRadius: '50%', background: evt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${evt.color}40` }}>
                                                    <Icon size={10} color="white" />
                                                </div>
                                                <div className="glass-card" style={{ padding: '20px', borderLeft: `3px solid ${evt.color}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <div>
                                                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>{evt.label}</div>
                                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{evt.detail}</div>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '16px' }}>{new Date(evt.timestamp).toLocaleString()}</div>
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
                        13. PRIVACY & ANONYMOUS REPORTS
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'privacy' && (
                        <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>🔒 Privacy & Anonymous Reports</h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>User-submitted anonymous reports. No identity data is stored — all reports are fully de-identified.</p>
                                </div>
                                <button onClick={async () => { setLoading(true); try { const d = await apiFetch('/api/reports/anonymous'); setAnonReports(d.reports || []); } catch { } setLoading(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                                    <Activity size={14} /> Refresh
                                </button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
                                {[
                                    { label: 'Total Reports', value: anonReports.length, color: '#8b5cf6' },
                                    { label: 'Pending Review', value: anonReports.filter(r => r.status === 'pending').length, color: '#f59e0b' },
                                    { label: 'Critical Urgency', value: anonReports.filter(r => r.urgency === 'critical').length, color: '#ef4444' },
                                    { label: 'Action Taken', value: anonReports.filter(r => r.status === 'action_taken').length, color: '#10b981' },
                                ].map((s, i) => (
                                    <div key={i} className="glass-card" style={{ padding: '18px', borderTop: `3px solid ${s.color}` }}>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>{s.label}</div>
                                        <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Filter bar */}
                            <div className="glass-card" style={{ padding: '14px 20px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Filter:</span>
                                {[{ key: '', label: 'All' }, { key: 'pending', label: '⏳ Pending' }, { key: 'reviewed', label: '👁️ Reviewed' }, { key: 'action_taken', label: '✅ Action Taken' }, { key: 'dismissed', label: '🚫 Dismissed' }].map(f => (
                                    <button key={f.key} onClick={() => setAnonStatusFilter(f.key)}
                                        style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', borderColor: anonStatusFilter === f.key ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)', background: anonStatusFilter === f.key ? 'rgba(59,130,246,0.15)' : 'transparent', color: anonStatusFilter === f.key ? '#60a5fa' : 'var(--text-muted)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {loading ? <LoadingSkeleton /> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(anonStatusFilter ? anonReports.filter(r => r.status === anonStatusFilter) : anonReports).length === 0 ? (
                                        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <Flag size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>No reports found</div>
                                            <div style={{ fontSize: '13px' }}>Anonymous reports from users will appear here.</div>
                                        </div>
                                    ) : (
                                        (anonStatusFilter ? anonReports.filter(r => r.status === anonStatusFilter) : anonReports).map((report: any) => {
                                            const urgencyColors: Record<string, string> = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
                                            const statusColors: Record<string, string> = { pending: '#f59e0b', reviewed: '#3b82f6', action_taken: '#10b981', dismissed: '#64748b' };
                                            const uc = urgencyColors[report.urgency] || '#64748b';
                                            const sc = statusColors[report.status] || '#64748b';
                                            return (
                                                <div key={report._id} className="glass-card" style={{ padding: '20px 24px', borderLeft: `4px solid ${uc}` }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: '700' }}>{report.reportId}</span>
                                                                <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '4px', background: `${uc}15`, color: uc, fontWeight: '800', textTransform: 'uppercase' }}>{report.urgency}</span>
                                                                <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '4px', background: `${sc}15`, color: sc, fontWeight: '800', textTransform: 'capitalize' }}>{report.status?.replace('_', ' ')}</span>
                                                                <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '4px', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontWeight: '700', textTransform: 'capitalize' }}>{report.category?.replace('_', ' ')}</span>
                                                            </div>
                                                            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7, margin: 0, marginBottom: report.evidenceUrl ? '8px' : 0 }}>{report.description}</p>
                                                            {report.evidenceUrl && (
                                                                <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                                                                    🔗 View Evidence
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(report.createdAt).toLocaleString()}</div>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                {['reviewed', 'action_taken', 'dismissed'].filter(s => s !== report.status).map(newStatus => {
                                                                    const btnColors: Record<string, string> = { reviewed: '#3b82f6', action_taken: '#10b981', dismissed: '#64748b' };
                                                                    const bc = btnColors[newStatus];
                                                                    return (
                                                                        <button key={newStatus}
                                                                            disabled={anonUpdating === report.reportId}
                                                                            onClick={async () => {
                                                                                setAnonUpdating(report.reportId);
                                                                                try {
                                                                                    await fetch('/api/reports/anonymous', {
                                                                                        method: 'PATCH',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ reportId: report.reportId, status: newStatus }),
                                                                                    });
                                                                                    setAnonReports(prev => prev.map(r => r.reportId === report.reportId ? { ...r, status: newStatus } : r));
                                                                                } catch { }
                                                                                setAnonUpdating(null);
                                                                            }}
                                                                            style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${bc}40`, background: `${bc}15`, color: bc, cursor: 'pointer', fontWeight: '700', fontFamily: 'inherit', opacity: anonUpdating === report.reportId ? 0.5 : 1, textTransform: 'capitalize' }}>
                                                                            {newStatus.replace('_', ' ')}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══════════════════════════════════════════════════════
                        13. PROFILE
                       ═══════════════════════════════════════════════════════ */}
                    {section === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Admin Profile & Security</h1>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                {/* Personal Details */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    {profileMessage.text && (
                                        <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', background: profileMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: profileMessage.type === 'error' ? '#fca5a5' : '#6ee7b7', fontSize: '13px', border: `1px solid ${profileMessage.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                            {profileMessage.text}
                                        </div>
                                    )}

                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Personal Details</h3>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ width: '80px', height: '80px', background: user.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, #ef4444, #f59e0b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800', color: 'white' }}>
                                                {!user.avatar && (user.name?.charAt(0) || 'A')}
                                            </div>
                                            <input type="file" id="adminAvatarUpload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                            <label htmlFor="adminAvatarUpload" style={{ position: 'absolute', bottom: -5, right: -5, background: '#ef4444', border: '2px solid #0f172a', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <Upload size={14} color="white" />
                                            </label>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Admin Name</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input className="input" defaultValue={user.name} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '10px' }} />
                                                <button onClick={() => handleProfileUpdate('name')} className="btn-primary" style={{ padding: '0 16px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                                            </div>
                                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Email: <span style={{ color: 'white' }}>{user.email}</span></div>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>Change Password</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Current Password</label><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="input" style={{ width: '100%' }} /></div>
                                        <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '6px' }}>New Password</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="input" style={{ width: '100%' }} /></div>
                                        <button onClick={() => handleProfileUpdate('password')} className="btn-primary" style={{ padding: '12px 0', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '8px', fontSize: '13px' }}>Update Secure Password</button>
                                    </div>
                                </div>
                                {/* Global Alert Subscriptions */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Global Alert Subscriptions</h3>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Email Notifications (SOC)</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get direct alerts for critical threats</div>
                                            </div>
                                            <ToggleRight size={32} color="#3b82f6" />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Push Notifications</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Browser alerts on escalations</div>
                                            </div>
                                            <ToggleRight size={32} color="#10b981" />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Account Info</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Role</span>
                                                <span style={{ color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', fontSize: '13px' }}>{user.role}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Organization</span>
                                                <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{user.orgName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
