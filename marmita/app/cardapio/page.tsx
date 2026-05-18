'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getCardapioItens } from '@/lib/firestore';
import type { CardapioItem } from '@/lib/data';
import { CATEGORIAS_CARDAPIO, fmtBRL } from '@/lib/data';

export default function CardapioPage() {
  const { user } = useAuth();
  const [itens, setItens] = useState<CardapioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catAtiva, setCatAtiva] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    getCardapioItens().then(data => {
      setItens(data);
      setLoading(false);
      const cats = CATEGORIAS_CARDAPIO.filter(c => data.some(i => i.categoria === c));
      if (cats.length) setCatAtiva(cats[0]);
    });
  }, []);

  const cats = CATEGORIAS_CARDAPIO.filter(c => itens.some(i => i.categoria === c));

  const scrollToCat = (cat: string) => {
    setCatAtiva(cat);
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">

      {/* Cabeçalho */}
      <div style={{ padding: '24px 22px 16px', borderBottom: '1px solid var(--line)', position: 'relative' }}>
        <div className="serif" style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Fiesta Hermosa
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>
          Confeitaria Fina Artesanal
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
          <span style={{ color: 'var(--terracotta)', fontSize: 12 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line-2)' }} />
        </div>
        {user && (
          <Link href="/cardapio/admin" style={{ position: 'absolute', top: 22, right: 18 }}>
            <button className="iconbtn"><Icon name="settings" size={17} /></button>
          </Link>
        )}
      </div>

      {/* Nav de categorias */}
      {cats.length > 0 && (
        <div style={{
          display: 'flex', overflowX: 'auto', padding: '0 22px',
          borderBottom: '1px solid var(--line)', background: 'var(--bg)',
          position: 'sticky', top: 0, zIndex: 10, scrollbarWidth: 'none',
        }}>
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => scrollToCat(cat)}
              style={{
                flexShrink: 0, padding: '12px 4px', marginRight: 20,
                fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                borderBottom: `2px solid ${catAtiva === cat ? 'var(--terracotta)' : 'transparent'}`,
                color: catAtiva === cat ? 'var(--terracotta)' : 'var(--ink-3)',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="scroll" style={{ paddingBottom: 32 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Carregando cardápio...
          </div>
        ) : itens.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎂</div>
            <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>Cardápio em breve</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Nossos itens serão publicados em breve.
            </div>
          </div>
        ) : (
          cats.map((cat, ci) => {
            const grupo = itens.filter(i => i.categoria === cat);
            if (!grupo.length) return null;
            return (
              <div key={cat}>
                <div
                  ref={el => { sectionRefs.current[cat] = el; }}
                  style={{ padding: '24px 18px 8px', scrollMarginTop: 88 }}
                >
                  <div className="serif" style={{ fontSize: 24, marginBottom: 2 }}>{cat}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 16 }}>
                    {grupo.length} {grupo.length === 1 ? 'opção' : 'opções'}
                  </div>

                  {grupo.map(item => (
                    <div key={item.id} style={{
                      background: 'var(--surface)', borderRadius: 'var(--radius)',
                      border: '1px solid var(--line)', overflow: 'hidden',
                      marginBottom: 14, boxShadow: 'var(--shadow-sm)',
                    }}>
                      {item.foto ? (
                        <img
                          src={item.foto}
                          alt={item.nome}
                          style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', aspectRatio: '1/1',
                          background: 'var(--surface-3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon name="image" size={48} color="var(--line-2)" />
                        </div>
                      )}
                      <div style={{ padding: '14px 16px 16px' }}>
                        <div className="serif" style={{ fontSize: 20, marginBottom: 6 }}>{item.nome}</div>
                        {item.descricao && (
                          <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: 12 }}>
                            {item.descricao}
                          </div>
                        )}
                        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--terracotta)', letterSpacing: '-0.01em' }}>
                          {fmtBRL(item.preco)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {ci < cats.length - 1 && (
                  <div style={{ height: 1, background: 'var(--line)', margin: '8px 18px 0' }} />
                )}
              </div>
            );
          })
        )}

        {itens.length > 0 && (
          <div style={{ textAlign: 'center', padding: '24px 22px 28px', borderTop: '1px solid var(--line)', marginTop: 8 }}>
            <div className="serif" style={{ fontSize: 15, color: 'var(--ink-3)', fontStyle: 'italic' }}>
              Encomendas com antecedência
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', letterSpacing: '.04em', marginTop: 4 }}>
              @fiestahermosa
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
