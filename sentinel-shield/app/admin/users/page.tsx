'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, Shield, UserCog, User } from 'lucide-react';

interface AuthUser { _id?: string; id?: string; name: string; email: string; role: 'admin' | 'moderator' | 'viewer'; isApproved: boolean; createdAt: string; }

const DEMO_USERS: AuthUser[] = [
    { _id: '1', name: 'Admin User', email: 'admin@demo.com', role: 'admin', isApproved: true, createdAt: new Date().toISOString() },
    { _id: '2', name: 'Moderator One', email: 'mod@demo.com', role: 'moderator', isApproved: true, createdAt: new Date().toISOString() },
    { _id: '3', name: 'New Employee', email: 'new@demo.com', role: 'viewer', isApproved: false, createdAt: new Date().toISOString() },
];

export default function UsersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<AuthUser[]>(DEMO_USERS);

    useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) { const data = await res.json(); if (data.users?.length > 0) setUsers(data.users); }
        } catch { /* use demo */ }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const updateRole = async (userId: string, targetRole: string) => {
        try {
            await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'setRole', role: targetRole }) });
            setUsers(u => u.map(x => (x._id || x.id) === userId ? { ...x, role: targetRole as any } : x));
        } catch { /* ignore */ }
    };

    const approveUser = async (userId: string) => {
        try {
            await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'approve' }) });
            setUsers(u => u.map(x => (x._id || x.id) === userId ? { ...x, isApproved: true } : x));
        } catch { /* ignore */ }
    };

    const suspendUser = async (userId: string) => {
        try {
            await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'suspend' }) });
            setUsers(u => u.map(x => (x._id || x.id) === userId ? { ...x, isApproved: false } : x));
        } catch { /* ignore */ }
    };

    if (loading || !user) return null;

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main className="main-content">
                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>👥 User Management</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>Approve access, assign roles, and manage active accounts</p>
                </div>

                <motion.div className="glass-card" style={{ overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Status</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => {
                                const uid = u._id || u.id;
                                return (
                                    <tr key={uid}>
                                        <td>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.isApproved ? 'badge-low' : 'badge-escalated'}`}>
                                                {u.isApproved ? 'ACTIVE' : 'PENDING APPROVAL'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {(['admin', 'moderator', 'viewer'] as const).map(r => (
                                                    <button key={r} onClick={() => updateRole(uid!, r)} disabled={!u.isApproved || uid === user.id}
                                                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', cursor: uid === user.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', transition: 'all 0.2s', background: u.role === r ? 'rgba(59,130,246,0.2)' : 'transparent', color: u.role === r ? '#60a5fa' : 'var(--text-muted)' }}>
                                                        {r === 'admin' ? <Shield size={10} style={{ display: 'inline', marginRight: '4px' }} /> : r === 'moderator' ? <UserCog size={10} style={{ display: 'inline', marginRight: '4px' }} /> : <User size={10} style={{ display: 'inline', marginRight: '4px' }} />}
                                                        {r}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            {uid !== user.id && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {!u.isApproved ? (
                                                        <button onClick={() => approveUser(uid!)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <CheckCircle size={12} /> Approve Access
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => suspendUser(uid!)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <XCircle size={12} /> Suspend
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            </main>
        </div>
    );
}
