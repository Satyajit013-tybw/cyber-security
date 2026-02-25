'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, ChartBar } from 'lucide-react';

interface ForecastData { date: string; count?: number; projected?: number; }

const DEMO_FORECAST: ForecastData[] = [];
for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - (90 - i));
    DEMO_FORECAST.push({ date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 20) + 5 });
}
const lastCount = DEMO_FORECAST[89].count!;
for (let i = 1; i <= 30; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    DEMO_FORECAST.push({ date: d.toISOString().split('T')[0], projected: Math.round(lastCount + i * 0.5 + Math.random() * 5 - 2) });
}

export default function ForecastPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<ForecastData[]>(DEMO_FORECAST);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchForecast = useCallback(async () => {
        try {
            const res = await fetch('/api/forecast');
            if (res.ok) {
                const json = await res.json();
                if (json.historical?.length > 0) {
                    const combined = [
                        ...json.historical.map((d: any) => ({ date: d._id, count: d.count })),
                        ...json.forecast.map((d: any) => ({ date: d.date, projected: d.projected }))
                    ];
                    setData(combined);
                }
            }
        } catch { /* use demo */ }
    }, []);

    useEffect(() => { fetchForecast(); }, [fetchForecast]);

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>📈 Threat Forecasting</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Predictive AI analysis of historical threat data</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px' }}><TrendingUp size={24} color="#3b82f6" /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Next 30 Days</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>+14.2%</div>
                            <div style={{ fontSize: '12px', color: '#10b981' }}>Expected increase in volume</div>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px' }}><AlertTriangle size={24} color="#ef4444" /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Primary Risk Vector</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Phishing</div>
                            <div style={{ fontSize: '12px', color: '#ef4444' }}>High likelihood of campaign</div>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px' }}><ChartBar size={24} color="#10b981" /></div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>historical data</div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>90 Days</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Analyzed for projection</div>
                        </div>
                    </div>
                </div>

                <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>Time-Series Projection</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val: string) => { const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ background: '#0d1e3d', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="count" name="Historical Threats" fill="rgba(59,130,246,0.6)" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="projected" name="AI Forecast" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </motion.div>
            </main>
        </div>
    );
}
