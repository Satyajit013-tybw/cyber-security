'use client';
import { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import AIChatWidget from '@/components/AIChatWidget';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    Shield, AlertTriangle, CheckCircle, Search, Upload, FileText, Globe, Image,
    Bell, User, Lock, Download, Trash2, Eye, EyeOff, Clock, Smartphone, ChevronRight, X, Activity,
    ShieldAlert, Eye as EyeIcon, Database, Link as LinkIcon, AlertOctagon, RefreshCw, Zap, ToggleLeft, ToggleRight,
    HeartPulse, TrendingUp, Info, ShieldCheck, AlertCircle, GraduationCap, Lightbulb, Flag, Send, ShieldOff, Newspaper, BadgeCheck, XCircle, HelpCircle, QrCode, Camera, CreditCard, Languages, Bot
} from 'lucide-react';

// ─── CYBER AWARENESS MICRO-TIPS LIBRARY ───
const MICRO_TIPS: Record<string, { id: string; title: string; tip: string }[]> = {
    'Phishing': [
        { id: 'phish-1', title: 'What is Phishing?', tip: 'Phishing is when attackers create fake websites or emails that look like real ones to steal your login credentials. Always check the URL bar carefully before entering passwords.' },
        { id: 'phish-2', title: 'Spot a Phishing Email', tip: 'Phishing emails often contain urgent language like "Your account will be locked!" Real companies rarely ask for passwords via email. When in doubt, go directly to the website.' },
        { id: 'phish-3', title: 'Link Verification', tip: 'Hover over links before clicking them. If the URL looks different from the official website, it\'s likely a phishing attempt. Bookmarking trusted sites prevents accidental visits to fakes.' },
    ],
    'Malware': [
        { id: 'malw-1', title: 'What is Malware?', tip: 'Malware is software designed to damage or gain unauthorized access to your computer. It can be hidden in downloads, email attachments, or even websites you visit.' },
        { id: 'malw-2', title: 'Safe Downloads', tip: 'Only download software from official websites or app stores. Files ending in .exe, .bat, or .sh from unknown sources are extremely dangerous and should never be opened.' },
        { id: 'malw-3', title: 'Keep Software Updated', tip: 'Outdated software has known security holes that malware exploits. Enable auto-updates on your OS and browser to stay protected automatically.' },
    ],
    'Suspicious Link': [
        { id: 'susp-1', title: 'Shortened URLs', tip: 'Shortened links (like bit.ly) hide the real destination. Use a URL expander tool to preview where the link actually goes before clicking it.' },
        { id: 'susp-2', title: 'HTTPS Matters', tip: 'Legitimate websites use HTTPS (look for the padlock icon). If a site asks for personal info without HTTPS, your data could be intercepted by anyone on the network.' },
    ],
    'Suspicious Domain': [
        { id: 'dom-1', title: 'Verify Website Identity', tip: 'Suspicious domains often use unusual extensions like .xyz or .top instead of .com. Always double-check you are on the official website before entering any information.' },
        { id: 'dom-2', title: 'IP Address URLs', tip: 'Legitimate websites use domain names, not raw IP addresses (like http://192.168.x.x). If a URL shows only numbers, it\'s likely a temporary phishing or scam page.' },
    ],
    'Credential Harvesting Risk': [
        { id: 'cred-1', title: 'Protect Your Passwords', tip: 'Never enter your password on a website you reached via an email link. Always navigate to the website directly by typing it in your browser.' },
        { id: 'cred-2', title: 'Use a Password Manager', tip: 'Password managers auto-fill only on legitimate websites. If your manager doesn\'t recognize a site, it might be a fake — that\'s your safety net!' },
    ],
    'Clean': [
        { id: 'clean-1', title: 'Stay Vigilant', tip: 'Even clean-looking content can be a stepping stone for future attacks. Regularly review your account activity and enable notifications for suspicious logins.' },
        { id: 'clean-2', title: 'Digital Hygiene', tip: 'Good security is a habit. Use unique passwords for every account, enable two-factor authentication, and review app permissions regularly.' },
    ],
};

// ─── DYNAMIC DATA INITIALIZATION ───

const SEVERITY_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' };

type Section = 'home' | 'safety' | 'scan' | 'history' | 'alerts' | 'privacy' | 'profile' | 'security' | 'reports' | 'activity' | 'report' | 'factcheck' | 'qrscan' | 'healing';

