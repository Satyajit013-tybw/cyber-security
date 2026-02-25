'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ToggleLeft, ToggleRight, Zap, ChevronDown } from 'lucide-react';

interface Condition { field: string; operator: string; value: string; }
interface Action { type: string; }
interface Rule { _id?: string; name: string; description?: string; conditions: Condition[]; conditionLogic: 'AND' | 'OR'; actions: Action[]; isActive: boolean; triggeredCount?: number; }

const FIELD_OPTS = ['text', 'url', 'riskScore', 'category'];
const OP_OPTS: Record<string, string[]> = {
    text: ['contains', 'matches'],
    url: ['contains', 'matches'],
    riskScore: ['greaterThan', 'lessThan', 'equals'],
    category: ['equals'],
};
const ACTION_OPTS = [
    { value: 'markCritical', label: '🔴 Mark as Critical' },
    { value: 'notifyAdmin', label: '📧 Notify Admin' },
    { value: 'blockContent', label: '🛑 Block Content' },
    { value: 'escalate', label: '⬆️ Escalate Alert' },
    { value: 'lockUser', label: '🔒 Lock User Account' },
];

const DEMO_RULES: Rule[] = [
    { _id: '1', name: 'Bomb Threat Escalation', description: 'Escalate any content about bombs above score 70', conditions: [{ field: 'text', operator: 'contains', value: 'bomb' }, { field: 'riskScore', operator: 'greaterThan', value: '70' }], conditionLogic: 'AND', actions: [{ type: 'markCritical' }, { type: 'notifyAdmin' }], isActive: true, triggeredCount: 4 },
    { _id: '2', name: 'Phishing Auto-Block', description: 'Automatically block phishing category threats', conditions: [{ field: 'category', operator: 'equals', value: 'phishing' }], conditionLogic: 'AND', actions: [{ type: 'blockContent' }, { type: 'notifyAdmin' }], isActive: true, triggeredCount: 12 },
];

