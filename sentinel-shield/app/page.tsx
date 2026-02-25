'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Shield, Lock, Activity, Eye, Zap, ArrowRight, CheckCircle2, Users, BarChart3, Bell, Globe, ChevronRight, Terminal, Server, Cpu } from 'lucide-react';
import BlurText from '@/components/BlurText';
import { useEffect, useState } from 'react';

/* ─── Isolated Navbar (own scroll state) ─────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '18px 60px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      background: scrolled ? 'rgba(5,12,26,0.85)' : 'transparent',
      borderBottom: scrolled ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(59,130,246,0.4)',
        }}>
          <Shield size={22} color="white" />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>SentinelShield</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
        {['Platform', 'Pricing'].map(label => (
          <a key={label} href={`#${label.toLowerCase().replace(' ', '-')}`}
            style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
          >{label}</a>
        ))}
        <Link href="/login" style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Sign In</Link>
        <Link href="/login?signup=true" style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Sign Up</Link>
      </div>
    </nav>
  );
}

/* ─── Live Threat Terminal (isolated state) ──────────────────────────── */
function LiveThreatTerminal() {
  const [logs, setLogs] = useState<{ id: number; time: string; ip: string; type: string; level: string }[]>([]);

  useEffect(() => {
    let id = 0;
    const types = ['SQL Injection Attempt', 'Credential Stuffing', 'Malicious Payload', 'Zero-Day Signature', 'DDoS Pattern Detected'];
    const levels = ['CRITICAL', 'HIGH', 'BLOCKED'];
    const interval = setInterval(() => {
      id++;
      setLogs(prev => [{
        id,
        time: new Date().toISOString().split('T')[1].substring(0, 11),
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        type: types[Math.floor(Math.random() * types.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
      }, ...prev].slice(0, 5));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const levelColor = (l: string) => l === 'CRITICAL' ? '#ef4444' : l === 'HIGH' ? '#f59e0b' : '#3b82f6';

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: '520px',
      background: 'rgba(5,12,26,0.9)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px',
      padding: '32px', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px',
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
    }}>
      {/* Gradient top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
          <Terminal size={14} />
          <span>live-threat-feed.sh</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(239,68,68,0.4)', border: '1px solid rgba(239,68,68,0.6)' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(245,158,11,0.4)', border: '1px solid rgba(245,158,11,0.6)' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(16,185,129,0.5)', border: '1px solid rgba(16,185,129,0.7)' }} />
        </div>
      </div>

      {/* Log entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {logs.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)' }}>Waiting for network traffic...</div>}
        {logs.map(log => (
          <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>[{log.time}]</span>
            <span style={{ color: '#22d3ee', flexShrink: 0 }}>{log.ip}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', flex: 1 }}>{log.type}</span>
            <span style={{
              flexShrink: 0, padding: '2px 10px', borderRadius: '4px',
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              background: `${levelColor(log.level)}22`, color: levelColor(log.level),
              border: `1px solid ${levelColor(log.level)}44`,
            }}>{log.level === 'BLOCKED' ? 'BLOCKED' : 'DETECTED'}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Features data ──────────────────────────────────────────────────── */
const features = [
  { icon: Activity, title: 'Autonomous Defense', desc: 'AI-driven scanning neutralizes threats across text, URLs, and files before they reach your network edge.' },
  { icon: Lock, title: 'Zero-Trust Pipeline', desc: 'End-to-end encryption with instantaneous PII redacting, ensuring rigorous compliance and data privacy.' },
  { icon: Globe, title: 'Global Threat Graph', desc: 'Visualize attack vectors on an interactive world map to identify coordinated attacks by origin subnet.' },
  { icon: Eye, title: 'Visual Rule Builder', desc: 'Construct highly complex, multi-conditional detection logic using our intuitive, drag-and-drop UI.' },
  { icon: Bell, title: 'Adaptive Incident Response', desc: 'Automated playbooks, instant SLA-breach warnings, and integrations into Slack, Teams, and PagerDuty.' },
  { icon: BarChart3, title: 'Predictive Forensics', desc: 'Analyze 90 days of telemetry to forecast emerging threat patterns with up to 94% accuracy.' },
];

/* ─── Stats data ─────────────────────────────────────────────────────── */
const stats = [
  { value: '1.4M+', label: 'Threats Blocked Today' },
  { value: '< 4ms', label: 'Average Response' },
  { value: '24', label: 'ML Models Active' },
  { value: '0.01%', label: 'False Positive Rate' },
];

/* ─── Main Page Component (stateless, no re-render issues) ───────────── */
export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#e2e8f0', overflowX: 'hidden' }}>

      {/* ── Spline 3D Background ────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <iframe
          src="https://my.spline.design/claritystream-DCskGTBw53iYoDxyE11d9QFw/"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Spline 3D Background"
        />
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,7,18,0.5)', pointerEvents: 'none' }} />
      </div>

      <Navbar />

      {/* ════════════════════════════════════════════════════════════
           HERO SECTION
         ════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '160px 60px 100px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          maxWidth: '1300px', margin: '0 auto', width: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center',
        }}>

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '8px 18px', borderRadius: '999px', marginBottom: '36px',
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px #22d3ee' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#22d3ee', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                Sentinel AI Engine v3.0 Active
              </span>
            </div>

            {/* Headline */}
            <div style={{ marginBottom: '32px' }}>
              <BlurText
                text="SentinelGrid"
                delay={150}
                animateBy="words"
                direction="top"
                className="text-white text-6xl md:text-7xl font-black tracking-tight pb-2"
              />
              <BlurText
                text="Unified Social Media & Cyber Threat Intelligence Platform"
                delay={200}
                animateBy="words"
                direction="top"
                className="text-blue-400 text-xl md:text-2xl font-bold leading-snug mt-4"
              />
            </div>

            {/* Subtext */}
            <p style={{ fontSize: '19px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '48px', maxWidth: '540px' }}>
              Advanced multimodal threat intelligence platform. Anonymize PII instantly, detect zero-day exploits in real-time, and automate remediation using proprietary ML models.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' as const }}>
              <Link href="/login?signup=true" style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
                background: 'white', color: '#0f172a', textDecoration: 'none',
                boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
                transition: 'transform 0.2s',
              }}>
                Get Started <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>

          {/* Right: Live Terminal — 3D Tilted, straightens on hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            style={{ position: 'relative', perspective: '1200px' }}
          >
            {/* 3D tilt container — tilted left by default, straightens on hover */}
            <div
              style={{
                transform: 'rotateY(-12deg) rotateX(4deg)',
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                transformStyle: 'preserve-3d' as const,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'rotateY(-12deg) rotateX(4deg)'; }}
            >
              {/* Floating bobbing wrapper */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <LiveThreatTerminal />
              </motion.div>
            </div>

            {/* Glow behind terminal */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px',
              background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none', zIndex: -1,
            }} />
            <div style={{
              position: 'absolute', bottom: '-30px', left: '-30px', width: '250px', height: '250px',
              background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none', zIndex: -1,
            }} />

            {/* Floating side icons */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{
                position: 'absolute', top: '25%', right: '-60px',
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <Server size={22} color="#60a5fa" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{
                position: 'absolute', top: '55%', right: '-55px',
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(139,92,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <Cpu size={22} color="#a78bfa" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
              style={{
                position: 'absolute', bottom: '15%', left: '-50px',
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(10,22,40,0.9)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(6,182,212,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <Zap size={20} color="#22d3ee" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
           STATS BAR
         ════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: '48px 60px', position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(59,130,246,0.1)', borderBottom: '1px solid rgba(59,130,246,0.1)',
        background: 'rgba(59,130,246,0.03)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: '40px', fontWeight: 900, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
           FEATURES SECTION
         ════════════════════════════════════════════════════════════ */}
      <section id="platform" style={{ padding: '120px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Intelligence at{' '}
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Scale
              </span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              A complete threat intelligence suite built for enterprise security teams. Unparalleled visibility and autonomous defense.
            </p>
          </div>

          {/* Feature cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px' }}>
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={feat.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  style={{
                    padding: '36px', borderRadius: '24px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.12)',
                    transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
                  }}>
                    <Icon size={26} color="#60a5fa" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>{feat.title}</h3>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
           PRICING SECTION
         ════════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '120px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '8px 18px', borderRadius: '999px', marginBottom: '24px',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <Zap size={14} color="#34d399" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                Business Model & Pricing
              </span>
            </div>
            <h2 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '20px' }}>
              Security for{' '}
              <span style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Every Scale
              </span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              Choose the protection tier that fits your organization. From individual users to global enterprises — we&apos;ve got you covered.
            </p>
          </div>

          {/* Pricing cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', alignItems: 'stretch' }}>

            {/* ── STARTER TIER ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0 }}
              style={{
                padding: '40px 36px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column' as const, transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Starter</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>Free</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', lineHeight: 1.6 }}>
                Perfect for individuals exploring online safety and threat awareness.
              </p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '32px' }}>
                {[
                  '10 URL/Text scans per day',
                  'Basic threat detection',
                  'Browser extension access',
                  'Community threat intelligence',
                  'Email security alerts',
                ].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{feat}</span>
                  </div>
                ))}
              </div>
              <Link href="/login?signup=true" style={{
                display: 'block', textAlign: 'center' as const, padding: '14px 0',
                borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'white', textDecoration: 'none', transition: 'all 0.3s',
              }}>
                Get Started Free
              </Link>
            </motion.div>

            {/* ── PROFESSIONAL TIER (HIGHLIGHTED) ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1 }}
              style={{
                padding: '40px 36px', borderRadius: '24px', position: 'relative' as const,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.05))',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', flexDirection: 'column' as const, transition: 'transform 0.3s, box-shadow 0.3s',
                boxShadow: '0 0 60px rgba(59,130,246,0.1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 0 80px rgba(59,130,246,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(59,130,246,0.1)'; }}
            >
              {/* Most Popular badge */}
              <div style={{
                position: 'absolute' as const, top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', padding: '6px 24px',
                borderRadius: '999px', fontSize: '11px', fontWeight: 800, color: 'white',
                letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
              }}>
                ⭐ Most Popular
              </div>
              {/* Top glow line */}
              <div style={{ position: 'absolute' as const, top: 0, left: '15%', right: '15%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />

              <div style={{ fontSize: '13px', fontWeight: 800, color: '#22d3ee', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Professional</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>$29</span>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>/month</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', lineHeight: 1.6 }}>
                For security-conscious teams and professionals who need advanced protection.
              </p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '32px' }}>
                {[
                  'Unlimited AI-powered scans',
                  'Real-time download scanner',
                  'Dark pattern detection',
                  'QR code threat analysis',
                  'Misinformation / Fact checker',
                  'Priority threat intelligence feed',
                  'Multi-language support (5 langs)',
                  'PDF & CSV security reports',
                  'Dedicated email support',
                ].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#22d3ee" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{feat}</span>
                  </div>
                ))}
              </div>
              <Link href="/login?signup=true" style={{
                display: 'block', textAlign: 'center' as const, padding: '14px 0',
                borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: 'white',
                textDecoration: 'none', transition: 'all 0.3s',
                boxShadow: '0 4px 30px rgba(59,130,246,0.3)',
              }}>
                Start 14-Day Free Trial <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
              </Link>
            </motion.div>

            {/* ── ENTERPRISE TIER ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{
                padding: '40px 36px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', flexDirection: 'column' as const, transition: 'border-color 0.3s, transform 0.3s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '12px' }}>Enterprise</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>Custom</span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', lineHeight: 1.6 }}>
                Tailored solutions for organizations with advanced security compliance needs.
              </p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '14px', marginBottom: '32px' }}>
                {[
                  'Everything in Professional',
                  'Custom ML model training',
                  'On-premise deployment option',
                  'Role-based admin dashboard',
                  'SIEM & SOC integrations',
                  'Audit logs & compliance reports',
                  'Dedicated account manager',
                  '24/7 priority support & SLA',
                  'Custom API rate limits',
                ].map(feat => (
                  <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{feat}</span>
                  </div>
                ))}
              </div>
              <Link href="/login" style={{
                display: 'block', textAlign: 'center' as const, padding: '14px 0',
                borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#c4b5fd', textDecoration: 'none', transition: 'all 0.3s',
              }}>
                Contact Sales <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
              </Link>
            </motion.div>
          </div>

          {/* Bottom trust note */}
          <div style={{ textAlign: 'center' as const, marginTop: '48px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' as const }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={13} /> SOC 2 Compliant</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={13} /> GDPR Ready</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={13} /> No Credit Card Required</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={13} /> Cancel Anytime</span>
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
           CTA SECTION
         ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto', borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.08))',
          border: '1px solid rgba(59,130,246,0.2)', padding: '80px 60px',
          textAlign: 'center' as const, position: 'relative', overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Top glow line */}
          <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />
          <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '300px', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

          <Users size={48} color="#3b82f6" style={{ margin: '0 auto 28px' }} />
          <h2 style={{ fontSize: '44px', fontWeight: 900, color: 'white', marginBottom: '20px', letterSpacing: '-0.02em' }}>
            Ready to secure your perimeter?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', maxWidth: '540px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Join elite security teams using SentinelShield to protect their most sensitive assets and outmaneuver modern threats.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link href="/login?signup=true" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: 'white', textDecoration: 'none',
              boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)',
            }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', textDecoration: 'none',
            }}>
              Admin Login <Shield size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
           FOOTER
         ════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 60px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color="white" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>SentinelShield</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                AI-powered enterprise threat intelligence. Protecting organizations with explainable AI and privacy-first design.
              </p>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>Product</div>
              {['Threat Scanner', 'Rule Engine', 'AI Performance', 'Incident Timeline', 'Privacy Controls'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >{item}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>Resources</div>
              {['Documentation', 'API Reference', 'Security Blog', 'Compliance Guide', 'Changelog'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >{item}</a>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '16px' }}>Company</div>
              {['About Us', 'Careers', 'Contact', 'Partners', 'Trust Center'].map(item => (
                <a key={item} href="#" style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >{item}</a>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(6,182,212,0.3), transparent)', marginBottom: '24px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              © {new Date().getFullYear()} SentinelShield AI. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: '24px' }}>
              {['Privacy Policy', 'Terms of Service', 'Cookie Settings', 'System Status'].map(label => (
                <a key={label} href="#" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                >{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
