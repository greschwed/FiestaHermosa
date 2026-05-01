'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getInsumos, getReceitas } from '@/lib/firestore';
import type { Insumo, Receita } from '@/lib/data';
import { fmtBRL } from '@/lib/data';

function DashboardContent() {
  const { user, signOutUser } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getInsumos(user.uid), getReceitas(user.uid)]).then(([ins, rec]) => {
      setInsumos(ins);
      setReceitas(rec);
      setLoading(false);
    });
  }, [user]);

  const custoMedio = receitas.length
    ? receitas.reduce((s, r) => s + r.custoPorcao, 0) / receitas.length
    : 0;

  const nome = user?.displayName?.split(' ')[0] ?? 'Chef';

  return (
    <div className="app-shell">
      <StatusBar />

      <div style={{ padding: '8px 22px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Olá, {nome} 👋</div>
          <h1 className="serif" style={{ margin: '2px 0 0', fontSize: 30, letterSpacing: '-0.02em' }}>Cozinha de hoje</h1>
        </div>
        <button
          onClick={signOutUser}
          className="iconbtn"
          title="Sair"
          style={{ width: 42, height: 42, background: 'var(--terracotta-bg)', border: 'none', color: 'var(--terracotta)' }}
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            : <Icon name="user" size={18} />}
        </button>
      </div>

      <div className="scroll">
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #c2603e 0%, #a04a2c 100%)',
          borderRadius: 20, padding: 20, color: '#fff', marginBottom: 14, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', right: 30, bottom: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Visão geral</div>
          <div className="serif" style={{ fontSize: 38, marginTop: 6, letterSpacing: '-0.02em' }}>
            {loading ? '...' : `${receitas.length} receitas`}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 13 }}>
            <div><span style={{ opacity: 0.75 }}>Insumos</span> <strong>{loading ? '...' : insumos.length}</strong></div>
            <div style={{ opacity: 0.4 }}>•</div>
            <div><span style={{ opacity: 0.75 }}>Custo médio</span> <strong>{loading ? '...' : fmtBRL(custoMedio)}/porção</strong></div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="book" size={18} color="var(--olive)" />
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{loading ? '—' : receitas.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Receitas ativas</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="package" size={18} color="var(--terracotta)" />
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{loading ? '—' : insumos.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Insumos</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="trending" size={18} color="var(--good)" />
            <div className="serif" style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>{loading ? '—' : fmtBRL(custoMedio)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Custo médio/porção</div>
          </div>
        </div>

        {/* Receitas */}
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="serif" style={{ fontSize: 20 }}>Receitas</div>
          <Link href="/receitas" style={{ color: 'var(--terracotta)', fontSize: 13, textDecoration: 'none' }}>Ver todas</Link>
        </div>
        <div className="card" style={{ padding: 0 }}>
          {loading
            ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
            : receitas.slice(0, 4).map((r, i) => (
              <Link key={r.id} href={`/receitas/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderBottom: i < 3 ? '1px solid var(--line)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    Custo {fmtBRL(r.custoPorcao)} · margem {r.margem}%
                  </div>
                </div>
                <div className="serif" style={{ fontSize: 17, color: 'var(--terracotta)', flexShrink: 0 }}>{fmtBRL(r.precoSugerido)}</div>
              </Link>
            ))}
        </div>

      </div>

      <BottomNav />
    </div>
  );
}

export default function Dashboard() {
  return <AuthGuard><DashboardContent /></AuthGuard>;
}
