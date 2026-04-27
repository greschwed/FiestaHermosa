'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import Icon from '@/components/Icon';
import { INSUMOS, CATEGORIAS_RECEITA, fmtBRL, fmtNum } from '@/lib/data';

interface Item { id: string; qtd: number; }

export default function CadastroReceita() {
  const router = useRouter();
  const [nome, setNome] = useState('Strogonoff de frango');
  const [cat, setCat] = useState('Tradicional');
  const [rendimento, setRendimento] = useState(8);
  const [margem, setMargem] = useState(60);
  const [taxa, setTaxa] = useState(18);
  const [items, setItems] = useState<Item[]>([
    { id: 'i3', qtd: 1.0 },
    { id: 'i1', qtd: 0.8 },
    { id: 'i8', qtd: 0.3 },
    { id: 'i6', qtd: 0.2 },
    { id: 'i7', qtd: 0.04 },
    { id: 'i11', qtd: 8 },
  ]);
  const [picker, setPicker] = useState(false);

  const detalhados = items.map(it => {
    const ins = INSUMOS.find(i => i.id === it.id)!;
    return { ...ins, qtd: it.qtd, custo: it.qtd * ins.custoUn };
  });
  const custoTotal = detalhados.reduce((s, d) => s + d.custo, 0);
  const custoPorcao = custoTotal / rendimento;
  const precoBruto = custoPorcao * (1 + margem / 100);
  const precoSugerido = precoBruto / (1 - taxa / 100);

  const updateQtd = (id: string, delta: number) => {
    setItems(items.map(it => it.id === id ? { ...it, qtd: Math.max(0, +(it.qtd + delta).toFixed(3)) } : it));
  };
  const removeItem = (id: string) => setItems(items.filter(it => it.id !== id));
  const addItem = (id: string) => { setItems([...items, { id, qtd: 0.1 }]); setPicker(false); };

  const insumosDisponiveis = INSUMOS.filter(i => !items.find(it => it.id === i.id));

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <StatusBar />

      <div className="appbar">
        <Link href="/receitas" className="iconbtn"><Icon name="arrowLeft" size={18} /></Link>
        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Nova receita</span>
        <Link href="/receitas" className="iconbtn"><Icon name="close" size={16} /></Link>
      </div>

      <div className="scroll" style={{ paddingBottom: 160 }}>
        <div className="img-placeholder" style={{ height: 120, marginBottom: 14 }}>foto do prato</div>

        <div className="col gap-4">
          {/* Nome */}
          <div className="field">
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="serif"
              style={{
                fontSize: 24, padding: '8px 0', border: 'none',
                borderBottom: '1.5px solid var(--line)', borderRadius: 0,
                letterSpacing: '-0.02em', background: 'transparent',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Categoria</label>
              <select value={cat} onChange={e => setCat(e.target.value)}>
                {CATEGORIAS_RECEITA.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Rendimento</label>
              <div className="input-prefix">
                <input type="number" value={rendimento} onChange={e => setRendimento(+e.target.value || 1)} />
                <span className="suffix">porções</span>
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="row" style={{ marginBottom: 10 }}>
              <div className="serif" style={{ fontSize: 18 }}>Ingredientes</div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{items.length} itens</span>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {detalhados.map((d, i) => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < detalhados.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontSize: 20 }}>{d.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}>{d.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtBRL(d.custoUn)}/{d.un}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-2)', borderRadius: 999, padding: 2 }}>
                    <button
                      onClick={() => updateQtd(d.id, -0.1)}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    ><Icon name="minus" size={12} /></button>
                    <span className="tnum" style={{ fontSize: 12, minWidth: 42, textAlign: 'center' }}>
                      {fmtNum(d.qtd, d.un === 'un' ? 0 : 2)}
                    </span>
                    <button
                      onClick={() => updateQtd(d.id, 0.1)}
                      style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    ><Icon name="plus" size={12} /></button>
                  </div>
                  <div className="tnum" style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 54, textAlign: 'right' }}>{fmtBRL(d.custo)}</div>
                  <button onClick={() => removeItem(d.id)} style={{ border: 'none', background: 'none', color: 'var(--ink-4)', padding: 4, cursor: 'pointer' }}>
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setPicker(true)}
                style={{
                  width: '100%', padding: 14, background: 'none', border: 'none',
                  color: 'var(--terracotta)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  borderTop: items.length ? '1px dashed var(--line)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit',
                }}
              ><Icon name="plus" size={14} /> Adicionar insumo</button>
            </div>
          </div>

          {/* Precificação */}
          <div>
            <div className="serif" style={{ fontSize: 18, marginBottom: 10 }}>Precificação</div>
            <div className="card-soft">
              <div className="col gap-3">
                <div>
                  <div className="row" style={{ fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--ink-2)' }}>Margem de lucro</span>
                    <span className="tnum" style={{ fontWeight: 600 }}>{margem}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={margem} onChange={e => setMargem(+e.target.value)} />
                </div>
                <div>
                  <div className="row" style={{ fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--ink-2)' }}>Taxa marketplace (iFood)</span>
                    <span className="tnum" style={{ fontWeight: 600 }}>{taxa}%</span>
                  </div>
                  <input type="range" min="0" max="35" value={taxa} onChange={e => setTaxa(+e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky calculation footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#fff', borderTop: '1px solid var(--line)',
        padding: '14px 18px 18px',
        boxShadow: '0 -8px 24px -10px rgba(74,49,30,0.1)',
        zIndex: 30,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 10, marginBottom: 10, fontSize: 11 }}>
          <div>
            <div style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Custo total</div>
            <div className="tnum serif" style={{ fontSize: 15, marginTop: 2 }}>{fmtBRL(custoTotal)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>/ porção</div>
            <div className="tnum serif" style={{ fontSize: 15, marginTop: 2 }}>{fmtBRL(custoPorcao)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Sugerido</div>
            <div className="tnum serif" style={{ fontSize: 22, marginTop: 2, color: 'var(--terracotta)' }}>{fmtBRL(precoSugerido)}</div>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => router.push('/receitas')}
        >
          <Icon name="check" size={16} /> Salvar receita
        </button>
      </div>

      {/* Ingredient picker bottom sheet */}
      {picker && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(42,31,23,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }}
          onClick={() => setPicker(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', width: '100%', maxWidth: 480, margin: '0 auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '16px 18px 32px', maxHeight: '60vh', overflowY: 'auto' }}
          >
            <div style={{ width: 36, height: 4, background: 'var(--line-2)', borderRadius: 2, margin: '0 auto 14px' }} />
            <div className="serif" style={{ fontSize: 18, marginBottom: 12 }}>Adicionar insumo</div>
            <div className="col gap-2">
              {insumosDisponiveis.map(ins => (
                <button
                  key={ins.id}
                  onClick={() => addItem(ins.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: 'var(--surface-2)', border: 'none', borderRadius: 10,
                    textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{ins.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{ins.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtBRL(ins.custoUn)}/{ins.un}</div>
                  </div>
                  <Icon name="plus" size={14} color="var(--terracotta)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
