'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getReceitas } from '@/lib/firestore';
import type { Receita } from '@/lib/data';
import { CATEGORIAS_RECEITA, fmtBRL } from '@/lib/data';

const CATS = ['Todas', ...CATEGORIAS_RECEITA];

function ListaReceitasContent() {
  const { user } = useAuth();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');

  useEffect(() => {
    if (!user) return;
    getReceitas(user.uid).then(data => { setReceitas(data); setLoading(false); });
  }, [user]);

  const filtered = filter === 'Todas' ? receitas : receitas.filter(r => r.cat === filter);

  return (
    <div className="app-shell">
      <StatusBar />
      <div className="appbar">
        <h1 className="serif">Receitas</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="search" size={16} /></button>
        </div>
      </div>

      <div style={{ padding: '0 22px 12px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 13, whiteSpace: 'nowrap',
            border: '1px solid ' + (filter === c ? 'var(--ink)' : 'var(--line)'),
            background: filter === c ? 'var(--ink)' : 'var(--surface)',
            color: filter === c ? 'var(--bg)' : 'var(--ink-2)', fontWeight: filter === c ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{c}</button>
        ))}
      </div>

      <div className="scroll">
        {loading
          ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
          : <div className="col gap-3">
            {filtered.map(r => (
              <Link key={r.id} href={`/receitas/${r.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span className={`chip ${r.cat === 'Fitness' ? 'olive' : r.cat === 'Vegano' ? 'good' : 'honey'}`} style={{ fontSize: 11, padding: '3px 8px' }}>{r.cat}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>rende {r.rendimento}</span>
                  </div>
                  <div className="serif" style={{ fontSize: 18, lineHeight: 1.2, letterSpacing: '-0.01em', marginBottom: 12 }}>{r.nome}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Custo/porção</div>
                      <div className="tnum" style={{ fontSize: 13, fontWeight: 500 }}>{fmtBRL(r.custoPorcao)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Sugerido</div>
                      <div className="serif tnum" style={{ fontSize: 20, color: 'var(--terracotta)' }}>{fmtBRL(r.precoSugerido)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>}
      </div>

      <Link href="/receitas/nova" className="fab"><Icon name="plus" size={22} /></Link>
      <BottomNav />
    </div>
  );
}

export default function ListaReceitas() {
  return <AuthGuard><ListaReceitasContent /></AuthGuard>;
}
