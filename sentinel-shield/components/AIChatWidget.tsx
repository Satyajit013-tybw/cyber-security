'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User, Sparkles, Shield, Loader2, Minimize2, Trash2 } from 'lucide-react';

interface Msg {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    time: string;
    streaming?: boolean;
}

const WELCOME: Msg = {
    id: 'welcome',
    role: 'assistant',
    text: "👋 **Hi! I'm Shield AI**, your real-time cybersecurity assistant.\n\nI have access to your **live threat data**, recent alerts, and self-healing actions. Ask me anything:",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Msg[]>([WELCOME]);
    const [loading, setLoading] = useState(false);
    const [pulse, setPulse] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (open) setPulse(false);
    }, [open]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading) return;

        const userMsg: Msg = {
            id: Date.now().toString(),
            role: 'user',
            text: input.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const question = input.trim();
        setInput('');
        setLoading(true);

        // Build history (exclude welcome message)
        const history = messages
            .filter(m => m.id !== 'welcome')
            .map(m => ({ role: m.role, text: m.text }));

        setMessages(prev => [...prev, userMsg]);

        // Placeholder streaming message
        const assistantId = (Date.now() + 1).toString();
        const assistantMsg: Msg = {
            id: assistantId,
            role: 'assistant',
            text: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            streaming: true,
        };
        setMessages(prev => [...prev, assistantMsg]);

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            // Abort any previous request
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ message: question, history }),
                signal: abortRef.current.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error('Bad response');
            }

            // Read the stream
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Update streaming message in real-time
                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, text: fullText, streaming: true } : m
                ));
            }

            // Mark as done
            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, text: fullText || '...', streaming: false } : m
            ));
        } catch (err: any) {
            if (err?.name === 'AbortError') return;
            setMessages(prev => prev.map(m =>
                m.id === assistantId
                    ? { ...m, text: '⚠️ Connection error. Please try again.', streaming: false }
                    : m
            ));
        }
        setLoading(false);
    }, [input, loading, messages]);

    const clearChat = () => {
        abortRef.current?.abort();
        setMessages([WELCOME]);
        setLoading(false);
    };

    const suggestions = [
        'Explain my latest threat scan',
        'Any active security alerts?',
        'What self-healing actions ran?',
        'How does the AI scanner work?',
    ];

    // Simple markdown renderer
    const renderMarkdown = (text: string) =>
        text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(59,130,246,0.15);padding:1px 6px;border-radius:4px;font-size:11px;font-family:monospace">$1</code>')
            .replace(/\n/g, '<br />');

    return (
        <>
            {/* Floating Action Button */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        onClick={() => setOpen(true)}
                        style={{
                            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(59,130,246,0.5)',
                        }}
                    >
                        <MessageSquare size={26} color="white" />
                        {pulse && (
                            <span style={{
                                position: 'absolute', inset: '-6px', borderRadius: '50%',
                                border: '2px solid rgba(59,130,246,0.5)',
                                animation: 'chatPulse 2s ease-out infinite',
                            }} />
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        style={{
                            position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
                            width: '440px', height: '600px', borderRadius: '20px',
                            overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            background: 'rgba(8,15,30,0.97)', backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(59,130,246,0.08)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(6,182,212,0.06))',
                            borderBottom: '1px solid rgba(59,130,246,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                                }}>
                                    <Shield size={20} color="white" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        Shield AI <Sparkles size={13} color="#f59e0b" />
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: loading ? '#f59e0b' : '#10b981', display: 'inline-block', transition: 'background 0.3s' }} />
                                        {loading ? 'Analyzing your data...' : 'Live data connected'}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={clearChat} title="Clear chat"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Trash2 size={14} color="rgba(255,255,255,0.4)" />
                                </button>
                                <button onClick={() => setOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <Minimize2 size={14} color="rgba(255,255,255,0.4)" />
                                </button>
                            </div>
                        </div>

                        {/* Live data badge */}
                        <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.04)', borderBottom: '1px solid rgba(16,185,129,0.08)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['📊 Real Scan Data', '🚨 Live Alerts', '⚡ Self-Healing Log'].map(badge => (
                                <span key={badge} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }}>{badge}</span>
                            ))}
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '8px', alignItems: 'flex-start' }}
                                >
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
                                        background: msg.role === 'assistant' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {msg.role === 'assistant' ? <Bot size={15} color="white" /> : <User size={15} color="rgba(255,255,255,0.6)" />}
                                    </div>
                                    <div style={{
                                        maxWidth: '82%',
                                        padding: '11px 14px',
                                        borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                        background: msg.role === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.04)',
                                        border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                        color: 'white', fontSize: '13px', lineHeight: 1.65,
                                    }}>
                                        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
                                        {/* Streaming cursor */}
                                        {msg.streaming && (
                                            <span style={{ display: 'inline-block', width: '2px', height: '14px', background: '#3b82f6', marginLeft: '2px', animation: 'blink 0.8s step-end infinite', verticalAlign: 'text-bottom' }} />
                                        )}
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>{msg.time}</div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading dots (before streaming starts) */}
                            {loading && messages[messages.length - 1]?.text === '' && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: '36px' }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick suggestions */}
                        {messages.length <= 2 && (
                            <div style={{ padding: '0 14px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {suggestions.map(s => (
                                    <button key={s} onClick={() => setInput(s)}
                                        style={{ padding: '5px 11px', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.05)', color: '#60a5fa', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder="Ask about threats, IPs, scans..."
                                style={{ flex: 1, padding: '11px 15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', fontSize: '13px', fontFamily: 'inherit', outline: 'none' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '12px', border: 'none', flexShrink: 0,
                                    background: input.trim() && !loading ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'rgba(255,255,255,0.05)',
                                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                }}
                            >
                                <Send size={16} color={input.trim() && !loading ? 'white' : '#475569'} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes chatPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes dotBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            `}</style>
        </>
    );
}
