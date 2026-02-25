import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'SentinelShield AI – Enterprise Threat Intelligence Platform',
  description: 'Privacy-first AI-powered threat detection, real-time analytics, and enterprise-grade security management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <div className="bg-grid" />
          <div className="bg-glow" />
          <div className="scan-line" />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
