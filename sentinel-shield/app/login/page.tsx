'use client';
import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Eye, EyeOff, CheckCircle, AlertCircle, Lock, Mail, Building, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INIT_STEPS = [
    'Authenticating credentials...',
    'Verifying MFA token...',
    'Initializing AI modules...',
    'Loading threat intelligence feed...',
    'Establishing secure connection...',
    'Access granted.',
];

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        { label: 'Min 8 chars', pass: password.length >= 8 },
        { label: 'Uppercase', pass: /[A-Z]/.test(password) },
        { label: 'Number', pass: /\d/.test(password) },
        { label: 'Special char', pass: /[!@#$%^&*]/.test(password) },
    ];
    const score = checks.filter(c => c.pass).length;
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    return (
        <div style={{ marginTop: '6px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                        flex: 1, height: '3px', borderRadius: '2px',
                        background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s',
                    }} />
                ))}
            </div>
            <div style={{ fontSize: '11px', color: score > 0 ? colors[score - 1] : 'var(--text-muted)' }}>
                {password ? labels[score - 1] || 'Very Weak' : ''}
                {password && ` · Missing: ${checks.filter(c => !c.pass).map(c => c.label).join(', ')}`}
            </div>
        </div>
    );
}

function InitializationScreen({ onDone }: { onDone: () => void }) {
    const [step, setStep] = useState(0);
    useEffect(() => {
        if (step < INIT_STEPS.length - 1) {
            const t = setTimeout(() => setStep(s => s + 1), 700);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(onDone, 800);
            return () => clearTimeout(t);
        }
    }, [step, onDone]);

    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#050c1a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
        }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                <div style={{
                    width: '80px', height: '80px',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    borderRadius: '20px', margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                }}>
                    <Shield size={40} color="white" />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>SentinelShield AI</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '14px' }}>Initializing secure session...</p>
                <div style={{ textAlign: 'left' }}>
                    {INIT_STEPS.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
                        >
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: i < step ? '#10b981' : i === step ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                flexShrink: 0, transition: 'background 0.3s',
                                boxShadow: i === step ? '0 0 8px #3b82f6' : 'none',
                            }} />
                            <span style={{ fontSize: '13px', color: i <= step ? '#e2e8f0' : '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
                                {s}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LoginContent() {
    const router = useRouter();
    const { login, user, loading: authLoading } = useAuth();
    const params = useSearchParams();
    const verified = params.get('verified') === 'true';
    const initialView = params.get('signup') === 'true' ? 'signup' : 'user';
    const [view, setView] = useState<'user' | 'admin' | 'signup'>(initialView);
    const [prevView, setPrevView] = useState<'user' | 'admin'>('user'); // Which tab triggered signup
    const [showPass, setShowPass] = useState(false);
    const [showInit, setShowInit] = useState(false);
    const [mfaStep, setMfaStep] = useState(false);
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(verified ? 'Email verified! Awaiting admin approval.' : '');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '', mfaCode: '', adminKey: '' });
    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    // Redirect already-authenticated users to their dashboard
    useEffect(() => {
        if (!authLoading && user) {
            const dest = user.role === 'admin' ? '/admin' : user.role === 'moderator' ? '/moderator' : '/viewer';
            router.push(dest);
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email, password: form.password, mfaCode: form.mfaCode }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); setLoading(false); return; }
            if (data.requiresMFA) { setMfaStep(true); setUserId(data.userId); setLoading(false); return; }

            login(data.user);
            const { role } = data.user;
            router.push(role === 'admin' ? '/admin' : role === 'moderator' ? '/moderator' : '/viewer');
        } catch { setError('Network error. Please try again.'); setLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password, orgName: form.orgName, adminKey: form.adminKey }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Signup failed'); setLoading(false); return; }

            if (data.autoLogin && data.user) {
                login(data.user);
                const { role } = data.user;
                router.push(role === 'admin' ? '/admin' : role === 'moderator' ? '/moderator' : '/viewer');
            } else {
                setSuccess('Account created! You can now log in.');
                setView('user');
            }
        } catch { setError('Network error. Please try again.'); }
        setLoading(false);
    };

    return (
        <>
            {showInit && <InitializationScreen onDone={() => { }} />}

            <div style={{ minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>

                {/* ── LEFT HERO PANEL ─────────────────────────────────────── */}
                <div className="login-hero-panel" style={{ flex: '0 0 55%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/login-bg.jpg" alt="SentinelShield Cybersecurity"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(3,10,25,0.78) 0%, rgba(3,10,25,0.45) 60%, rgba(3,10,25,0.88) 100%)' }} />

                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
                        style={{ position: 'relative', zIndex: 2, padding: '48px', maxWidth: '520px', width: '100%' }}>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
                            <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
                                <Shield size={28} color="white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>SentinelShield</div>
                                <div style={{ fontSize: '11px', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>AI Defense Platform</div>
                            </div>
                        </div>

                        <h1 style={{ fontSize: '38px', fontWeight: '900', color: 'white', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                            Enterprise-Grade<br />
                            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Cyber Intelligence
                            </span>
                        </h1>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: '36px' }}>
                            Real-time AI threat detection, automated self-healing and multi-layer protection — all in one platform.
                        </p>

                        {[
                            { icon: '🤖', text: 'AI-powered threat scanner with Gemini' },
                            { icon: '⚡', text: 'Auto self-healing: block IPs, secure accounts' },
                            { icon: '🔍', text: 'URL, text, QR & file analysis in real-time' },
                            { icon: '🛡️', text: 'SOC 2 compliant · GDPR ready · Zero-trust' },
                        ].map(f => (
                            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{f.icon}</div>
                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f.text}</span>
                            </div>
                        ))}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '36px', flexWrap: 'wrap' }}>
                            {['SOC 2', 'GDPR', 'ISO 27001', 'OWASP Top 10'].map(badge => (
                                <span key={badge} style={{ padding: '5px 13px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.08)', color: '#60a5fa', fontSize: '11px', fontWeight: 700 }}>{badge}</span>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT FORM PANEL ─────────────────────────────────────── */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto', minWidth: 0 }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px' }}>
                        {/* Logo */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                borderRadius: '16px', margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)',
                            }}>
                                <Shield size={32} color="white" />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>SentinelShield AI</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Enterprise Threat Intelligence Platform</p>
                        </div>

                        {/* Card */}
                        <div className="glass-card" style={{ padding: '32px' }}>
                            {/* Tabs */}
                            {view !== 'signup' && (
                                <div style={{ display: 'flex', background: 'rgba(10,22,40,0.6)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
                                    {['User Login', 'Admin Login'].map((tab) => {
                                        const tabValue = tab === 'User Login' ? 'user' : 'admin';
                                        return (
                                            <button key={tab} onClick={() => { setView(tabValue); setError(''); setSuccess(''); }}
                                                style={{
                                                    flex: 1, padding: '8px', border: 'none', cursor: 'pointer', borderRadius: '7px', fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', transition: 'all 0.2s',
                                                    background: view === tabValue ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'transparent',
                                                    color: view === tabValue ? 'white' : 'var(--text-muted)',
                                                }}>
                                                {tab}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {view === 'signup' && (
                                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                                        {prevView === 'admin' ? '🛡 Admin Account Setup' : '👤 Create an Account'}
                                    </h2>
                                    {prevView === 'admin' && (
                                        <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px' }}>Requires the Admin Secret Key to get admin privileges.</p>
                                    )}
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {success && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#10b981', fontSize: '13px' }}>
                                        <CheckCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> {success}
                                    </motion.div>
                                )}
                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#ef4444', fontSize: '13px' }}>
                                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {mfaStep ? (
                                <form onSubmit={handleLogin}>
                                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                        <Lock size={36} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter your 6-digit authenticator code</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                                        <input className="input" value={form.mfaCode} onChange={e => set('mfaCode', e.target.value)}
                                            placeholder="000000" maxLength={6} style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '20px', fontFamily: 'JetBrains Mono, monospace', width: '160px' }} />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                                        {loading ? 'Verifying...' : 'Verify & Login'}
                                    </button>
                                </form>
                            ) : view === 'signup' ? (
                                <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { key: 'name', label: 'Full Name', icon: User, placeholder: 'John Smith', type: 'text' },
                                        { key: 'email', label: 'Email Address', icon: Mail, placeholder: 'you@company.com', type: 'email' },
                                        ...(prevView === 'admin' ? [
                                            { key: 'orgName', label: 'Organization Name', icon: Building, placeholder: 'Acme Corp', type: 'text' },
                                            { key: 'adminKey', label: 'Admin Secret Key', icon: Lock, placeholder: 'Enter admin secret key', type: 'password' },
                                        ] : []),
                                    ].map(({ key, label, icon: Icon, placeholder, type }) => (
                                        <div key={key}>
                                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                                            <div style={{ position: 'relative' }}>
                                                <Icon size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input className="input" type={type} placeholder={placeholder} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} style={{ paddingLeft: '36px' }} required={key !== 'adminKey'} />
                                            </div>
                                        </div>
                                    ))}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingLeft: '36px', paddingRight: '44px' }} required />
                                            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        {form.password && <PasswordStrength password={form.password} />}
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
                                        {loading ? 'Creating Account...' : 'Create Account →'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} style={{ paddingLeft: '36px' }} required />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input className="input" type={showPass ? 'text' : 'password'} placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingLeft: '36px', paddingRight: '44px' }} required />
                                            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                                        {loading ? 'Signing In...' : (view === 'admin' ? 'Admin Sign In →' : 'User Sign In →')}
                                    </button>
                                </form>
                            )}

                            {/* Footer Link toggle */}
                            {view !== 'signup' ? (
                                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        Don't have an account?{' '}
                                        <button onClick={() => { setPrevView(view as 'user' | 'admin'); setView('signup'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>Sign Up</button>
                                    </p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        Already have an account?{' '}
                                        <button onClick={() => { setView(prevView); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }}>Log In</button>
                                    </p>
                                </div>
                            )}
                        </div>

                        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>
                            🛡 Privacy-first · All content analyzed anonymously
                        </p>
                    </motion.div>
                </div>{/* end right panel */}
            </div>{/* end flex container */}

            <style jsx global>{`
                @media (max-width: 860px) { .login-hero-panel { display: none !important; } }
            `}</style>
        </>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-muted)' }}>Loading...</p></div>}>
            <LoginContent />
        </Suspense>
    );
}
