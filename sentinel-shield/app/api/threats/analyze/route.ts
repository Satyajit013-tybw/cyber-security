import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { analyzeText, analyzeURL, analyzeImage } from '@/lib/scoring';
import { anonymizeContent } from '@/lib/anonymizer';

export async function POST(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth.error) return auth.error;

    try {
        const body = await req.json();
        const { type, content, filename } = body;

        if (!type || !content) {
            return NextResponse.json({ error: 'type and content are required' }, { status: 400 });
        }

        // Anonymize before AI processing
        const { anonymizedContent, redactedFields } = anonymizeContent(content);

        // AI Scoring (local, no DB needed)
        let result;
        if (type === 'text') result = analyzeText(anonymizedContent);
        else if (type === 'url') result = analyzeURL(content);
        else result = analyzeImage(filename || content);

        return NextResponse.json({
            id: `threat_${Date.now()}`,
            type,
            anonymizedContent,
            redactedFields,
            riskScore: result.riskScore,
            categories: result.categories,
            confidence: result.confidence,
            explanation: result.explanation,
            severity: result.severity,
            suggestedActions: result.suggestedActions || ['review', 'monitor'],
            createdAt: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Analyze error:', err);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
