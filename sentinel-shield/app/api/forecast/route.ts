import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

function generateHistorical(days: number) {
    const data = [];
    for (let i = days; i >= 1; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const base = 8;
        const trend = (days - i) * 0.08; // slight upward trend
        const noise = (Math.random() - 0.5) * 4;
        const count = Math.max(1, Math.round(base + trend + noise));
        const avgScore = Math.round(45 + trend * 2 + (Math.random() - 0.5) * 15);
        data.push({ _id: dateStr, count, avgScore });
    }
    return data;
}

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    const historical = generateHistorical(90);
    const recent = historical.slice(-14);
    const avgPerDay = recent.reduce((s, d) => s + d.count, 0) / recent.length;
    const trend = (recent[recent.length - 1].count - recent[0].count) / recent.length;

    const forecast = [];
    for (let i = 1; i <= 30; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const projected = Math.max(0, Math.round(avgPerDay + trend * i + (Math.random() - 0.5) * 2));
        forecast.push({ date: dateStr, projected, isForecast: true });
    }

    return NextResponse.json({ historical, forecast });
}
