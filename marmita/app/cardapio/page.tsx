'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getCardapioItens } from '@/lib/firestore';
import type { CardapioItem } from '@/lib/data';
import { CATEGORIAS_CARDAPIO, fmtBRL } from '@/lib/data';

const WHATSAPP_NUMBER = '5511999999999';

type Carrinho = Record<string, number>;

export default function CardapioPage() {
  const { user } = useAuth();
  const [itens, setItens] = useState<CardapioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catAtiva, setCatAtiva] = useState('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [carrinho, setCarrinho] = useState<Carrinho>({});
  const [showCarrinho, setShowCarrinho] = useState(false);
  const [nome, setNome] = useState('');

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

  const addItem = (id: string) => setCarrinho(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id: string) => setCarrinho(c => {
    const n = (c[id] || 0) - 1;
    if (n <= 0) { const { [id]: _, ...rest } = c; return rest; }
    return { ...c, [id]: n };
  });

  const totalItens = Object.values(carrinho).reduce((s, q) => s + q, 0);
  const totalPreco = itens.reduce((s, item) => s + (carrinho[item.id] || 0) * item.preco, 0);
  const itensPedido = itens.filter(i => (carrinho[i.id] || 0) > 0);

  const enviarWhatsApp = () => {
    const nomeFormatado = nome.trim() || 'Cliente';
    const linhas = itensPedido.map(i => {
      const qty = carrinho[i.id];
      return `• ${qty}x ${i.nome} — ${fmtBRL(i.preco * qty)}`;
    });
    const msg = [
      `Olá! Gostaria de fazer um pedido 🎂`,
      ``,
      `*Nome:* ${nomeFormatado}`,
      ``,
      `*Itens:*`,
      ...linhas,
      ``,
      `*Total: ${fmtBRL(totalPreco)}*`,
    ].join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
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

      <div className="scroll" style={{ paddingBottom: totalItens > 0 ? 88 : 32 }}>
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

                  {grupo.map(item => {
                    const qty = carrinho[item.id] || 0;
                    return (
                      <div key={item.id} style={{
                        background: 'var(--surface)', borderRadius: 'var(--radius)',
                        border: `1px solid ${qty > 0 ? 'var(--terracotta)' : 'var(--line)'}`,
                        overflow: 'hidden', marginBottom: 14,
                        boxShadow: qty > 0 ? '0 0 0 2px color-mix(in srgb, var(--terracotta) 15%, transparent)' : 'var(--shadow-sm)',
                        transition: 'border-color .15s, box-shadow .15s',
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--terracotta)', letterSpacing: '-0.01em' }}>
                              {fmtBRL(item.preco)}
                            </div>
                            {qty === 0 ? (
                              <button
                                onClick={() => addItem(item.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 6,
                                  background: 'var(--terracotta)', color: '#fff',
                                  border: 'none', borderRadius: 20, padding: '8px 16px',
                                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                <Icon name="plus" size={14} color="#fff" />
                                Adicionar
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--terracotta)', borderRadius: 20 }}>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  style={{
                                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
                                  }}
                                >
                                  <Icon name="minus" size={14} color="#fff" />
                                </button>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => addItem(item.id)}
                                  style={{
                                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
                                  }}
                                >
                                  <Icon name="plus" size={14} color="#fff" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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

      {/* Barra flutuante do carrinho */}
      {totalItens > 0 && (
        <div
          onClick={() => setShowCarrinho(true)}
          style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 480,
            background: 'var(--terracotta)', color: '#fff',
            padding: '14px 20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', cursor: 'pointer',
            boxShadow: '0 -2px 20px rgba(0,0,0,.15)', zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(255,255,255,.2)', borderRadius: 20,
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
            }}>
              {totalItens}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Ver pedido</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{fmtBRL(totalPreco)}</span>
            <Icon name="chevronRight" size={16} color="#fff" />
          </div>
        </div>
      )}

      {/* Sheet do carrinho */}
      {showCarrinho && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowCarrinho(false); }}
        >
          <div style={{
            background: 'var(--bg)', borderRadius: '20px 20px 0 0',
            width: '100%', maxWidth: 480, margin: '0 auto',
            maxHeight: '90dvh', display: 'flex', flexDirection: 'column',
          }}>
            {/* Handle */}
            <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 36, height: 4, background: 'var(--line-2)', borderRadius: 2, margin: '0 auto' }} />
            </div>

            <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="serif" style={{ fontSize: 22 }}>Seu pedido</div>
              <button className="iconbtn" onClick={() => setShowCarrinho(false)}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px' }}>
              {/* Itens */}
              {itensPedido.map(item => {
                const qty = carrinho[item.id];
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 0', borderBottom: '1px solid var(--line)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{item.nome}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>
                        {fmtBRL(item.preco)} cada
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20 }}>
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Icon name="minus" size={13} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{qty}</span>
                      <button
                        onClick={() => addItem(item.id)}
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, minWidth: 72, textAlign: 'right' }}>
                      {fmtBRL(item.preco * qty)}
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontWeight: 700, fontSize: 16 }}>
                <span>Total</span>
                <span style={{ color: 'var(--terracotta)' }}>{fmtBRL(totalPreco)}</span>
              </div>

              {/* Nome */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>
                  Seu nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Como devemos te chamar?"
                  style={{
                    width: '100%', padding: '12px 14px', fontSize: 15,
                    border: '1px solid var(--line)', borderRadius: 10,
                    background: 'var(--surface)', fontFamily: 'inherit',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Botão enviar */}
            <div style={{ padding: '12px 20px 28px' }}>
              <button
                onClick={enviarWhatsApp}
                disabled={nome.trim() === ''}
                style={{
                  width: '100%', padding: '15px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                  background: nome.trim() ? '#25D366' : 'var(--line-2)',
                  color: nome.trim() ? '#fff' : 'var(--ink-4)',
                  border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: nome.trim() ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'background .15s',
                }}
              >
                <Icon name="whatsapp" size={18} color={nome.trim() ? '#fff' : 'var(--ink-4)'} />
                Pedir pelo WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
