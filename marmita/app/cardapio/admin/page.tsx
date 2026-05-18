'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import AuthGuard from '@/components/AuthGuard';
import ConfirmModal from '@/components/ConfirmModal';
import Icon from '@/components/Icon';
import { getCardapioItens, deleteCardapioItem } from '@/lib/firestore';
import type { CardapioItem } from '@/lib/data';
import { CATEGORIAS_CARDAPIO, fmtBRL } from '@/lib/data';

function AdminCardapioContent() {
  const router = useRouter();
  const [itens, setItens] = useState<CardapioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState<CardapioItem | null>(null);

  useEffect(() => {
    getCardapioItens().then(data => { setItens(data); setLoading(false); });
  }, []);

  const cats = CATEGORIAS_CARDAPIO.filter(c => itens.some(i => i.categoria === c));
  const semCategoria = itens.filter(i => !CATEGORIAS_CARDAPIO.includes(i.categoria));
  const todasCats = [...cats, ...(semCategoria.length ? [semCategoria[0].categoria] : [])];

  async function handleDelete() {
    if (!deletando) return;
    await deleteCardapioItem(deletando.id);
    setItens(prev => prev.filter(i => i.id !== deletando.id));
    setDeletando(null);
  }

  return (
    <div className="app-shell">
      <StatusBar />

      <div className="appbar">
        <button className="iconbtn" onClick={() => router.push('/')}>
          <Icon name="arrowLeft" size={18} />
        </button>
        <h1 className="serif">Cardápio</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <Link href="/cardapio">
            <button className="iconbtn" title="Visualizar cardápio público">
              <Icon name="eye" size={18} />
            </button>
          </Link>
          <Link href="/cardapio/admin/novo">
            <button className="iconbtn"><Icon name="plus" size={20} /></button>
          </Link>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 80 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
        ) : itens.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
            <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>Nenhum item ainda</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24 }}>
              Adicione o primeiro item do cardápio.
            </div>
            <Link href="/cardapio/admin/novo">
              <button className="btn btn-primary" style={{ borderRadius: 999 }}>+ Adicionar item</button>
            </Link>
          </div>
        ) : (
          <>
            {todasCats.map(cat => {
              const grupo = itens.filter(i => i.categoria === cat).sort((a, b) => a.ordem - b.ordem);
              return (
                <div key={cat} style={{ padding: '20px 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
                      {cat}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{grupo.length} {grupo.length === 1 ? 'item' : 'itens'}</span>
                  </div>

                  {grupo.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: 'var(--surface)', border: '1px solid var(--line)',
                      borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 8,
                    }}>
                      {item.foto ? (
                        <img src={item.foto} alt={item.nome}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                          background: 'var(--surface-3)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name="image" size={20} color="var(--ink-4)" />
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nome}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                          {fmtBRL(item.preco)}
                        </div>
                      </div>

                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'var(--surface-2)', border: '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', flexShrink: 0,
                      }}>
                        {item.ordem}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <Link href={`/cardapio/admin/${item.id}/editar`}>
                          <button className="iconbtn" style={{ width: 32, height: 32, borderRadius: '50%' }}>
                            <Icon name="edit" size={14} />
                          </button>
                        </Link>
                        <button
                          className="iconbtn"
                          style={{ width: 32, height: 32, borderRadius: '50%', borderColor: 'var(--danger-bg)', color: 'var(--danger)' }}
                          onClick={() => setDeletando(item)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <Link href={`/cardapio/admin/novo?cat=${encodeURIComponent(cat)}`}>
                    <button style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      width: '100%', padding: 11, borderRadius: 'var(--radius-sm)',
                      border: '1.5px dashed var(--line-2)', background: 'transparent',
                      fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', cursor: 'pointer',
                      marginBottom: 20, fontFamily: 'inherit',
                    }}>
                      + Adicionar item
                    </button>
                  </Link>
                </div>
              );
            })}
          </>
        )}
      </div>

      {itens.length > 0 && (
        <Link href="/cardapio/admin/novo" style={{ position: 'absolute', bottom: 72, right: 20, zIndex: 10 }}>
          <button style={{
            height: 48, padding: '0 20px', borderRadius: 999,
            background: 'var(--terracotta)', color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 500, boxShadow: '0 8px 24px -6px rgba(194,96,62,.5)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Icon name="plus" size={16} color="#fff" />
            Novo item
          </button>
        </Link>
      )}

      {deletando && (
        <ConfirmModal
          title="Excluir item"
          message={`Remover "${deletando.nome}" do cardápio?`}
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeletando(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function AdminCardapioPage() {
  return <AuthGuard><AdminCardapioContent /></AuthGuard>;
}
