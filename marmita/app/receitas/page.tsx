'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import { RECEITAS, CATEGORIAS_RECEITA, fmtBRL } from '@/lib/data';

const CATS = ['Todas', ...CATEGORIAS_RECEITA];

export default function ListaReceitas() {
  const [filter, setFilter] = useState('Todas');
  const filtered = filter === 'Todas' ? RECEITAS : RECEITAS.filter(r => r.cat === filter);

  return (
    <div className="app-shell">
      <StatusBar />

      <div className="appbar">
        <h1 className="serif">Receitas</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="search" size={16} /></button>
          <button className="iconbtn"><Icon name="grid" size={16} /></button>
        </div>
      </div>

      <div style={{ padding: '0 22px 12px', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 13, whiteSpace: 'nowrap',
              border: '1px solid ' + (filter === c ? 'var(--ink)' : 'var(--line)'),
              background: filter === c ? 'var(--ink)' : 'var(--surface)',
              color: filter === c ? 'var(--bg)' : 'var(--ink-2)',
              fontWeight: filter === c ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >{c}</button>
        ))}
      </div>

      <div className="scroll">
        <div className="col gap-3">
          {filtered.map(r => (
            <Link
              key={r.id}
              href={`/receitas/${r.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ padding: 0, display: 'flex', overflow: 'hidden' }}>
                <div className="img-placeholder" style={{ width: 104, minHeight: 120, borderRadius: 0, fontSize: 10, flexShrink: 0 }}>{r.foto}</div>
                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span className={`chip ${r.cat === 'Fitness' ? 'olive' : r.cat === 'Vegano' ? 'good' : 'honey'}`} style={{ fontSize: 11, padding: '3px 8px' }}>{r.cat}</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· rende {r.rendimento}</span>
                    </div>
                    <div className="serif" style={{ fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{r.nome}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Custo/porção</div>
                      <div className="tnum" style={{ fontSize: 13, fontWeight: 500 }}>{fmtBRL(r.custoPorcao)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Sugerido</div>
                      <div className="serif tnum" style={{ fontSize: 18, color: 'var(--terracotta)' }}>{fmtBRL(r.precoSugerido)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link href="/receitas/nova" className="fab">
        <Icon name="plus" size={22} />
      </Link>

      <BottomNav />
    </div>
  );
}
