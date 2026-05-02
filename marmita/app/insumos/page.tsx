'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getInsumos, recalcTodasReceitas } from '@/lib/firestore';
import type { Insumo } from '@/lib/data';
import { fmtBRL } from '@/lib/data';

type Sort = 'az' | 'za';

function ListaInsumosContent() {
  const { user } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('az');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    getInsumos(user.uid).then(data => { setInsumos(data); setLoading(false); });
  }, [user]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMsg('');
    const n = await recalcTodasReceitas(user.uid);
    setSyncing(false);
    setSyncMsg(`${n} receita${n !== 1 ? 's' : ''} atualizada${n !== 1 ? 's' : ''}`);
    setTimeout(() => setSyncMsg(''), 3000);
  };

  const filtered = insumos
    .filter(i => !search || i.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'az' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome));

  return (
    <div className="app-shell">
      <StatusBar />
      <div className="appbar">
        <h1 className="serif">Insumos</h1>
        <div className="actions">
          <button
            onClick={() => setSort(s => s === 'az' ? 'za' : 'az')}
            className="iconbtn"
            style={{ fontSize: 11, fontWeight: 600, width: 'auto', borderRadius: 999, padding: '0 12px' }}
          >
            {sort === 'az' ? 'A→Z' : 'Z→A'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="iconbtn"
            title="Atualizar custos das receitas"
            style={{ color: syncing ? 'var(--ink-3)' : 'var(--terracotta)' }}
          >
            <Icon name="refresh" size={16} style={syncing ? { animation: 'spin 1s linear infinite' } : undefined} />
          </button>
        </div>
      </div>

      {syncMsg && (
        <div style={{ margin: '0 22px 8px', padding: '8px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={14} color="var(--good)" /> {syncMsg}
        </div>
      )}

      <div style={{ padding: '0 22px 12px' }}>
        <div className="input-prefix" style={{ borderRadius: 12 }}>
          <span className="prefix" style={{ background: 'transparent', borderRight: '1px solid var(--line)' }}>
            <Icon name="search" size={16} color="var(--ink-3)" />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar insumo..." />
        </div>
      </div>

      <div className="scroll">
        <div style={{ padding: '8px 4px', fontSize: 13, color: 'var(--ink-3)' }}>
          {loading ? '...' : `${filtered.length} insumos`}
        </div>

        <div className="card" style={{ padding: 0 }}>
          {loading
            ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
            : filtered.length === 0
              ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Nenhum insumo encontrado.</div>
              : filtered.map((ins, i) => (
                <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                    {ins.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{ins.nome}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 4 }}>
                    <div className="serif tnum" style={{ fontSize: 16 }}>{fmtBRL(ins.custoUn)}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>/{ins.un}</div>
                  </div>
                  <Link href={`/insumos/${ins.id}/editar`} className="iconbtn" style={{ width: 32, height: 32, flexShrink: 0 }}>
                    <Icon name="edit" size={14} />
                  </Link>
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
