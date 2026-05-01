'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Icon from '@/components/Icon';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
      <div style={{ padding: '0 32px', width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #c2603e 0%, #a04a2c 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 24px rgba(194,96,62,0.35)',
        }}>
          <Icon name="chefhat" size={36} color="#fff" stroke={1.4} />
        </div>

        <h1 className="serif" style={{ fontSize: 36, letterSpacing: '-0.02em', marginBottom: 6 }}>Marmita</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 40 }}>
          Gestão de receitas e insumos
        </p>

        <button
          onClick={signInWithGoogle}
          className="btn"
          style={{
            width: '100%', justifyContent: 'center',
            background: '#fff', color: 'var(--ink)',
            border: '1px solid var(--line)',
            padding: '14px 18px', fontSize: 15,
            boxShadow: '0 2px 8px rgba(74,49,30,0.08)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.17z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 014.5 7.5V5.43H1.83a8 8 0 000 7.12l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.54-2.54A8 8 0 001.83 5.43L4.5 7.5a4.8 4.8 0 014.48-3.92z"/>
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
