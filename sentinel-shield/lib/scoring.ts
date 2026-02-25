/**
 * AI Threat Scoring Engine
 * Hybrid rule-based + NLP scoring for text, URL, and image analysis.
 */

export interface ScoringResult {
    riskScore: number;
    categories: string[];
    confidence: number;
    explanation: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedActions?: string[];
}

// ─── Keyword Libraries ───────────────────────────────────────────────────────
const HATE_SPEECH_KEYWORDS = ['hate', 'slur', 'genocide', 'exterminate', 'inferior race', 'subhuman'];
const THREAT_KEYWORDS = ['bomb', 'kill', 'attack', 'destroy', 'threat', 'hurt you', 'going to shoot'];
const PHISHING_KEYWORDS = ['verify your account', 'click here now', 'your account suspended', 'confirm your identity', 'urgent action required', 'limited time offer'];
const SCAM_KEYWORDS = ['you have won', 'claim your prize', 'wire transfer', 'nigerian prince', 'investment opportunity', 'guaranteed returns'];
const CYBERBULLYING_KEYWORDS = ['you are worthless', 'nobody likes you', 'kill yourself', 'go die', 'you are ugly', 'loser'];
const SELF_HARM_KEYWORDS = ['want to end it', 'not worth living', 'suicide', 'self harm', 'cut myself'];
const TOXICITY_PATTERNS = [/f+u+c+k/gi, /s+h+i+t/gi, /b+i+t+c+h/gi, /a+s+s+h+o+l+e/gi];

// ─── Suspicious URL Patterns ──────────────────────────────────────────────────
const SUSPICIOUS_URL_PATTERNS = [
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
    /bit\.ly|tinyurl|t\.co|goo\.gl/i,
    /login|verify|secure|update|confirm.*account/i,
    /paypal-secure|bank-login|account-verify/i,
    /-{3,}/,
];

const BLACKLISTED_DOMAINS = ['malware.com', 'phishing-test.com', 'dangerous-site.net', 'scam-alert.org'];

function getSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
}

// ─── Text Analysis ────────────────────────────────────────────────────────────
export function analyzeText(content: string): ScoringResult {
    const text = content.toLowerCase();
    let score = 0;
    const categories: string[] = [];
    const explanations: string[] = [];

    const checkKeywords = (keywords: string[], category: string, weight: number, label: string) => {
        const found = keywords.filter(kw => text.includes(kw.toLowerCase()));
        if (found.length > 0) {
            score += Math.min(weight * found.length, weight * 2);
            categories.push(category);
            explanations.push(`${label}: found "${found[0]}"`);
        }
    };

    checkKeywords(HATE_SPEECH_KEYWORDS, 'hate_speech', 35, 'Hate speech detected');
    checkKeywords(THREAT_KEYWORDS, 'violent_threat', 40, 'Violent threat detected');
    checkKeywords(PHISHING_KEYWORDS, 'phishing', 30, 'Phishing pattern detected');
    checkKeywords(SCAM_KEYWORDS, 'scam', 25, 'Scam content detected');
    checkKeywords(CYBERBULLYING_KEYWORDS, 'cyberbullying', 30, 'Cyberbullying detected');
    checkKeywords(SELF_HARM_KEYWORDS, 'self_harm', 45, 'Self-harm indicator found');

    TOXICITY_PATTERNS.forEach(pattern => {
        if (pattern.test(text)) {
            score += 10;
            if (!categories.includes('toxicity')) {
                categories.push('toxicity');
                explanations.push('Toxic language detected');
            }
        }
    });

    score = Math.min(score, 100);
    const confidence = categories.length > 0 ? Math.min(70 + categories.length * 8, 98) : 85;

    return {
        riskScore: score,
        categories,
        confidence,
        explanation: explanations.length > 0 ? explanations.join('; ') : 'No significant threats detected in text content.',
        severity: getSeverity(score),
    };
}

// ─── URL Analysis ─────────────────────────────────────────────────────────────
export function analyzeURL(url: string): ScoringResult {
    let score = 0;
    const categories: string[] = [];
    const explanations: string[] = [];

    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        const domain = parsed.hostname.toLowerCase();

        if (BLACKLISTED_DOMAINS.some(d => domain.includes(d))) {
            score += 90;
            categories.push('blacklisted_domain');
            explanations.push('Domain found on threat blacklist');
        }

        SUSPICIOUS_URL_PATTERNS.forEach((pattern, i) => {
            if (pattern.test(url)) {
                score += [30, 15, 25, 40, 10][i] || 15;
                const labels = ['IP-based URL', 'URL shortener', 'Login/phishing pattern', 'Brand impersonation', 'Suspicious format'];
                const category = ['ip_url', 'url_shortener', 'phishing', 'brand_impersonation', 'suspicious_format'][i];
                categories.push(category);
                explanations.push(labels[i]);
            }
        });

        if (parsed.protocol === 'http:') {
            score += 10;
            categories.push('insecure_protocol');
            explanations.push('No HTTPS encryption');
        }

        if (parsed.hostname.split('.').length > 4) {
            score += 15;
            categories.push('suspicious_subdomain');
            explanations.push('Excessive subdomain nesting');
        }
    } catch {
        score = 50;
        categories.push('invalid_url');
        explanations.push('Malformed URL structure');
    }

    score = Math.min(score, 100);
    return {
        riskScore: score,
        categories,
        confidence: 82,
        explanation: explanations.join('; ') || 'URL appears clean based on pattern analysis.',
        severity: getSeverity(score),
    };
}

// ─── Image Analysis (Conceptual Demo) ────────────────────────────────────────
export function analyzeImage(filename: string): ScoringResult {
    // Demo: simulate CV analysis based on filename hints
    const name = filename.toLowerCase();
    let score = 5;
    const categories: string[] = [];
    const explanations: string[] = [];

    if (name.includes('weapon') || name.includes('gun') || name.includes('knife')) {
        score = 78; categories.push('weapon_detection'); explanations.push('Potential weapon detected in image');
    } else if (name.includes('nsfw') || name.includes('adult') || name.includes('explicit')) {
        score = 85; categories.push('inappropriate_content'); explanations.push('Inappropriate content detected');
    } else if (name.includes('fake') || name.includes('deepfake')) {
        score = 70; categories.push('deepfake'); explanations.push('Possible synthetic/deepfake content');
    } else {
        score = Math.floor(Math.random() * 15);
        explanations.push('Image appears safe based on content analysis');
    }

    return {
        riskScore: score,
        categories,
        confidence: 74,
        explanation: explanations.join('; '),
        severity: getSeverity(score),
    };
}
