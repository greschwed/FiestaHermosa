'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Icon from './Icon';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
        <div style={{ color: 'var(--terracotta)', opacity: 0.6 }}>
          <Icon name="chefhat" size={32} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
