'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Play, Terminal, CheckCircle2, ChevronDown, Copy } from 'lucide-react';

export default function PlaygroundPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [lang, setLang] = useState<'Rest' | 'Python' | 'Node.js' | 'cURL'>('Rest');
    const [type, setType] = useState<'text' | 'url' | 'image'>('text');
    const [payload, setPayload] = useState('{"type": "text", "content": "You have won a free iPhone! Click here to wire transfer the shipping fee: foo@bar.com."}');
    const [result, setResult] = useState('');
    const [isCalling, setIsCalling] = useState(false);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    useEffect(() => {
        if (type === 'text') setPayload('{\n  "type": "text",\n  "content": "You have won a free iPhone! Click here to wire transfer the shipping fee: foo@bar.com."\n}');
        else if (type === 'url') setPayload('{\n  "type": "url",\n  "content": "http://192.168.1.1/paypal-secure-login"\n}');
        else setPayload('{\n  "type": "image",\n  "filename": "deepfake_video123.mp4"\n}');
    }, [type]);

    const runTest = async () => {
        setIsCalling(true);
        setResult('Sending request...');
        try {
            const parsed = JSON.parse(payload);
            const res = await fetch('/api/threats/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
            const data = await res.json();
            setResult(JSON.stringify(data, null, 2));
        } catch {
            setResult('Error: Invalid JSON payload or network failure.');
        }
        setIsCalling(false);
    };

    const getSnippets = () => {
        const url = 'https://api.sentinelshield.ai/v1/analyze';
        if (lang === 'cURL') return `curl -X POST ${url} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '${payload.replace(/\n/g, '')}'`;
        if (lang === 'Python') return `import requests\n\nurl = "${url}"\nheaders = { "Authorization": "Bearer YOUR_API_KEY" }\npayload = ${payload}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`;
        if (lang === 'Node.js') return `const axios = require('axios');\n\nconst response = await axios.post('${url}', ${payload},\n  { headers: { Authorization: 'Bearer YOUR_API_KEY' } }\n);\nconsole.log(response.data);`;
        return payload; // Rest JSON
    };

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Code2 size={24} color="var(--accent-blue)" /> API Developer Playground
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Test the AI threat engine live and view integration payloads</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Request Side */}
                    <motion.div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)' }}>
                            {['Rest', 'Python', 'Node.js', 'cURL'].map(l => (
                                <button key={l} onClick={() => setLang(l as any)} style={{ flex: 1, padding: '12px', border: 'none', background: lang === l ? 'rgba(59,130,246,0.1)' : 'transparent', color: lang === l ? '#60a5fa' : 'var(--text-muted)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderBottom: lang === l ? '2px solid #3b82f6' : '2px solid transparent' }}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '20px', flex: 1 }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginTop: '8px' }}>TYPE:</span>
                                {(['text', 'url', 'image'] as const).map(t => (
                                    <button key={t} onClick={() => setType(t)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: type === t ? 'rgba(59,130,246,0.15)' : 'transparent', color: type === t ? 'var(--accent-blue)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}>
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {lang === 'Rest' ? (
                                <>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>JSON PAYLOAD</label>
                                    <textarea className="input" style={{ height: '200px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', backgroundColor: 'rgba(0,0,0,0.4)' }} value={payload} onChange={e => setPayload(e.target.value)} />
                                </>
                            ) : (
                                <>
                                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>CODE SNIPPET</span>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => navigator.clipboard.writeText(getSnippets())}><Copy size={12} /> Copy</button>
                                    </label>
                                    <pre className="code-block" style={{ height: '200px', margin: 0 }}>{getSnippets()}</pre>
                                </>
                            )}
                        </div>

                        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'rgba(59,130,246,0.05)' }}>
                            <button className="btn-primary" onClick={runTest} disabled={isCalling} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px' }}>
                                <Play size={16} fill="currentColor" /> {isCalling ? 'Executing via API...' : 'Run Analysis ⌘⏎'}
                            </button>
                        </div>
                    </motion.div>

                    {/* Response Side */}
                    <motion.div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Terminal size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>JSON RESPONSE</span>
                            {result && !isCalling && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> 200 OK — 142ms</span>}
                        </div>
                        <div style={{ padding: '20px', flex: 1, position: 'relative' }}>
                            {result ? (
                                <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#a78bfa', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                    {result.split('\n').map((line, i) => {
                                        if (line.includes('"riskScore"')) {
                                            const match = line.match(/(\d+)/);
                                            const score = match ? parseInt(match[0]) : 0;
                                            const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f59e0b' : score >= 30 ? '#3b82f6' : '#10b981';
                                            return <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\d+/, `<span style="color: ${color}; font-weight: bold; background: rgba(255,255,255,0.1); padding: 0 4px; border-radius: 4px;">$&</span>`) }} />;
                                        }
                                        if (line.includes('"anonymizedContent"') || line.includes('"redactedFields"')) {
                                            return <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/(\[[^\]]+\])/g, `<span style="color: #10b981;">$1</span>`) }} />;
                                        }
                                        return <div key={i}>{line}</div>;
                                    })}
                                </pre>
                            ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <Terminal size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                    <p style={{ fontSize: '13px' }}>Click "Run Analysis" to see API response</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
