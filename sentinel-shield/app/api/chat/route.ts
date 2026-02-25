import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getTokenFromRequest } from '@/lib/auth-helpers';
import { verifyToken } from '@/lib/jwt';
import connectDB from '@/lib/db';
import { Threat } from '@/models/Threat';
import { Alert } from '@/models/Alert';
import { getSelfHealingLog } from '@/lib/healing-log';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
    // Validate auth
    const token = getTokenFromRequest(req);
    if (!token) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let user: any;
    try {
        user = verifyToken(token);
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    const { message, history = [] } = await req.json();
    if (!message?.trim()) {
        return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // ── Fetch real-time context from database ──────────────────────────
    let recentThreats = '';
    let recentAlerts = '';

    try {
        await connectDB();

        // Fetch last 10 threats for this user
        const threats = await (Threat as any).find({ userId: user.id || user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('type score content categories explanation createdAt')
            .lean();

        if (threats.length > 0) {
            recentThreats = threats.map((t: any) =>
                `[${new Date(t.createdAt).toLocaleDateString()}] ${t.type?.toUpperCase()} | Score: ${t.score}/100 | Categories: ${(t.categories || []).join(', ')} | "${(t.content || '').substring(0, 80)}..." | Reason: ${t.explanation?.reason || 'N/A'}`
            ).join('\n');
        }

        // Fetch last 5 global alerts
        const alerts = await (Alert as any).find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('type severity message sourceIp status createdAt')
            .lean();

        if (alerts.length > 0) {
            recentAlerts = alerts.map((a: any) =>
                `[${new Date(a.createdAt).toLocaleDateString()}] ${a.severity?.toUpperCase()} | ${a.type} | ${a.message || ''} | IP: ${a.sourceIp || 'N/A'} | Status: ${a.status}`
            ).join('\n');
        }
    } catch (e) {
        // DB error non-fatal — continue without context
        console.error('DB context fetch error:', e);
    }

    // Self-healing actions
    const healingLog = getSelfHealingLog().slice(0, 10).map((h: { time: string; action: string; target: string; severity: string; result: string }) =>
        `[${new Date(h.time).toLocaleTimeString()}] ${h.action}: ${h.target} (${h.severity}) → ${h.result}`
    ).join('\n');

    // ── Build system prompt with live data ─────────────────────────────
    const systemPrompt = `You are "Shield AI", an expert cybersecurity assistant embedded in SentinelShield — an enterprise AI threat intelligence platform. You have access to real-time security data for this user.

CURRENT USER: ${user.name || user.email} (Role: ${user.role || 'user'})
CURRENT TIME: ${new Date().toLocaleString()}

═══ LIVE THREAT DATA (User's Recent Scans) ═══
${recentThreats || 'No recent scans found for this user.'}

═══ LIVE SECURITY ALERTS (Global) ═══
${recentAlerts || 'No active alerts at this time.'}

═══ SELF-HEALING ACTIONS (Recent) ═══
${healingLog || 'No automated actions triggered yet.'}

═══ PLATFORM CAPABILITIES ═══
- URL/Text/File/QR threat scanning with Gemini AI
- Real-time browser extension protection
- Dark pattern & misinformation detection  
- Auto self-healing: IP blocking, account lockdown, firewall rules
- Multi-language support (EN/HI/OD/ES/DE)
- SOC 2 compliant, GDPR ready

RESPONSE RULES:
1. Reference the LIVE DATA above when answering — be specific (mention actual scores, dates, categories)
2. Use bold **text** and bullet points for clarity
3. Keep responses concise (under 250 words) unless the user asks for detail
4. Provide actionable recommendations
5. Use security terminology naturally (IOC, CVE, MITRE ATT&CK, CVSS when relevant)
6. If asked about a specific scan/threat, reference the actual data shown above
7. Format IPs, hashes, domains in \`code\` style`;

    // ── Build message history for multi-turn ───────────────────────────
    const sanitizedHistory = [];
    let expectedRole = 'user';

    for (const m of history) {
        const text = m.text?.trim();
        if (!text) continue; // Skip empty messages

        const role = m.role === 'user' ? 'user' : 'model';
        if (role === expectedRole) {
            sanitizedHistory.push({ role, parts: [{ text }] });
            expectedRole = role === 'user' ? 'model' : 'user';
        }
    }

    // Ensure it ends with 'model'. If it ends with 'user', drop the last 'user' message
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
        sanitizedHistory.pop();
    }

    const chatHistory = sanitizedHistory.slice(-10); // keep last 10 valid exchanges

    // ── Stream response ────────────────────────────────────────────────
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: systemPrompt
        });

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessageStream(message);

        // Stream via ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                } catch (e) {
                    console.error('Stream error:', e);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        console.error('Chat streaming error:', error);
        // Fallback static response
        const fallback = getFallbackResponse(message, recentThreats);
        return new Response(fallback, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }
}

function getFallbackResponse(question: string, threatContext: string): string {
    const q = question.toLowerCase();
    if ((q.includes('block') && q.includes('ip')) || q.includes('blocked')) {
        return '**IP Blocking Protocol**\n\nWhen an IP is blocked:\n- 🛡️ Added to real-time blocklist instantly\n- 🔒 All active sessions terminated\n- 🔥 Firewall rule auto-deployed\n- 📊 Threat score logged for forensics\n\nCheck the **Self-Healing** section for recent blocks.';
    }
    if (q.includes('threat') || q.includes('scan') || q.includes('risk')) {
        return threatContext
            ? `**Your Recent Threats:**\n\nBased on your scans:\n${threatContext.split('\n').slice(0, 3).map(t => `• ${t}`).join('\n')}\n\nUse the **Threat Scanner** to analyze new content.`
            : '**Threat Analysis**\n\nSentinelShield uses multi-layer AI analysis:\n- 🤖 Gemini semantic evaluation\n- 📋 Heuristic pattern matching\n- 🌐 IP/domain reputation\n- 📊 Risk Score: 0-100\n\nRun a scan in the **Threat Scanner** section.';
    }
    return '**Shield AI** 🛡️\n\nI can help with:\n- 🔍 Explaining threat scores & categories\n- 🚫 IP blocking & self-healing actions\n- ⚡ Security posture analysis\n- 🛠️ Remediation recommendations\n\nAsk me anything about your security!';
}