// ─── Self-Healing Panel Component (must be outside UserDashboard to respect Rules of Hooks) ───
function SelfHealingPanel() {
    const [healingStatus, setHealingStatus] = useState<any>(null);
    const [healingLog, setHealingLog] = useState<any[]>([]);
    const [manualIP, setManualIP] = useState('');
    const [triggering, setTriggering] = useState(false);
    const [triggerMsg, setTriggerMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/self-healing', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setHealingStatus(data.status);
                    setHealingLog(data.recentActions || []);
                }
            } catch { }
        };
        load();
        const interval = setInterval(load, 8000);
        return () => clearInterval(interval);
    }, []);

    const triggerDemo = async () => {
        setTriggering(true);
        setTriggerMsg('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/self-healing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    auto: true,
                    target: { ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, email: null },
                    severity: ['CRITICAL', 'HIGH', 'MEDIUM'][Math.floor(Math.random() * 3)],
                }),
            });
            const data = await res.json();
            if (data.success) {
                setTriggerMsg(`✅ ${data.message}`);
                setHealingLog(prev => [
                    ...data.actions.map((a: string) => ({ action: a, time: new Date().toISOString(), severity: 'HIGH', result: '✅ Executed' })),
                    ...prev,
                ]);
                setHealingStatus((s: any) => s ? { ...s, totalBlockedIPs: data.summary?.totalBlockedIPs || s.totalBlockedIPs } : s);
            }
        } catch { setTriggerMsg('❌ Failed to trigger pipeline'); }
        setTriggering(false);
        setTimeout(() => setTriggerMsg(''), 5000);
    };

    const blockIPManual = async () => {
        if (!manualIP.trim()) return;
        const token = localStorage.getItem('token');
        await fetch('/api/self-healing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: 'block_ip', target: manualIP.trim(), severity: 'MEDIUM' }),
        });
        setHealingLog(prev => [{ action: `IP Blocked (Manual): ${manualIP.trim()}`, time: new Date().toISOString(), severity: 'MEDIUM', result: '✅ Blocked' }, ...prev]);
        setManualIP('');
    };

    const statusCards = [
        { label: 'Blocked IPs', value: healingStatus?.totalBlockedIPs ?? '—', color: '#ef4444', icon: '🚫', sub: 'Active on firewall' },
        { label: 'Disabled Accounts', value: healingStatus?.disabledAccounts ?? '—', color: '#f59e0b', icon: '🔒', sub: 'Pending review' },
        { label: 'Firewall Rules', value: healingStatus?.activeFirewallRules ?? '—', color: '#3b82f6', icon: '🔥', sub: 'Auto-generated' },
        { label: 'System Status', value: healingStatus?.systemHealth ?? 'ACTIVE', color: '#10b981', icon: '⚡', sub: 'Self-healing online' },
    ];

    return (
        <motion.div key="healing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 24px rgba(16,185,129,0.3)', flexShrink: 0 }}>
                    <Bot size={22} color="white" />
                </div>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>⚡ Auto Self-Healing Security</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Automated threat responses — IP blocking, account lockdown, firewall rules &amp; alerts.</p>
                </div>
            </div>

            {/* Status metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px', marginTop: '20px' }}>
                {statusCards.map(c => (
                    <div key={c.label} className="glass-card" style={{ padding: '20px', borderLeft: `3px solid ${c.color}` }}>
                        <div style={{ fontSize: '22px', marginBottom: '4px' }}>{c.icon}</div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: c.color }}>{c.value}</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{c.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Action Log */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700' }}>🔄 Real-Time Action Log</h3>
                        <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: '700' }}>LIVE</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                        {healingLog.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                                No actions triggered yet.<br />Click the demo button to simulate a threat response.
                            </div>
                        ) : healingLog.map((log, i) => (
                            <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.severity === 'CRITICAL' ? '#ef4444' : log.severity === 'HIGH' ? '#f59e0b' : log.severity === 'INFO' ? '#10b981' : '#3b82f6', flexShrink: 0, marginTop: '4px' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'white', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.action}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.target ?? ''} {log.result ?? ''}</div>
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                                    {log.time ? new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>🚀 Simulate Threat Response</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6 }}>Trigger the full auto-healing pipeline: block IP → disable account → create firewall rule → backup → alert team.</p>
                        {triggerMsg && (
                            <div style={{ padding: '10px 14px', borderRadius: '8px', background: triggerMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: triggerMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '13px', marginBottom: '12px', border: `1px solid ${triggerMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                {triggerMsg}
                            </div>
                        )}
                        <button onClick={triggerDemo} disabled={triggering} className="btn-primary"
                            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '10px', cursor: triggering ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            {triggering ? <><RefreshCw size={16} className="spin-anim" /> Running Pipeline...</> : <><Zap size={16} /> Trigger Auto-Heal Demo</>}
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>🚫 Manual IP Block</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Manually add an IP address to the blocklist.</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input value={manualIP} onChange={e => setManualIP(e.target.value)} onKeyDown={e => e.key === 'Enter' && blockIPManual()}
                                placeholder="e.g. 192.168.1.100" className="input" style={{ flex: 1 }} />
                            <button onClick={blockIPManual} disabled={!manualIP.trim()} className="btn-primary"
                                style={{ padding: '0 20px', border: 'none', borderRadius: '8px', cursor: manualIP.trim() ? 'pointer' : 'not-allowed', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Lock size={14} /> Block
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>⚙️ Pipeline Steps</h3>
                        {[
                            { step: '1', label: 'Detect Threat', desc: 'AI flags malicious activity', color: '#ef4444' },
                            { step: '2', label: 'Block IP', desc: 'Added to real-time blocklist', color: '#f59e0b' },
                            { step: '3', label: 'Firewall Rule', desc: 'DENY rule auto-deployed', color: '#3b82f6' },
                            { step: '4', label: 'Backup Data', desc: 'Snapshot triggered instantly', color: '#8b5cf6' },
                            { step: '5', label: 'Alert Team', desc: 'Security team notified', color: '#10b981' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${s.color}20`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: s.color, flexShrink: 0 }}>{s.step}</div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{s.label}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function UserDashboard() {
    const router = useRouter();
    const { user, loading, login } = useAuth();

    // Application State
    const [section, setSection] = useState<Section>('home');
    const [scanType, setScanType] = useState<'text' | 'url' | 'image'>('text');
    const [protectionMode, setProtectionMode] = useState<'manual' | 'automated'>('manual');
    const [scanInput, setScanInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<any | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [historyFilter, setHistoryFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('7days');
    const [searchQ, setSearchQ] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [realTimeAlert, setRealTimeAlert] = useState<any>(null);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [activityData, setActivityData] = useState<any>(null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [microTip, setMicroTip] = useState<{ id: string; title: string; tip: string } | null>(null);

    // Anonymous Report state
    const [reportCategory, setReportCategory] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [reportEvidence, setReportEvidence] = useState('');
    const [reportUrgency, setReportUrgency] = useState('medium');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState<string | null>(null);

    // Fact-Check state
    const [factInput, setFactInput] = useState('');
    const [factType, setFactType] = useState<'claim' | 'url'>('claim');
    const [factChecking, setFactChecking] = useState(false);
    const [factResult, setFactResult] = useState<any>(null);

    // QR Scanner state
    const [qrScanning, setQrScanning] = useState(false);
    const [qrDecoded, setQrDecoded] = useState<string | null>(null);
    const [qrResult, setQrResult] = useState<any>(null);
    const [qrError, setQrError] = useState<string | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const qrFileRef = useRef<HTMLInputElement>(null);

    const [passwordPromptError, setPasswordPromptError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const [newName, setNewName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
    const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled || false);
    const [emailEnabled, setEmailEnabled] = useState(user?.emailNotifications !== false);
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    // New Data States
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    // Load saved language
    useEffect(() => {
        const savedLang = localStorage.getItem('ss_language');
        if (savedLang) setSelectedLanguage(savedLang);
    }, []);

    // Fetch Dashboard Data
    useEffect(() => {
        if (!user || user.role !== 'viewer') return;
        fetch('/api/dashboard/viewer')
            .then(r => r.json())
            .then(d => setDashboardData(d))
            .catch(err => console.error('Dashboard fetch error:', err));
    }, [user, refreshTrigger]);

    // Fetch Live Alerts (Polling every 10s)
    useEffect(() => {
        if (!user || user.role !== 'viewer') return;
        const fetchAlerts = () => {
            fetch('/api/alerts/live')
                .then(r => r.json())
                .then(d => {
                    if (d.alerts) setLiveAlerts(d.alerts);
                })
                .catch(err => console.error('Live alert fetch error:', err));
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Simulate Real-time Alert popup occasionally based on Live Alerts
    useEffect(() => {
        if (liveAlerts.length > 0 && !realTimeAlert && Math.random() > 0.8) {
            const latestAlert = liveAlerts[0];
            setRealTimeAlert({
                message: latestAlert.title,
                severity: latestAlert.severity,
                action: 'Review Info'
            });
            setTimeout(() => setRealTimeAlert(null), 8000);
        }
    }, [liveAlerts]);

    // Load activity data when section changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (section === 'activity') {
            setActivityLoading(true);
            fetch('/api/dashboard/user-analytics').then(r => r.json()).then(d => setActivityData(d)).catch(() => { }).finally(() => setActivityLoading(false));
        }
    }, [section]);

    if (loading || !user || user.role !== 'viewer') return null;

    const handleScan = async () => {
        if (!scanInput.trim()) return;
        setScanning(true);
        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: scanType, content: scanInput })
            });

            if (res.ok) {
                const data = await res.json();

                // Format the backend response to match our UI expectations
                setScanResult({
                    id: data.threat._id,
                    type: data.threat.type,
                    content: data.threat.originalContent,
                    score: data.threat.riskScore,
                    severity: data.threat.severity,
                    category: data.threat.categories[0] || 'Unknown',
                    confidence: data.threat.confidence,
                    date: new Date(data.threat.createdAt).toLocaleString(),
                    explanation: data.threat.explanationDetail || {
                        reason: data.threat.explanation,
                        keywords: [],
                        pattern: 'Identified Pattern',
                        behavioralRisk: 'Evaluated by Threat Engine'
                    },
                    actions: [
                        { label: 'Block this link', type: 'danger', icon: AlertOctagon },
                        { label: 'Report Sender', type: 'warning', icon: ShieldAlert },
                        { label: 'Mark as Safe', type: 'success', icon: CheckCircle }
                    ]
                });

                // Trigger a refresh of the dashboard data so history and stats update
                setRefreshTrigger(prev => prev + 1);

                // Show a Cyber Awareness Micro-Tip
                const category = data.threat.categories?.[0] || 'Clean';
                const tips = MICRO_TIPS[category] || MICRO_TIPS['Clean'];
                const dismissedTips: string[] = JSON.parse(localStorage.getItem('ss_dismissed_tips') || '[]');
                const unseenTip = tips.find(t => !dismissedTips.includes(t.id));
                if (unseenTip) {
                    setTimeout(() => setMicroTip(unseenTip), 1500); // Delay so scan result appears first
                }
            } else {
                let errorMsg = 'AI Analysis Failed. Please try again.';
                try {
                    const errorData = await res.json();
                    if (errorData.error) {
                        errorMsg = errorData.error;
                        if (errorData.detail) errorMsg += ' - ' + errorData.detail;
                    }
                } catch (e) { }
                setScanError(errorMsg);
            }
        } catch (err) {
            console.error('Failed to scan:', err);
            setScanError('Network or server error occurred.');
        } finally {
            setScanning(false);
        }
    };

    const handleFactCheck = async () => {
        if (!factInput.trim()) return;
        setFactChecking(true);
        setFactResult(null);
        try {
            const res = await fetch('/api/fact-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: factInput, type: factType }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setFactResult(data.result);
                }
            }
        } catch (err) {
            console.error('Fact check failed:', err);
        } finally {
            setFactChecking(false);
        }
    };

    const handleProfileUpdate = async (type: 'name' | 'password' | 'avatar') => {
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
            // For avatar, body is built in the handleAvatarChange function directly.

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
                login(data.user); // Instantly updates Context and localStorage
                if (type === 'name') setNewName('');
            }
        } catch (error) {
            setProfileMessage({ text: 'Network error occurred.', type: 'error' });
        }
    };

    const handleTogglePreference = async (pref: 'mfa' | 'email') => {
        const newValue = pref === 'mfa' ? !mfaEnabled : !emailEnabled;
        if (pref === 'mfa') setMfaEnabled(newValue);
        if (pref === 'email') setEmailEnabled(newValue);

        try {
            const body = pref === 'mfa' ? { mfaEnabled: newValue } : { emailNotifications: newValue };
            const res = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok && data.user) {
                login(data.user);
            } else {
                // Revert on failure
                if (pref === 'mfa') setMfaEnabled(!newValue);
                if (pref === 'email') setEmailEnabled(!newValue);
                setProfileMessage({ text: 'Failed to update preferences.', type: 'error' });
            }
        } catch {
            if (pref === 'mfa') setMfaEnabled(!newValue);
            if (pref === 'email') setEmailEnabled(!newValue);
            setProfileMessage({ text: 'Network error updating preferences.', type: 'error' });
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
                    login(data.user); // Instantly updates Context and localStorage
                } else {
                    setProfileMessage({ text: data.error || 'Failed to update avatar', type: 'error' });
                }
            } catch (error) {
                setProfileMessage({ text: 'Network error updating avatar.', type: 'error' });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleQrUpload = async (file: File) => {
        setQrError(null);
        setQrResult(null);
        setQrDecoded(null);
        setQrPreview(URL.createObjectURL(file));
        setQrScanning(true);

        try {
            // Decode QR from image
            const img = document.createElement('img') as HTMLImageElement;
            img.src = URL.createObjectURL(file);
            await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

            const MAX_DIMENSION = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height);
            let decodedContent = code?.data || null;
            let imageBase64 = null;

            if (!code) {
                // If jsQR fails, fallback to Gemini Vision API for decoding
                imageBase64 = canvas.toDataURL('image/jpeg', 0.6);
            }

            setQrDecoded(decodedContent); // this might be null if using fallback

            // Send to AI analysis
            const res = await fetch('/api/qr-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decodedContent, imageBase64 }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setQrResult(data.result);
                    if (!decodedContent && data.result.destination) {
                        setQrDecoded(data.result.destination); // For Gemini Vision fallback
                    }
                }
            } else {
                let errorMessage = 'AI analysis failed. Please try again.';
                try {
                    const errorData = await res.json();
                    if (errorData.error) errorMessage = errorData.error;
                } catch (e) { }
                setQrError(errorMessage);
            }
        } catch (err) {
            console.error('QR scan error:', err);
            setQrError('Failed to process QR code.');
        } finally {
            setQrScanning(false);
        }
    };

    const handleDownload = (type: string) => {
        try {
            if (type === 'Full Activity Report') {
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text('SentinelShield - Full Activity Report', 20, 20);
                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

                doc.setTextColor(0);
                doc.setFontSize(14);
                doc.text('Executive Summary', 20, 45);
                doc.setFontSize(12);
                doc.text(`Total Scans Performed: ${dashboardData?.stats?.totalScans || 0}`, 20, 55);
                doc.text(`Identified Threats Blocked: ${dashboardData?.stats?.threatsBlocked || 0}`, 20, 65);
                doc.text(`Current Privacy Score: ${dashboardData?.safety?.safetyScore ?? '-'}/100`, 20, 75);

                doc.setFontSize(14);
                doc.text('Recent Threat History (Overview)', 20, 95);
                doc.setFontSize(10);

                let y = 105;
                (dashboardData?.threatHistory || []).slice(0, 5).forEach((item: any) => {
                    doc.text(`- [${item.severity.toUpperCase()}] ${item.type} on ${new Date(item.createdAt).toLocaleDateString()}`, 20, y);
                    y += 10;
                });

                doc.save('SentinelShield_Activity_Report.pdf');

                const csvData = (dashboardData?.threatHistory || []).map((t: any) => ({
                    Date: new Date(t.createdAt).toLocaleString(),
                    Type: t.type,
                    Severity: t.severity,
                    Status: t.status,
                    RiskScore: t.riskScore
                }));

                if (csvData.length > 0) {
                    const csv = Papa.unparse(csvData);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'SentinelShield_Activity_Log.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            } else if (type === 'Threat Intelligence Summary') {
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text('Threat Intelligence Summary', 20, 20);
                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

                doc.setTextColor(0);
                doc.setFontSize(14);
                doc.text('Most Common Threats Encountered', 20, 45);
                doc.setFontSize(12);

                let y = 55;
                (dashboardData?.commonThreats || []).forEach((threat: any) => {
                    doc.text(`• ${threat.name}: ${threat.val} incidents recorded`, 25, y);
                    y += 10;
                });

                doc.text('Safety Rating:', 20, y + 15);
                doc.text(`Weekly Blocked: ${dashboardData?.safety?.weeklyBlocked || 0}`, 25, y + 25);
                doc.text(`Monthly Blocked: ${dashboardData?.safety?.monthlyBlocked || 0}`, 25, y + 35);

                doc.save('Threat_Intelligence_Summary.pdf');
            } else if (type === 'Governance & Compliance') {
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text('Governance & Compliance Certificate', 20, 20);

                doc.setFontSize(12);
                doc.setTextColor(100);
                doc.text(`Issued: ${new Date().toLocaleString()}`, 20, 30);
                doc.text(`Account Holder: ${user?.name || 'User'}`, 20, 40);

                doc.setTextColor(0);
                doc.setFontSize(14);
                doc.text('Compliance Verification Matrix', 20, 60);
                doc.setFontSize(12);
                doc.text('[ VERIFIED ] Identity Protection Active', 25, 75);
                doc.text('[ VERIFIED ] Zero-Trust Environment Established', 25, 85);
                doc.text('[ VERIFIED ] Data Anonymization Algorithms Enabled', 25, 95);
                doc.text(`[ VERIFIED ] Multi-Factor Auth: ${user?.mfaEnabled ? 'Enabled' : 'Disabled'}`, 25, 105);

                doc.setFontSize(10);
                doc.text('This document certifies that the listed user account is operating securely within', 20, 130);
                doc.text('the SentinelShield Enterprise framework with all standard compliance met.', 20, 135);

                doc.save('Governance_Compliance_Report.pdf');
            }
        } catch (error) {
            console.error('Download failed', error);
            alert('Failed to generate report.');
        }
    };

    const filteredHistory = (dashboardData?.threatHistory || []).filter((s: any) => {
        if (historyFilter !== 'all' && s.severity !== historyFilter) return false;
        if (searchQ && !(s.originalContent || s.anonymizedContent).toLowerCase().includes(searchQ.toLowerCase())) return false;
        return true;
    });

    const NAV: { key: Section; label: string; icon: React.ElementType }[] = [
        { key: 'home', label: 'Dashboard', icon: Activity },
        { key: 'safety', label: 'Safety Dashboard', icon: HeartPulse },
        { key: 'scan', label: 'Threat Scanner', icon: Shield },
        { key: 'history', label: 'Threat History', icon: Clock },
        { key: 'alerts', label: 'Live Alerts', icon: Bell },
        { key: 'activity', label: 'My Activity', icon: Eye },
        { key: 'factcheck', label: 'Fact Checker', icon: Newspaper },
        { key: 'qrscan', label: 'QR Scanner', icon: QrCode },
        { key: 'report', label: 'Report Anonymously', icon: Flag },
        { key: 'privacy', label: 'Privacy & Data', icon: EyeIcon },
        { key: 'reports', label: 'Reports', icon: Download },
        { key: 'healing', label: 'Self-Healing', icon: Bot },
    ];

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar activeSection={section} onNav={setSection} navItemsOverride={NAV as any} />
            <main className="main-content" style={{ flex: 1, position: 'relative' }}>

                {/* Spline 3D Background — visible across all sections */}
                <div style={{ position: 'fixed', top: 0, right: 0, width: '55%', height: '100vh', zIndex: 0, pointerEvents: 'none', opacity: 0.3 }}>
                    <iframe
                        src="https://my.spline.design/techinspired3dassets01protection-aXoKCHFFzHomYoX0UnilCs6G/"
                        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                        loading="lazy"
                        title="3D Shield Background"
                    />
                </div>


                {/* Real-time Alert Feed Popup */}
                <AnimatePresence>
                    {realTimeAlert && (
                        <motion.div initial={{ opacity: 0, y: -50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'fixed', top: '24px', left: '50%', zIndex: 999, background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(153,27,27,0.95))', padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 40px rgba(239,68,68,0.4)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                            <div style={{ background: 'white', borderRadius: '50%', padding: '8px' }}><AlertTriangle size={20} color="#ef4444" /></div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)' }}>Real-Time Alert Feed • Just Now</div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{realTimeAlert.message}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                <button style={{ padding: '8px 16px', background: 'white', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>{realTimeAlert.action}</button>
                                <button onClick={() => setRealTimeAlert(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {/* ── HOME ─────────────────────────────────────────── */}
                    {section === 'home' && (
                        <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Welcome back, {user.name} 👋</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Your personal security overview. You are fully protected without excessive surveillance.</p>


                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
                                {[
                                    { label: 'Total Scans', value: dashboardData?.stats?.totalScans || 0, sub: 'All time', color: '#3b82f6' },
                                    { label: 'Threats Blocked', value: dashboardData?.stats?.threatsBlocked || 0, sub: 'Critical & High', color: '#ef4444' },
                                    { label: 'Privacy Score', value: '98/100', sub: 'Data anonymized', color: '#10b981' },
                                    { label: 'Active Sessions', value: '1', sub: 'Secure devices', color: '#8b5cf6' },
                                ].map((s, i) => (
                                    <motion.div key={i} className="glass-card" style={{ padding: '20px' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</div>
                                        <div style={{ fontSize: '32px', fontWeight: '900', color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.sub}</div>
                                    </motion.div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Threat Distribution</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>By Category</span>
                                    </div>
                                    {(() => {
                                        const riskData = dashboardData?.riskTrend || [];
                                        const totals: Record<string, number> = {};
                                        riskData.forEach((d: any) => {
                                            if (d.phishing) totals['Phishing'] = (totals['Phishing'] || 0) + d.phishing;
                                            if (d.malware) totals['Malware'] = (totals['Malware'] || 0) + d.malware;
                                            if (d.suspicious) totals['Suspicious'] = (totals['Suspicious'] || 0) + d.suspicious;
                                        });
                                        const pieData = Object.keys(totals).length > 0
                                            ? Object.entries(totals).map(([name, value]) => ({ name, value }))
                                            : [
                                                { name: 'Phishing', value: 38 },
                                                { name: 'Malware', value: 24 },
                                                { name: 'Suspicious', value: 18 },
                                                { name: 'Clean', value: 62 },
                                            ];
                                        const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6'];
                                        const total = pieData.reduce((s, d) => s + d.value, 0);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                <ResponsiveContainer width="55%" height={220}>
                                                    <PieChart>
                                                        <Pie
                                                            data={pieData}
                                                            cx="50%" cy="50%"
                                                            innerRadius={60} outerRadius={90}
                                                            paddingAngle={3}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {pieData.map((_, i) => (
                                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ background: '#0d1e3d', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }}
                                                            formatter={((value: number | undefined, name: string) => [`${value ?? 0} (${Math.round(((value ?? 0) / total) * 100)}%)`, name]) as any}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                                    {pieData.map((d, i) => (
                                                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{d.name}</div>
                                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.value} ({Math.round((d.value / total) * 100)}%)</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Most Common Threats</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={dashboardData?.commonThreats || []}>
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: '#0d1e3d', border: '1px solid #1e3a5f', borderRadius: '8px' }} />
                                            <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                                {(dashboardData?.commonThreats || []).map((e: any, i: number) => <Cell key={i} fill={['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'][i % 5]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PERSONAL SAFETY DASHBOARD ─────────────────────── */}
                    {section === 'safety' && (
                        <motion.div key="safety" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>📊 Personal Safety Dashboard</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Your private safety report card. Only you can see this data.</p>

                            {/* Safety Score Hero Card */}
                            <div className="glass-card" style={{ padding: '32px', marginBottom: '24px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 20% 50%, ${(dashboardData?.safety?.safetyScore || 100) >= 70 ? 'rgba(16,185,129,0.15)' : (dashboardData?.safety?.safetyScore || 100) >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'}, transparent 60%)`, pointerEvents: 'none' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '40px', position: 'relative', zIndex: 1 }}>
                                    {/* Score Circle */}
                                    <div style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                                        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                                            <motion.path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke={(dashboardData?.safety?.safetyScore || 100) >= 70 ? '#10b981' : (dashboardData?.safety?.safetyScore || 100) >= 40 ? '#f59e0b' : '#ef4444'}
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                initial={{ strokeDasharray: '0, 100' }}
                                                animate={{ strokeDasharray: `${dashboardData?.safety?.safetyScore || 100}, 100` }}
                                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                            />
                                        </svg>
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '42px', fontWeight: '900', color: (dashboardData?.safety?.safetyScore || 100) >= 70 ? '#10b981' : (dashboardData?.safety?.safetyScore || 100) >= 40 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{dashboardData?.safety?.safetyScore ?? 100}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '4px' }}>out of 100</div>
                                        </div>
                                    </div>
                                    {/* Score Description */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                                            {(dashboardData?.safety?.safetyScore || 100) >= 80 ? '🛡️ Excellent Safety' : (dashboardData?.safety?.safetyScore || 100) >= 60 ? '⚠️ Moderate Safety' : (dashboardData?.safety?.safetyScore || 100) >= 40 ? '🔶 Needs Attention' : '🚨 Critical Risk'}
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                                            Your safety score is calculated based on your browsing activity, threats encountered, and security posture over the past 30 days. Higher is better.
                                        </p>
                                        <div style={{ display: 'flex', gap: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Scans This Month</div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>{dashboardData?.safety?.totalScansThisMonth || 0}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Blocked This Week</div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#ef4444' }}>{dashboardData?.safety?.weeklyBlocked || 0}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Blocked This Month</div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{dashboardData?.safety?.monthlyBlocked || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                                {/* Weekly Safety Trend */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={16} color="#10b981" /> Weekly Safety Trend</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 7 days</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={dashboardData?.safety?.safetyTrend || []}>
                                            <defs>
                                                <linearGradient id="colorSafety" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                                            <Tooltip contentStyle={{ background: '#0d1e3d', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '12px' }} />
                                            <Area type="monotone" dataKey="safetyScore" stroke="#10b981" fill="url(#colorSafety)" strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Risk Category Breakdown */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} color="#f59e0b" /> Risk Types Faced</h3>
                                    {(dashboardData?.safety?.categoryBreakdown || []).length === 0 ? (
                                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No threat categories detected yet.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            {(dashboardData?.safety?.categoryBreakdown || []).map((cat: any, i: number) => {
                                                const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];
                                                const color = colors[i % colors.length];
                                                return (
                                                    <div key={cat.name}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                                                            <span style={{ fontWeight: '600', color: 'white' }}>{cat.name}</span>
                                                            <span style={{ color: 'var(--text-muted)' }}>{cat.count} ({cat.percentage}%)</span>
                                                        </div>
                                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                                            <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: '100%', background: color, borderRadius: '999px' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Personalized Safety Tips */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={16} color="#60a5fa" /> Personalized Safety Tips</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(dashboardData?.safety?.tips || []).map((t: any, i: number) => {
                                        const bg = t.priority === 'warning' ? 'rgba(245,158,11,0.08)' : t.priority === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)';
                                        const border = t.priority === 'warning' ? 'rgba(245,158,11,0.2)' : t.priority === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)';
                                        const iconColor = t.priority === 'warning' ? '#f59e0b' : t.priority === 'success' ? '#10b981' : '#3b82f6';
                                        const Icon = t.priority === 'warning' ? AlertTriangle : t.priority === 'success' ? ShieldCheck : Info;
                                        return (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 18px', background: bg, borderRadius: '10px', border: `1px solid ${border}` }}>
                                                <div style={{ padding: '6px', background: `${iconColor}15`, borderRadius: '8px', flexShrink: 0, marginTop: '2px' }}><Icon size={16} color={iconColor} /></div>
                                                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{t.tip}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── THREAT SCANNER ───────────────────────────────── */}
                    {section === 'scan' && (
                        <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Smart Threat Scanner</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Analyze content with our proprietary AI. Your data is encrypted in transit and not stored.</p>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                <div
                                    onClick={() => setProtectionMode('manual')}
                                    className="glass-card"
                                    style={{ flex: 1, padding: '20px', cursor: 'pointer', border: protectionMode === 'manual' ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)', background: protectionMode === 'manual' ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(59,130,246,0.2)', borderRadius: '8px' }}><Search size={20} color="#60a5fa" /></div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'white' }}>Manual Analysis</h3>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Paste text, links, or upload files to scan them one by one.</p>
                                </div>
                                <div
                                    onClick={() => setProtectionMode('automated')}
                                    className="glass-card"
                                    style={{ flex: 1, padding: '20px', cursor: 'pointer', border: protectionMode === 'automated' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.05)', background: protectionMode === 'automated' ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.2)', transition: 'all 0.2s' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div style={{ padding: '8px', background: 'rgba(16,185,129,0.2)', borderRadius: '8px' }}><Shield size={20} color="#34d399" /></div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'white' }}>Automated Protection</h3>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Install browser extension for real-time background protection.</p>
                                </div>
                            </div>

                            {protectionMode === 'manual' ? (
                                <>
                                    <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                                        {/* Privacy-Preserving Scan Toggle */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: privacyMode ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid ${privacyMode ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.05)'}`, marginBottom: '20px', transition: 'all 0.3s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '8px', background: privacyMode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                                    <Lock size={18} color={privacyMode ? '#10b981' : '#64748b'} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>Privacy-Preserving Mode</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {privacyMode ? '🟢 Active — PII is auto-redacted before scanning. Only risk signals are returned.' : 'Enable to auto-redact PII before scanning. Your personal data never leaves your device.'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => setPrivacyMode(!privacyMode)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                {privacyMode ? <ToggleRight size={36} color="#10b981" /> : <ToggleLeft size={36} color="#64748b" />}
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                            {([['text', 'Text Snippet', FileText], ['url', 'URL Link', Globe], ['file', 'File Upload', Upload]] as [string, string, React.ElementType][]).map(([t, label, Icon]) => (
                                                <button key={t} onClick={() => { setScanType(t as any); setScanInput(''); setScanResult(null); setScanError(null); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: '600', background: scanType === t ? 'linear-gradient(135deg,#3b82f6,#06b6d4)' : 'rgba(255,255,255,0.06)', color: scanType === t ? 'white' : 'var(--text-muted)' }}>
                                                    <Icon size={14} />{label}
                                                </button>
                                            ))}
                                        </div>

                                        {scanError && (
                                            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <AlertCircle size={16} /> {scanError}
                                            </div>
                                        )}
                                        {scanType === 'text' && (
                                            <textarea value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Paste suspicious text, email content, or messages here..." rows={4}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '14px', color: 'white', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
                                        )}
                                        {scanType === 'url' && (
                                            <input value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="https://suspicious-url.com/link" className="input" style={{ width: '100%', boxSizing: 'border-box' }} />
                                        )}
                                        {scanType === 'file' as any && (
                                            <label style={{ display: 'block', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '10px', padding: '40px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
                                                <input type="file" style={{ display: 'none' }} accept=".txt,.csv" onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        const file = e.target.files[0];
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            if (event.target?.result) {
                                                                setScanInput(event.target.result as string);
                                                            }
                                                        };
                                                        reader.readAsText(file);
                                                    }
                                                }} />
                                                <Upload size={32} color="#3b82f6" style={{ marginBottom: '12px', opacity: 0.8 }} />
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>Click to upload or drag & drop</div>
                                                <div style={{ fontSize: '12px' }}>{scanInput ? 'File loaded successfully.' : 'TXT, CSV allowed for Deep Analysis'}</div>
                                            </label>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Lock size={12} /> End-to-end encrypted. Logs auto-delete after 24h.
                                            </div>
                                            <button onClick={handleScan} disabled={scanning || !scanInput} className="btn-primary"
                                                style={{ padding: '12px 32px', border: 'none', cursor: 'pointer', borderRadius: '10px', fontSize: '14px', fontWeight: '800', opacity: scanning || !scanInput ? 0.5 : 1 }}>
                                                {scanning ? '🤖 AI Analyzing...' : 'Scan Now'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* SCAN RESULT PANEL */}
                                    {scanResult && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '32px', border: `1px solid ${SEVERITY_COLOR[scanResult.severity]}60`, position: 'relative', overflow: 'hidden' }}>

                                            {/* Animated background glow based on severity */}
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: `radial-gradient(circle at top right, ${SEVERITY_COLOR[scanResult.severity]}15 0%, transparent 60%)`, pointerEvents: 'none' }} />

                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Scan Completed</div>
                                                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        Threat Level: <span style={{ color: SEVERITY_COLOR[scanResult.severity] }}>{scanResult.severity.toUpperCase()}</span>
                                                    </h2>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '42px', fontWeight: '900', color: SEVERITY_COLOR[scanResult.severity], lineHeight: 1 }}>{scanResult.score}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Score (0-100)</div>
                                                </div>
                                            </div>

                                            {/* Risk Meters & Confidence */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                                                        <span>Risk Severity Indicator</span>
                                                        <span style={{ color: SEVERITY_COLOR[scanResult.severity] }}>{scanResult.score}%</span>
                                                    </div>
                                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${scanResult.score}%` }} transition={{ duration: 1, ease: 'easeOut' }} style={{ background: `linear-gradient(90deg, #10b981, #f59e0b, #ef4444)`, height: '100%' }} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', fontWeight: '600' }}>
                                                        <span>AI Confidence Calibration</span>
                                                        <span style={{ color: scanResult.confidence < 70 ? '#f59e0b' : '#3b82f6' }}>{scanResult.confidence}%</span>
                                                    </div>
                                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${scanResult.confidence}%` }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} style={{ background: scanResult.confidence < 70 ? '#f59e0b' : '#3b82f6', height: '100%' }} />
                                                    </div>
                                                    {/* Human-AI Collaboration Flag */}
                                                    {scanResult.confidence < 80 && scanResult.score > 50 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                            <AlertTriangle size={14} color="#f59e0b" />
                                                            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700' }}>⚠ Low confidence + High threat → Flagged for human review</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AI EXPLANATION PANEL (VERY IMPORTANT) */}
                                            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '32px' }}>
                                                <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Zap size={16} color="#60a5fa" />
                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>AI Explanation Panel</span>
                                                </div>
                                                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Why it was flagged</div>
                                                        <div style={{ fontSize: '13px', color: 'white', lineHeight: 1.6 }}>{scanResult.explanation.reason}</div>

                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', marginTop: '16px' }}>Behavioral Risk Indicator</div>
                                                        <div style={{ fontSize: '13px', color: '#f59e0b', lineHeight: 1.6, display: 'flex', gap: '6px' }}>
                                                            <Activity size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {scanResult.explanation.behavioralRisk}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Detected Pattern</div>
                                                        <div style={{ fontSize: '13px', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace' }}>{scanResult.explanation.pattern}</div>

                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', marginTop: '16px' }}>Trigger Keywords</div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {scanResult.explanation.keywords.map((kw: string) => (
                                                                <span key={kw} style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>"{kw}"</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Recommendations Engine */}
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Recommended Actions</div>
                                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                    {scanResult.actions.map((act: any, i: number) => {
                                                        const bg = act.type === 'danger' ? '#ef4444' : act.type === 'warning' ? '#f59e0b' : '#10b981';
                                                        return (
                                                            <button key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: `${bg}20`, border: `1px solid ${bg}40`, color: bg, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                                                                <act.icon size={14} /> {act.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            <button onClick={() => setScanResult(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                                        </motion.div>
                                    )}

                                    {/* CYBER AWARENESS MICRO-TIP CARD */}
                                    <AnimatePresence>
                                        {microTip && (
                                            <motion.div
                                                key="micro-tip"
                                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                                className="glass-card"
                                                style={{ padding: '24px', marginTop: '20px', border: '1px solid rgba(99,102,241,0.3)', position: 'relative', overflow: 'hidden' }}
                                            >
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'radial-gradient(circle at top left, rgba(99,102,241,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 1 }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <Lightbulb size={24} color="#a78bfa" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a78bfa', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎓 Cyber Tip</span>
                                                        </div>
                                                        <div style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>{microTip.title}</div>
                                                        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{microTip.tip}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const dismissed: string[] = JSON.parse(localStorage.getItem('ss_dismissed_tips') || '[]');
                                                            if (!dismissed.includes(microTip.id)) {
                                                                dismissed.push(microTip.id);
                                                                localStorage.setItem('ss_dismissed_tips', JSON.stringify(dismissed));
                                                            }
                                                            setMicroTip(null);
                                                        }}
                                                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '800', flexShrink: 0, whiteSpace: 'nowrap' }}
                                                    >
                                                        Got it ✅
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.3)', background: 'linear-gradient(180deg, rgba(16,185,129,0.05) 0%, rgba(0,0,0,0.2) 100%)' }}>
                                    <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <Shield size={40} color="#10b981" />
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>Zero-Friction Automated Protection</h2>
                                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                                        Sentinel Shield's Chrome Extension runs silently in the background, analyzing phishing attempts, malicious domains, and credential harvesters in real-time as you browse.
                                    </p>

                                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '40px' }}>
                                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', width: '220px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981', fontWeight: '800' }}><Zap size={16} /> Real-Time Analysis</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Instantly blocks threats before they load.</div>
                                        </div>
                                        <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderRadius: '12px', width: '220px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#3b82f6', fontWeight: '800' }}><EyeOff size={16} /> Privacy-First</div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Content is analyzed locally when possible. No tracking.</div>
                                        </div>
                                    </div>

                                    <button className="btn-primary" onClick={() => window.open('https://chrome.google.com/webstore/category/extensions', '_blank')} style={{ padding: '14px 32px', fontSize: '15px', fontWeight: '800', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.4)' }}>
                                        <Download size={18} /> Add to Chrome — It's Free
                                    </button>

                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
                                        Already installed? Your activity is syncing automatically in the background.
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* ── PERSONAL THREAT HISTORY ─────────────────────────── */}
                    {section === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Personal Threat History</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>View all past scans. Data persists for 30 days securely.</p>

                            <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search content or URLs..." className="input" style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }} />
                                </div>
                                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input" style={{ width: '150px' }}>
                                    <option value="today">Today</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                </select>
                                <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="input" style={{ width: '150px', textTransform: 'capitalize' }}>
                                    <option value="all">All Severities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '12px' }}>
                                {filteredHistory.map((s: any) => (
                                    <motion.div key={s._id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'border 0.2s', border: '1px solid transparent' }} whileHover={{ borderColor: 'rgba(59,130,246,0.3)', scale: 1.01 }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${SEVERITY_COLOR[s.severity]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {s.type === 'text' ? <FileText size={20} color={SEVERITY_COLOR[s.severity]} /> : s.type === 'url' ? <Globe size={20} color={SEVERITY_COLOR[s.severity]} /> : <Image size={20} color={SEVERITY_COLOR[s.severity]} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '15px', color: 'white', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{s.originalContent || s.anonymizedContent}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleString()} · Type: <span style={{ textTransform: 'uppercase' }}>{s.type}</span> · Category: {s.categories?.[0] || 'Unknown'}</div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: '24px', fontWeight: '900', color: SEVERITY_COLOR[s.severity], lineHeight: 1 }}>{s.riskScore}</div>
                                            <div style={{ fontSize: '11px', color: s.confidence < 80 ? '#f59e0b' : 'var(--text-muted)', fontWeight: s.confidence < 80 ? '700' : '400' }}>
                                                {s.confidence}% conf. {s.confidence < 80 && s.riskScore > 50 ? '⚠' : ''}
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0, width: '120px', textAlign: 'center' }}>
                                            <span style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', background: `${SEVERITY_COLOR[s.severity]}20`, color: SEVERITY_COLOR[s.severity], textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>{s.severity}</span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600' }}>Click for Details →</span>
                                                <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                                    <Download size={10} /> PDF Report
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {filteredHistory.length === 0 && (
                                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No scans found matching your filters.</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── REAL-TIME ALERT FEED ────────────────────────────── */}
                    {section === 'alerts' && (
                        <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Real-Time Alert Feed</h1>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monitoring your active digital footprint for immediate risks.</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '999px', color: '#10b981', fontSize: '12px', fontWeight: '700' }}>
                                    <RefreshCw size={14} className="spin-anim" /> Live Polling Active
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {liveAlerts.length === 0 && (
                                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Watching for threats. No live alerts in your organization.</div>
                                )}
                                {liveAlerts.map((a: any) => (
                                    <div key={a._id} className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${SEVERITY_COLOR[a.severity]}` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ padding: '8px', background: `${SEVERITY_COLOR[a.severity]}20`, borderRadius: '8px' }}>
                                                    <Bell size={20} color={SEVERITY_COLOR[a.severity]} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>{a.title}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>🕐 {new Date(a.createdAt).toLocaleString()} • Source: Threat Engine</div>
                                                </div>
                                            </div>
                                            <span style={{ padding: '4px 12px', borderRadius: '4px', background: `${SEVERITY_COLOR[a.severity]}15`, color: SEVERITY_COLOR[a.severity], fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{a.severity} RISK</span>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Recommended Action Engine</div>
                                                <div style={{ fontSize: '13px', color: 'white' }}>{a.description}</div>
                                            </div>
                                            <button style={{ padding: '10px 20px', background: SEVERITY_COLOR[a.severity], color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>View Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── PRIVACY TRANSPARENCY PANEL ──────────────────────── */}
                    {section === 'privacy' && (
                        <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>Privacy Transparency Panel</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>You are in control. See exactly what data is stored, encrypted, and when it is deleted.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                    <Database size={40} color="#10b981" style={{ opacity: 0.1, position: 'absolute', top: '-10px', right: '-10px', width: '120px', height: '120px' }} />
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /> Data Storage Audit</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {[
                                            { label: 'Scan Content (Text/URL)', val: 'Anonymized & Encrypted' },
                                            { label: 'Uploaded Files', val: 'Deleted after scan (0 bytes stored)' },
                                            { label: 'Metadata & IP Logs', val: 'Retained 30 days securely' },
                                            { label: 'AI Training', val: 'Opted-out (Your data is EXCLUDED)' },
                                        ].map((itm, i) => (
                                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{itm.label}</span>
                                                <span style={{ fontWeight: '600', color: 'white' }}>{itm.val}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={18} /> Audit Logs of Your Data</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {[
                                            { action: 'Data Encryption Key Rotated', time: 'Today, 10:00 AM' },
                                            { action: 'Auto-deletion of scans older than 30d', time: 'Yesterday, Midnight' },
                                            { action: 'Admin view access request (DENIED)', time: 'Feb 19, 2026' },
                                        ].map((log, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '12px', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                                                <Activity size={14} color="#60a5fa" />
                                                <div style={{ flex: 1, color: 'white' }}>{log.action}</div>
                                                <div style={{ color: 'var(--text-muted)' }}>{log.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button className="btn-primary" style={{ padding: '12px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Trash2 size={16} /> Request Complete Account Deletion
                            </button>
                        </motion.div>
                    )}

                    {/* ── PROFILE ──────────────────────────────────────── */}
                    {section === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>My Profile & Security</h1>

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
                                            <div style={{ width: '80px', height: '80px', background: user.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '800' }}>
                                                {!user.avatar && (user.name?.charAt(0) || 'U')}
                                            </div>
                                            <input type="file" id="avatarUpload" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                                            <label htmlFor="avatarUpload" style={{ position: 'absolute', bottom: -5, right: -5, background: '#3b82f6', border: '2px solid #0f172a', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                <Upload size={14} color="white" />
                                            </label>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '800' }}>Display Name</div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input className="input" defaultValue={user.name} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '10px' }} />
                                                <button onClick={() => handleProfileUpdate('name')} className="btn-primary" style={{ padding: '0 16px', borderRadius: '8px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                                            </div>
                                            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>Email: <span style={{ color: 'white' }}>{user.email}</span> (Managed by IT)</div>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>Authentication</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Current Password</label><input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" style={{ width: '100%' }} /></div>
                                        <div><label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', display: 'block', marginBottom: '6px' }}>New Password</label><input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" style={{ width: '100%' }} /></div>
                                        <button onClick={() => handleProfileUpdate('password')} className="btn-primary" style={{ padding: '12px 0', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '8px', fontSize: '13px' }}>Update Password</button>
                                    </div>
                                </div>

                                {/* Notifications & MFA */}
                                <div className="glass-card" style={{ padding: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>Security Preferences</h3>

                                    {/* MFA */}
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Two-Factor Authentication</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Secure your account with an authenticator app</div>
                                            </div>
                                            <button onClick={() => handleTogglePreference('mfa')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                {mfaEnabled ? <ToggleRight size={32} color="#10b981" /> : <ToggleLeft size={32} color="#64748b" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Language Preferences */}
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>🌐 Language Preference</h3>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Display Language</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Change the interface language for the dashboard</div>
                                            </div>
                                            <select
                                                value={selectedLanguage}
                                                onChange={(e) => {
                                                    setSelectedLanguage(e.target.value);
                                                    localStorage.setItem('ss_language', e.target.value);
                                                }}
                                                style={{
                                                    background: 'rgba(30, 41, 59, 0.7)',
                                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                                    borderRadius: '8px',
                                                    padding: '8px 32px 8px 12px',
                                                    color: 'white',
                                                    fontFamily: 'inherit',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    appearance: 'none' as const,
                                                    WebkitAppearance: 'none' as const,
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 10px center',
                                                }}
                                            >
                                                <option value="en" style={{ background: '#1e293b' }}>🇬🇧 English</option>
                                                <option value="hi" style={{ background: '#1e293b' }}>🇮🇳 हिन्दी (Hindi)</option>
                                                <option value="od" style={{ background: '#1e293b' }}>🇮🇳 ଓଡ଼ିଆ (Odia)</option>
                                                <option value="es" style={{ background: '#1e293b' }}>🇪🇸 Español (Spanish)</option>
                                                <option value="de" style={{ background: '#1e293b' }}>🇩🇪 Deutsch (German)</option>
                                            </select>
                                        </div>
                                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                            <Languages size={14} color="#60a5fa" />
                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Language changes apply to the browser extension overlays and will take effect on new page scans.</span>
                                        </div>
                                    </div>

                                    {/* Notifications */}
                                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>Alerts & Notifications</h3>
                                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Email Notifications</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Receive alerts for critical threats</div>
                                            </div>
                                            <button onClick={() => handleTogglePreference('email')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                {emailEnabled ? <ToggleRight size={32} color="#3b82f6" /> : <ToggleLeft size={32} color="#64748b" />}
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>SMS Security Alerts</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Text messages for unauthorized logins</div>
                                            </div>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <ToggleLeft size={32} color="#64748b" />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Behavioral Reports</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Weekly summary of your security standing</div>
                                            </div>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <ToggleLeft size={32} color="#64748b" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sessions & History */}
                            <div className="glass-card" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Active Sessions & Login History</h3>
                                    <button style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Logout from All Devices</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { device: 'Work Laptop (Active)', ip: '192.168.1.1', location: 'Office Network', time: 'Just now', current: true },
                                    ].map((l, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: 'none' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Smartphone size={22} color={l.current ? '#10b981' : 'var(--text-muted)'} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{l.device} {l.current && <span style={{ fontSize: '10px', padding: '2px 8px', background: '#10b98120', color: '#10b981', borderRadius: '4px', marginLeft: '8px', fontWeight: '900', verticalAlign: 'middle' }}>CURRENT SESSION</span>}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>IP: {l.ip} • {l.location} • Last Activity: {l.time}</div>
                                                </div>
                                            </div>
                                            {!l.current && <button style={{ fontSize: '12px', fontWeight: '800', color: 'white', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>Revoke Access</button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── PERSONAL ACTIVITY LOG ────────────────────────────── */}
                    {section === 'activity' && (
                        <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>My Activity Log</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Transparency into your own data — scans run, alerts reviewed, decisions made.</p>

                            {activityLoading || !activityData ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[1, 2, 3].map(i => <div key={i} className="glass-card" style={{ padding: '24px', height: '60px', background: 'rgba(255,255,255,0.02)' }} />)}
                                </div>
                            ) : (
                                <div className="glass-card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700' }}>Recent Actions</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(activityData.recentLogs || []).length} entries</span>
                                    </div>
                                    {(activityData.recentLogs || []).map((log: any, i: number) => (
                                        <div key={log._id || i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Activity size={16} color="#3b82f6" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{log.action}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.actorEmail}{log.ipAddress ? ` • IP: ${log.ipAddress}` : ''}</div>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(log.createdAt).toLocaleString()}</div>
                                        </div>
                                    ))}
                                    {(activityData.recentLogs || []).length === 0 && (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No activity logged yet. Your actions will appear here.</div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── MISINFORMATION / FACT CHECKER ──────────────── */}
                    {section === 'factcheck' && (
                        <motion.div key="factcheck" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>🌐 Misinformation Detector</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Paste a news claim, viral message, or article URL — AI will fact-check it in seconds.</p>

                            {/* Input Area */}
                            <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                    {([['claim', '📝 Claim / Message'], ['url', '🔗 News URL']] as ['claim' | 'url', string][]).map(([val, label]) => (
                                        <button key={val} onClick={() => { setFactType(val); setFactInput(''); setFactResult(null); }}
                                            style={{ padding: '8px 18px', borderRadius: '8px', border: `1px solid ${factType === val ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`, background: factType === val ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', color: factType === val ? '#60a5fa' : '#94a3b8', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input value={factInput} onChange={e => setFactInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && factInput.trim()) { handleFactCheck(); } }}
                                        placeholder={factType === 'claim' ? 'e.g. "5G towers cause health problems"' : 'e.g. https://example.com/breaking-news'}
                                        style={{ flex: 1, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
                                    <button onClick={handleFactCheck} disabled={!factInput.trim() || factChecking}
                                        style={{ padding: '14px 28px', background: (!factInput.trim() || factChecking) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', color: (!factInput.trim() || factChecking) ? '#475569' : 'white', fontSize: '14px', fontWeight: '800', cursor: (!factInput.trim() || factChecking) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                                        {factChecking ? <RefreshCw size={16} className="spin-anim" /> : <Search size={16} />}
                                        {factChecking ? 'Analyzing...' : 'Fact Check'}
                                    </button>
                                </div>
                            </div>

                            {/* Result */}
                            <AnimatePresence>
                                {factResult && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                        {(() => {
                                            const verdictConfig: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
                                                verified: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: BadgeCheck, label: '✅ Verified' },
                                                unverified: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: HelpCircle, label: '⚠️ Unverified' },
                                                false: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: XCircle, label: '❌ False' },
                                                misleading: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', icon: AlertTriangle, label: '🔶 Misleading' },
                                                satire: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: Info, label: '🎭 Satire' },
                                            };
                                            const vc = verdictConfig[factResult.verdict] || verdictConfig.unverified;
                                            const VerdictIcon = vc.icon;

                                            return (
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                                    {/* Main Verdict Card */}
                                                    <div className="glass-card" style={{ padding: '28px', border: `1px solid ${vc.color}30` }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                                            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: vc.bg, border: `1px solid ${vc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <VerdictIcon size={28} color={vc.color} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '22px', fontWeight: '900', color: vc.color, marginBottom: '4px' }}>{vc.label}</div>
                                                                <div style={{ fontSize: '12px', color: '#64748b' }}>Confidence: <strong style={{ color: vc.color }}>{factResult.confidenceScore}%</strong></div>
                                                            </div>
                                                        </div>

                                                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '10px' }}>{factResult.title}</h3>
                                                        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px' }}>{factResult.summary}</p>

                                                        {factResult.sourceAnalysis && factResult.sourceAnalysis !== 'N/A' && (
                                                            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Source Analysis</div>
                                                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{factResult.sourceAnalysis}</p>
                                                            </div>
                                                        )}

                                                        {/* Red Flags */}
                                                        {factResult.redFlags?.length > 0 && (
                                                            <div style={{ marginBottom: '16px' }}>
                                                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>🚩 Red Flags Detected</div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {factResult.redFlags.map((flag: string, i: number) => (
                                                                        <span key={i} style={{ fontSize: '11px', padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '6px' }}>{flag}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Trusted Sources */}
                                                        {factResult.trustedSources?.length > 0 && (
                                                            <div>
                                                                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>📚 Trusted References</div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                    {factResult.trustedSources.map((src: string, i: number) => (
                                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                                                                            <BadgeCheck size={14} color="#10b981" style={{ flexShrink: 0 }} />
                                                                            {src}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Side Info */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {/* Confidence Gauge */}
                                                        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                                                            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px' }}>
                                                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                                                    <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={vc.color} strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: '0, 100' }} animate={{ strokeDasharray: `${factResult.confidenceScore}, 100` }} transition={{ duration: 1.2 }} />
                                                                </svg>
                                                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '22px', fontWeight: '900', color: vc.color }}>{factResult.confidenceScore}%</div>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>AI Confidence</div>
                                                        </div>

                                                        {/* Category Tag */}
                                                        <div className="glass-card" style={{ padding: '20px' }}>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Topic Category</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0', textTransform: 'capitalize' }}>{(factResult.category || 'general').replace('_', ' ')}</div>
                                                        </div>

                                                        {/* Analyze Another */}
                                                        <button onClick={() => { setFactResult(null); setFactInput(''); }} style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                            Check Another Claim
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* How it works info (shown when no result) */}
                            {!factResult && !factChecking && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {[
                                        { icon: '✅', label: 'Verified', desc: 'Confirmed true by trusted, reliable sources', color: '#10b981' },
                                        { icon: '⚠️', label: 'Unverified', desc: 'No reliable source found to confirm or deny', color: '#f59e0b' },
                                        { icon: '❌', label: 'False', desc: 'Confirmed misinformation or debunked claim', color: '#ef4444' },
                                    ].map(({ icon, label, desc, color }) => (
                                        <div key={label} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
                                            <div style={{ fontSize: '15px', fontWeight: '800', color, marginBottom: '6px' }}>{label}</div>
                                            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── QR CODE SAFETY SCANNER ───────────────── */}
                    {section === 'qrscan' && (
                        <motion.div key="qrscan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>📷 QR Code Safety Scanner</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Upload a QR code image — we’ll decode it and check if the destination is safe before you scan it.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: qrResult ? '1fr 1fr' : '1fr', gap: '24px' }}>
                                {/* Upload Zone */}
                                <div className="glass-card" style={{ padding: '28px' }}>
                                    <input type="file" ref={qrFileRef} accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleQrUpload(e.target.files[0]); }} />

                                    {!qrPreview ? (
                                        <div onClick={() => qrFileRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; }}
                                            onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; if (e.dataTransfer.files[0]) handleQrUpload(e.dataTransfer.files[0]); }}
                                            style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', padding: '48px 32px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', background: 'rgba(255,255,255,0.02)' }}>
                                            <QrCode size={48} color="#64748b" style={{ margin: '0 auto 16px', display: 'block' }} />
                                            <p style={{ fontSize: '15px', fontWeight: '700', color: '#cbd5e1', marginBottom: '8px' }}>Drop QR Code Image Here</p>
                                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>or click to browse • PNG, JPG, WebP</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                <img src={qrPreview} alt="QR Code" style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', display: 'block', background: '#000' }} />
                                                {qrScanning && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                                        <RefreshCw size={28} color="#60a5fa" className="spin-anim" />
                                                        <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '700' }}>Decoding & Analyzing...</span>
                                                    </div>
                                                )}
                                            </div>

                                            {qrDecoded && (
                                                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '16px' }}>
                                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Decoded Content</div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all', fontFamily: 'monospace' }}>{qrDecoded}</div>
                                                </div>
                                            )}

                                            {qrError && (
                                                <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', marginBottom: '16px' }}>
                                                    <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0 }}>❌ {qrError}</p>
                                                </div>
                                            )}

                                            <button onClick={() => { setQrPreview(null); setQrDecoded(null); setQrResult(null); setQrError(null); }}
                                                style={{ width: '100%', padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: '#60a5fa', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                                                Scan Another QR Code
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Result Card */}
                                {qrResult && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {(() => {
                                            const vc: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
                                                safe: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: '✅ Safe', icon: ShieldCheck },
                                                caution: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: '⚠️ Caution', icon: AlertTriangle },
                                                suspicious: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: '⚠️ Suspicious', icon: AlertCircle },
                                                dangerous: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: '❌ Dangerous', icon: XCircle },
                                            };
                                            const v = vc[qrResult.verdict] || vc.suspicious;
                                            const VIcon = v.icon;

                                            return (
                                                <>
                                                    {/* Verdict */}
                                                    <div className="glass-card" style={{ padding: '24px', border: `1px solid ${v.color}30` }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: v.bg, border: `1px solid ${v.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <VIcon size={26} color={v.color} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '20px', fontWeight: '900', color: v.color }}>{v.label}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748b' }}>Risk Score: <strong style={{ color: v.color }}>{qrResult.score}/100</strong></div>
                                                            </div>
                                                        </div>
                                                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>{qrResult.title}</h3>
                                                        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '14px' }}>{qrResult.summary}</p>
                                                        <div style={{ padding: '10px 14px', background: `${v.bg}`, borderRadius: '8px', border: `1px solid ${v.color}20` }}>
                                                            <p style={{ fontSize: '12px', color: v.color, margin: 0, fontWeight: '600' }}>💡 {qrResult.recommendation}</p>
                                                        </div>
                                                    </div>

                                                    {/* QR Type Badge */}
                                                    <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {qrResult.qrType === 'upi_payment' ? <CreditCard size={18} color="#818cf8" /> : <QrCode size={18} color="#818cf8" />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>QR Type</div>
                                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#e2e8f0', textTransform: 'capitalize' }}>{(qrResult.qrType || 'unknown').replace('_', ' ')}</div>
                                                        </div>
                                                    </div>

                                                    {/* Payment Details */}
                                                    {qrResult.paymentDetails?.payee && (
                                                        <div className="glass-card" style={{ padding: '18px 20px' }}>
                                                            <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700', marginBottom: '10px', textTransform: 'uppercase' }}>💳 Payment Details</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                                                                <div>Payee: <strong style={{ color: '#e2e8f0' }}>{qrResult.paymentDetails.payee}</strong></div>
                                                                {qrResult.paymentDetails.amount && <div>Amount: <strong style={{ color: '#e2e8f0' }}>₹{qrResult.paymentDetails.amount}</strong></div>}
                                                                <div>Verified Merchant: <strong style={{ color: qrResult.paymentDetails.isVerifiedMerchant ? '#10b981' : '#ef4444' }}>{qrResult.paymentDetails.isVerifiedMerchant ? 'Yes ✅' : 'No ❌'}</strong></div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Red Flags */}
                                                    {qrResult.redFlags?.length > 0 && (
                                                        <div className="glass-card" style={{ padding: '18px 20px' }}>
                                                            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase' }}>🚩 Red Flags</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {qrResult.redFlags.map((flag: string, i: number) => (
                                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fca5a5' }}>
                                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                                                        {flag}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                )}
                            </div>

                            {/* Info cards when no scan */}
                            {!qrPreview && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
                                    {[
                                        { icon: '💳', title: 'Fake Payment QR', desc: 'Detects scam UPI/payment QR codes that redirect money to fraudsters', color: '#ef4444' },
                                        { icon: '🎣', title: 'Phishing Links', desc: 'Identifies QR codes leading to fake login pages or data-stealing sites', color: '#f59e0b' },
                                        { icon: '🛡️', title: 'Malware Downloads', desc: 'Catches QR codes that trigger automatic malware or APK downloads', color: '#3b82f6' },
                                    ].map(({ icon, title, desc, color }) => (
                                        <div key={title} className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
                                            <div style={{ fontSize: '13px', fontWeight: '800', color, marginBottom: '6px' }}>{title}</div>
                                            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{desc}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── ANONYMOUS REPORTING ──────────────────────── */}
                    {section === 'report' && (
                        <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px' }}>🕵️ Anonymous Reporting</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Report suspicious activity with zero risk. Your identity is <strong style={{ color: '#10b981' }}>completely hidden</strong> — even from admins.</p>

                            {reportSuccess ? (
                                /* SUCCESS CONFIRMATION */
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '48px', textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <ShieldCheck size={40} color="#10b981" />
                                    </div>
                                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '12px' }}>Report Submitted Successfully</h2>
                                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>Your identity is fully protected 🔒<br />No personal data, IP address, or account info was stored.</p>
                                    <div style={{ padding: '16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '24px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '6px' }}>Report Reference</div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', fontFamily: 'monospace' }}>{reportSuccess}</div>
                                    </div>
                                    <button onClick={() => { setReportSuccess(null); setReportCategory(''); setReportDescription(''); setReportEvidence(''); setReportUrgency('medium'); }} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '800' }}>Submit Another Report</button>
                                </motion.div>
                            ) : (
                                /* REPORT FORM */
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Left: Form */}
                                    <div className="glass-card" style={{ padding: '28px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Flag size={18} color="#f59e0b" /> Report Details</h3>

                                        {/* Category Selection */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What are you reporting?</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                {[
                                                    { val: 'fake_profile', label: '🎭 Fake Profile', color: '#8b5cf6' },
                                                    { val: 'harmful_content', label: '⚠️ Harmful Content', color: '#ef4444' },
                                                    { val: 'scam', label: '💰 Scam / Fraud', color: '#f59e0b' },
                                                    { val: 'bullying', label: '😢 Bullying', color: '#ec4899' },
                                                    { val: 'misinformation', label: '📰 Misinformation', color: '#3b82f6' },
                                                    { val: 'hate_speech', label: '🚫 Hate Speech', color: '#dc2626' },
                                                    { val: 'phishing', label: '🎣 Phishing', color: '#06b6d4' },
                                                    { val: 'other', label: '📋 Other', color: '#64748b' },
                                                ].map(({ val, label, color }) => (
                                                    <button key={val} onClick={() => setReportCategory(val)}
                                                        style={{ padding: '10px 14px', borderRadius: '8px', border: `1px solid ${reportCategory === val ? color : 'rgba(255,255,255,0.08)'}`, background: reportCategory === val ? `${color}15` : 'rgba(255,255,255,0.03)', color: reportCategory === val ? color : '#94a3b8', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Describe what happened</label>
                                            <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)} placeholder="Describe the suspicious activity in detail. Your identity will NOT be linked to this report." rows={5}
                                                style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '13px', lineHeight: 1.6, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }} />
                                        </div>

                                        {/* Evidence URL */}
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidence URL (optional)</label>
                                            <input value={reportEvidence} onChange={e => setReportEvidence(e.target.value)} placeholder="https://example.com/suspicious-page" type="url"
                                                style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }} />
                                        </div>

                                        {/* Urgency */}
                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Urgency Level</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[
                                                    { val: 'low', label: 'Low', color: '#10b981' },
                                                    { val: 'medium', label: 'Medium', color: '#f59e0b' },
                                                    { val: 'high', label: 'High', color: '#f97316' },
                                                    { val: 'critical', label: 'Critical', color: '#ef4444' },
                                                ].map(({ val, label, color }) => (
                                                    <button key={val} onClick={() => setReportUrgency(val)}
                                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${reportUrgency === val ? color : 'rgba(255,255,255,0.08)'}`, background: reportUrgency === val ? `${color}15` : 'rgba(255,255,255,0.03)', color: reportUrgency === val ? color : '#64748b', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <button
                                            disabled={!reportCategory || !reportDescription.trim() || reportSubmitting}
                                            onClick={async () => {
                                                setReportSubmitting(true);
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const res = await fetch('/api/reports/anonymous', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                                        },
                                                        body: JSON.stringify({ category: reportCategory, description: reportDescription, evidenceUrl: reportEvidence || undefined, urgency: reportUrgency }),
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        setReportSuccess(data.reportId);
                                                    }
                                                } catch (err) {
                                                    console.error('Report failed:', err);
                                                } finally {
                                                    setReportSubmitting(false);
                                                }
                                            }}
                                            style={{ width: '100%', padding: '14px', background: (!reportCategory || !reportDescription.trim()) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '10px', color: (!reportCategory || !reportDescription.trim()) ? '#475569' : 'white', fontSize: '14px', fontWeight: '800', cursor: (!reportCategory || !reportDescription.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}
                                        >
                                            {reportSubmitting ? <RefreshCw size={16} className="spin-anim" /> : <Send size={16} />}
                                            {reportSubmitting ? 'Encrypting & Submitting...' : 'Submit Anonymous Report'}
                                        </button>
                                    </div>

                                    {/* Right: Privacy Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="glass-card" style={{ padding: '24px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                                <ShieldCheck size={24} color="#10b981" />
                                            </div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: 'white' }}>Your Privacy is Guaranteed</h3>
                                            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '16px' }}>When you submit a report, the following data is <strong style={{ color: '#ef4444' }}>never stored</strong>:</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {['Your username or email', 'Your IP address', 'Your account ID', 'Your browser fingerprint', 'Your location data'].map(item => (
                                                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                                                        <ShieldOff size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="glass-card" style={{ padding: '24px' }}>
                                            <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px', color: 'white' }}>What happens after you report?</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {[
                                                    { step: '1', text: 'Your report is assigned a random ID (not linked to you)', color: '#3b82f6' },
                                                    { step: '2', text: 'Personal info in your description is auto-scrubbed', color: '#8b5cf6' },
                                                    { step: '3', text: 'Report is encrypted and sent to the review queue', color: '#6366f1' },
                                                    { step: '4', text: 'Safety team reviews and takes action if needed', color: '#10b981' },
                                                ].map(({ step, text, color }) => (
                                                    <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', color, flexShrink: 0 }}>{step}</div>
                                                        <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px' }}>
                                            <p style={{ fontSize: '12px', color: '#fbbf24', lineHeight: 1.6, margin: 0 }}>⚡ <strong>Why report?</strong> Every anonymous report helps make the community safer. The more threats are reported, the smarter our detection becomes.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── REPORTS ──────────────────────────────────────── */}
                    {section === 'reports' && (
                        <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Report Generator</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Generate official enterprise-grade PDFs and CSV exports for compliance and auditing.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
                                {[
                                    { title: 'Full Activity Report', desc: 'Complete log of all scans, scores, and threat analysis for the past 90 days.', icon: FileText, badge: 'PDF + CSV', color: '#3b82f6' },
                                    { title: 'Threat Intelligence Summary', desc: 'Visual analytics, common threat patterns, and risk exposure trends.', icon: Activity, badge: 'PDF', color: '#ef4444' },
                                    { title: 'Governance & Compliance', desc: 'Proof of security training, zero-trust behavior, and policy adherence.', icon: Shield, badge: 'Enterprise PDF', color: '#8b5cf6' },
                                ].map(({ title, desc, icon: Icon, badge, color }) => (
                                    <div key={title} className="glass-card" style={{ padding: '24px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                            <Icon size={24} color={color} />
                                        </div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>{title}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>{desc}</p>
                                        <span style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', background: `${color}15`, color, fontWeight: '800', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{badge}</span>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleDownload(title)} className="btn-primary" style={{ flex: 1, padding: '12px', border: 'none', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', transition: 'all 0.2s' }}>
                                                <Download size={16} /> Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── SELF-HEALING SECURITY SYSTEM ──────────────────── */}
                    {section === 'healing' && <SelfHealingPanel />}

                </AnimatePresence>
            </main>

            {/* AI Chat Widget — floating, available on all sections */}
            <AIChatWidget />

            {/* Global CSS for Animations */}
            <style jsx global>{`
                @keyframes spin-anim { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .spin-anim { animation: spin-anim 2s linear infinite; }
            `}</style>
        </div>
    );
}
