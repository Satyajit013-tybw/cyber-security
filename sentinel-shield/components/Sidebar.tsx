'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Shield, BarChart3, Bell, BookOpen, Users, Settings,
    Code2, TrendingUp, LogOut, ChevronRight, Zap
} from 'lucide-react';

const navItems = {
    admin: [
        { href: '/admin', label: 'Dashboard', icon: BarChart3 },
        { href: '/admin/alerts', label: 'Alerts', icon: Bell },
        { href: '/admin/rules', label: 'Rule Engine', icon: Settings },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/audit', label: 'Audit Logs', icon: BookOpen },
        { href: '/admin/forecast', label: 'Forecast', icon: TrendingUp },
        { href: '/playground', label: 'API Playground', icon: Code2 },
    ],
    moderator: [
        { href: '/moderator', label: 'Dashboard', icon: BarChart3 },
        { href: '/moderator/alerts', label: 'Alerts', icon: Bell },
        { href: '/playground', label: 'API Playground', icon: Code2 },
    ],
    viewer: [
        { href: '/viewer', label: 'Dashboard', icon: BarChart3 },
        { href: '/playground', label: 'API Playground', icon: Code2 },
    ],
};

interface SidebarProps {
    activeSection?: string;
    onNav?: (section: any) => void;
    navItemsOverride?: { key: string; label: string; icon: React.ElementType }[];
}

export default function Sidebar({ activeSection, onNav, navItemsOverride }: SidebarProps = {}) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    if (!user) return null;
    const items = navItems[user.role] || navItems.viewer;

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div style={{ marginBottom: '16px', padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        borderRadius: '10px',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Shield size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>SentinelShield</div>
                        <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Defense Platform</div>
                    </div>
                </div>
            </div>

            {/* Status Indicator */}
            <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <Zap size={14} color="#10b981" />
                <div>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#10b981' }}>SYSTEM ONLINE</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Threat detection active</div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
                paddingRight: '4px'
            }}>
                {navItemsOverride ? navItemsOverride.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => onNav && onNav(key)}
                        className={`sidebar-link ${activeSection === key ? 'active' : ''}`}
                        style={{
                            width: '100%', background: activeSection === key ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'none',
                            fontFamily: 'inherit', color: activeSection === key ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        <Icon size={16} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                        {activeSection === key && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                    </button>
                )) : items.map(({ href, label, icon: Icon }) => (
                    <button
                        key={href}
                        onClick={() => router.push(href)}
                        className={`sidebar-link ${pathname === href ? 'active' : ''}`}
                        style={{ width: '100%', background: 'none', fontFamily: 'inherit' }}
                    >
                        <Icon size={16} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                        {pathname === href && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                    </button>
                ))}
            </nav>

            {/* User Info */}
            <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '8px',
                marginTop: '8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', marginBottom: '8px' }}>
                    <div style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: '700', color: 'white', flexShrink: 0,
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.role} · {user.orgName}</div>
                    </div>
                </div>

                {/* Always show Profile link explicitly here at the bottom */}
                {(onNav || user.role === 'admin') && (
                    <button
                        onClick={() => {
                            if (onNav) onNav('profile');
                            else router.push('/admin/users'); // fallback or ignore if admin wants
                        }}
                        className={`sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}
                        style={{
                            width: '100%', background: activeSection === 'profile' ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : 'none',
                            fontFamily: 'inherit', color: activeSection === 'profile' ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        {/* Inline require to grab icon to prevent breaking imports if we can't extract it directly */}
                        <Users size={16} />
                        <span style={{ flex: 1, textAlign: 'left' }}>Profile</span>
                        {activeSection === 'profile' && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                    </button>
                )}

                <button
                    onClick={logout}
                    className="sidebar-link"
                    style={{ width: '100%', background: 'none', fontFamily: 'inherit', color: '#ef4444' }}
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
