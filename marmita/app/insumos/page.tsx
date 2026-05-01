'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getInsumos } from '@/lib/firestore';
import type { Insumo } from '@/lib/data';
import { CATEGORIAS_INSUMO, fmtBRL, fmtNum } from '@/lib/data';

const CATS = ['Todos', ...CATEGORIAS_INSUMO.slice(0, 5)];

function ListaInsumosContent() {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    getInsumos(user.uid).then(data => { setInsumos(data); setLoading(false); });
  }, [user]);

  const filtered = insumos.filter(i => {
    if (filter !== 'Todos' && i.cat !== filter) return false;
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="app-shell">
      <StatusBar />
      <div className="appbar">
        <h1 className="serif">Insumos</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="filter" size={16} /></button>
        </div>
      </div>

      <div style={{ padding: '0 22px 12px' }}>
        <div className="input-prefix" style={{ borderRadius: 12 }}>
          <span className="prefix" style={{ background: 'transparent', borderRight: '1px solid var(--line)' }}>
            <Icon name="search" size={16} color="var(--ink-3)" />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar insumo..." />
        </div>
      </div>

      <div style={{ padding: '0 22px 8px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding: '7px 14px', borderRadius: 999, fontSize: 13, whiteSpace: 'nowrap',
            border: '1px solid ' + (filter === c ? 'var(--terracotta)' : 'var(--line)'),
            background: filter === c ? 'var(--terracotta)' : 'var(--surface)',
            color: filter === c ? '#fff' : 'var(--ink-2)', fontWeight: filter === c ? 500 : 400,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{c}</button>
        ))}
      </div>

      <div className="scroll">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{loading ? '...' : `${filtered.length} insumos`}</span>
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading
            ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
            : filtered.map((ins, i) => (
              <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {ins.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{ins.nome}</span>
                    {ins.estoque < 2 && <span className="chip warn" style={{ padding: '2px 7px', fontSize: 10 }}>baixo</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {ins.cat} · {fmtNum(ins.estoque)} {ins.un} em estoque
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="serif tnum" style={{ fontSize: 16 }}>{fmtBRL(ins.custoUn)}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>/{ins.un}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <Link href="/insumos/novo" className="fab"><Icon name="plus" size={22} /></Link>
      <BottomNav />
    </div>
  );
}

export default function ListaInsumos() {
  return <AuthGuard><ListaInsumosContent /></AuthGuard>;
}