export default function RulesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [rules, setRules] = useState<Rule[]>(DEMO_RULES);
    const [showBuilder, setShowBuilder] = useState(false);
    const [newRule, setNewRule] = useState<Rule>({ name: '', description: '', conditions: [{ field: 'text', operator: 'contains', value: '' }], conditionLogic: 'AND', actions: [{ type: 'markCritical' }], isActive: true });
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const addCondition = () => setNewRule(r => ({ ...r, conditions: [...r.conditions, { field: 'riskScore', operator: 'greaterThan', value: '' }] }));
    const removeCondition = (i: number) => setNewRule(r => ({ ...r, conditions: r.conditions.filter((_, j) => j !== i) }));
    const updateCondition = (i: number, key: string, val: string) => setNewRule(r => ({
        ...r, conditions: r.conditions.map((c, j) => j === i ? { ...c, [key]: val } : c),
    }));

    const saveRule = async () => {
        if (!newRule.name.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRule) });
            if (res.ok) {
                const data = await res.json();
                setRules(r => [data.rule, ...r]);
                setShowBuilder(false);
                setNewRule({ name: '', description: '', conditions: [{ field: 'text', operator: 'contains', value: '' }], conditionLogic: 'AND', actions: [{ type: 'markCritical' }], isActive: true });
            }
        } catch { /* demo mode: add locally */ setRules(r => [{ ...newRule, _id: Date.now().toString(), triggeredCount: 0 }, ...r]); setShowBuilder(false); }
        setSaving(false);
    };

    const toggleRule = async (ruleId: string, isActive: boolean) => {
        try { await fetch('/api/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId, isActive }) }); } catch { /* ignore */ }
        setRules(r => r.map(rule => rule._id === ruleId ? { ...rule, isActive } : rule));
    };

    const deleteRule = async (ruleId: string) => {
        try { await fetch('/api/rules', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ruleId }) }); } catch { /* ignore */ }
        setRules(r => r.filter(rule => rule._id !== ruleId));
    };

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>⚙️ No-Code Rule Engine</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Build custom detection rules with conditions and automated actions</p>
                    </div>
                    {user.role === 'admin' && (
                        <button className="btn-primary" onClick={() => setShowBuilder(b => !b)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={14} /> New Rule
                        </button>
                    )}
                </div>

                {/* Rule Builder */}
                <AnimatePresence>
                    {showBuilder && (
                        <motion.div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--accent-cyan)' }}>🔧 Rule Builder</h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Rule Name</label>
                                    <input className="input" placeholder="e.g. Critical Bomb Threat Alert" value={newRule.name} onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Description (optional)</label>
                                    <input className="input" placeholder="Describe what this rule does" value={newRule.description} onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))} />
                                </div>

                                {/* Conditions */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            IF (Conditions)
                                        </label>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {(['AND', 'OR'] as const).map(logic => (
                                                <button key={logic} onClick={() => setNewRule(r => ({ ...r, conditionLogic: logic }))}
                                                    style={{ padding: '3px 10px', borderRadius: '5px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: '700', background: newRule.conditionLogic === logic ? 'rgba(59,130,246,0.2)' : 'transparent', color: newRule.conditionLogic === logic ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                                                    {logic}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {newRule.conditions.map((cond, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                            <select className="input" value={cond.field} onChange={e => updateCondition(i, 'field', e.target.value)} style={{ flex: '0 0 110px' }}>
                                                {FIELD_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                            <select className="input" value={cond.operator} onChange={e => updateCondition(i, 'operator', e.target.value)} style={{ flex: '0 0 120px' }}>
                                                {(OP_OPTS[cond.field] || []).map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                            <input className="input" placeholder="value" value={cond.value} onChange={e => updateCondition(i, 'value', e.target.value)} />
                                            {newRule.conditions.length > 1 && (
                                                <button onClick={() => removeCondition(i)} className="btn-danger" style={{ padding: '8px', flexShrink: 0 }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button className="btn-ghost" onClick={addCondition} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Plus size={12} /> Add Condition
                                    </button>
                                </div>

                                {/* Actions */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>THEN (Actions)</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {ACTION_OPTS.map(({ value, label }) => {
                                            const active = newRule.actions.some(a => a.type === value);
                                            return (
                                                <button key={value} onClick={() => setNewRule(r => ({ ...r, actions: active ? r.actions.filter(a => a.type !== value) : [...r.actions, { type: value }] }))}
                                                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', transition: 'all 0.2s', background: active ? 'rgba(59,130,246,0.15)' : 'transparent', color: active ? 'var(--accent-blue)' : 'var(--text-muted)', borderColor: active ? 'rgba(59,130,246,0.3)' : 'var(--border)' }}>
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                                    <button className="btn-primary" onClick={saveRule} disabled={saving}>
                                        <Zap size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                        {saving ? 'Saving...' : 'Save Rule'}
                                    </button>
                                    <button className="btn-ghost" onClick={() => setShowBuilder(false)}>Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rules List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {rules.map((rule, i) => (
                        <motion.div key={rule._id || i} className="glass-card" style={{ padding: '20px' }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700' }}>{rule.name}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: rule.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: rule.isActive ? '#10b981' : '#64748b' }}>
                                            {rule.isActive ? 'ACTIVE' : 'PAUSED'}
                                        </span>
                                        {rule.triggeredCount! > 0 && (
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Triggered {rule.triggeredCount}×</span>
                                        )}
                                    </div>
                                    {rule.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{rule.description}</p>}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {rule.conditions.map((c, j) => (
                                            <span key={j} style={{ padding: '3px 10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                                {c.field} {c.operator} &quot;{c.value}&quot;
                                            </span>
                                        ))}
                                        <span style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700' }}>— {rule.conditionLogic} →</span>
                                        {rule.actions.map((a, j) => (
                                            <span key={j} style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '6px', fontSize: '11px', color: '#a78bfa' }}>
                                                {ACTION_OPTS.find(o => o.value === a.type)?.label || a.type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {user.role === 'admin' && (
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button onClick={() => toggleRule(rule._id!, !rule.isActive)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.isActive ? '#10b981' : 'var(--text-muted)' }}>
                                            {rule.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                        <button onClick={() => deleteRule(rule._id!)} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px' }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
