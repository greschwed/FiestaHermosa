'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/lib/auth-context';
import { getReceita, getInsumos, updateReceita, deleteReceita } from '@/lib/firestore';
import type { Insumo } from '@/lib/data';
import { CATEGORIAS_RECEITA, fmtBRL, fmtNum } from '@/lib/data';

interface Item { id: string; qtd: number; }

function EditarReceitaContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [nome, setNome] = useState('');
  const [cat, setCat] = useState('Tradicional');
  const [rendimento, setRendimento] = useState(8);
  const [margem, setMargem] = useState(60);
  const [taxa, setTaxa] = useState(18);
  const [items, setItems] = useState<Item[]>([]);
  const [preparo, setPreparo] = useState<string[]>([]);
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getReceita(user.uid, id), getInsumos(user.uid)]).then(([rec, ins]) => {
      if (!rec) { router.replace('/receitas'); return; }
      setNome(rec.nome);
      setCat(rec.cat || 'Tradicional');
      setRendimento(rec.rendimento || 1);
      setMargem(rec.margem || 60);
      setTaxa(rec.taxaApp || 0);
      setItems(rec.ingredientes || []);
      setPreparo(rec.preparo || []);
      setInsumos(ins);
      setLoading(false);
    });
  }, [user, id, router]);

  const detalhados = items.map(it => {
    const ins = insumos.find(i => i.id === it.id);
    if (!ins) return null;
    return { ...ins, qtd: it.qtd, custo: it.qtd * ins.custoUn };
  }).filter(Boolean) as (Insumo & { qtd: number; custo: number })[];

  const custoTotal = detalhados.reduce((s, d) => s + d.custo, 0);
  const custoPorcao = custoTotal / (rendimento || 1);
  const precoSugerido = (custoPorcao * (1 + margem / 100)) / (1 - taxa / 100);

  const updateQtd = (itemId: string, delta: number) =>
    setItems(items.map(it => it.id === itemId ? { ...it, qtd: Math.max(0, +(it.qtd + delta).toFixed(3)) } : it));
  const removeItem = (itemId: string) => setItems(items.filter(it => it.id !== itemId));
  const addItem = (itemId: string) => { setItems([...items, { id: itemId, qtd: 0.1 }]); setPicker(false); };

  const addPasso = () => setPreparo([...preparo, '']);
  const updatePasso = (i: number, val: string) => setPreparo(preparo.map((p, idx) => idx === i ? val : p));
  const removePasso = (i: number) => setPreparo(preparo.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!user || !nome) return;
    setSaving(true);
    await updateReceita(user.uid, id, {
      nome, cat, rendimento,
      custoTotal, custoPorcao, precoSugerido, margem, taxaApp: taxa,
      ingredientes: items,
      preparo: preparo.filter(p => p.trim()),
    });
    router.push(`/receitas/${id}`);
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;
    setDeleting(true);
    await deleteReceita(user.uid, id);
    router.replace('/receitas');
  };

  const insumosDisponiveis = insumos.filter(i => !items.find(it => it.id === i.id));

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <StatusBar />
      <div className="appbar">
        <Link href={`/receitas/${id}`} className="iconbtn"><Icon name="arrowLeft" size={18} /></Link>
        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Editar receita</span>
        <Link href={`/receitas/${id}`} className="iconbtn"><Icon name="close" size={16} /></Link>
      </div>

      <div className="scroll" style={{ paddingBottom: 160 }}>
        <div className="col gap-4">
          <div className="field">
            <input value={nome} onChange={e => setNome(e.target.value)} className="serif" placeholder="Nome da receita"
              style={{ fontSize: 24, padding: '8px 0', border: 'none', borderBottom: '1.5px solid var(--line)', borderRadius: 0, letterSpacing: '-0.02em', background: 'transparent' }} />
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
                    <button onClick={() => updateQtd(d.id, -0.1)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="minus" size={12} /></button>
                    <span className="tnum" style={{ fontSize: 12, minWidth: 42, textAlign: 'center' }}>{fmtNum(d.qtd, d.un === 'un' ? 0 : 2)}</span>
                    <button onClick={() => updateQtd(d.id, 0.1)} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="plus" size={12} /></button>
                  </div>
                  <div className="tnum" style={{ fontSize: 12, color: 'var(--ink-3)', minWidth: 54, textAlign: 'right' }}>{fmtBRL(d.custo)}</div>
                  <button onClick={() => removeItem(d.id)} style={{ border: 'none', background: 'none', color: 'var(--ink-4)', padding: 4, cursor: 'pointer' }}><Icon name="close" size={14} /></button>
                </div>
              ))}
              <button onClick={() => setPicker(true)} style={{ width: '100%', padding: 14, background: 'none', border: 'none', color: 'var(--terracotta)', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderTop: items.length ? '1px dashed var(--line)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
                <Icon name="plus" size={14} /> Adicionar insumo
              </button>
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

          {/* Modo de preparo */}
          <div>
            <div className="serif" style={{ fontSize: 18, marginBottom: 10 }}>Modo de preparo</div>
            <div className="col gap-2">
              {preparo.map((passo, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--terracotta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 10 }}>{i + 1}</div>
                  <textarea
                    value={passo}
                    onChange={e => updatePasso(i, e.target.value)}
                    placeholder={`Passo ${i + 1}...`}
                    rows={2}
                    style={{ flex: 1, resize: 'vertical', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)' }}
                  />
                  <button onClick={() => removePasso(i)} style={{ border: 'none', background: 'none', color: 'var(--ink-4)', padding: '10px 4px', cursor: 'pointer' }}><Icon name="close" size={14} /></button>
                </div>
              ))}
              <button onClick={addPasso} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'var(--surface-2)', border: '1px dashed var(--line)', borderRadius: 10, color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Icon name="plus" size={14} /> Adicionar passo
              </button>
            </div>
          </div>

          {/* Excluir */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--line)' }}>
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ width: '100%', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 10, color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Icon name="trash" size={16} /> Excluir receita
            </button>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid var(--line)', padding: '14px 18px 18px', boxShadow: '0 -8px 24px -10px rgba(74,49,30,0.1)', zIndex: 30 }}>
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
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSave} disabled={saving || !nome}>
          <Icon name="check" size={16} /> {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* Picker de insumos */}
      {picker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,31,23,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 40 }} onClick={() => setPicker(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, margin: '0 auto', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '16px 18px 32px', maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, background: 'var(--line-2)', borderRadius: 2, margin: '0 auto 14px' }} />
            <div className="serif" style={{ fontSize: 18, marginBottom: 12 }}>Adicionar insumo</div>
            <div className="col gap-2">
              {insumosDisponiveis.map(ins => (
                <button key={ins.id} onClick={() => addItem(ins.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', border: 'none', borderRadius: 10, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 18 }}>{ins.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{ins.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtBRL(ins.custoUn)}/{ins.un}</div>
                  </div>
                  <Icon name="plus" size={14} color="var(--terracotta)" />
                </button>
              ))}
              {insumosDisponiveis.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: '12px 0' }}>Todos os insumos já foram adicionados.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Excluir receita?"
          message="Esta ação não pode ser desfeita."
          confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function EditarReceita() {
  return <AuthGuard><EditarReceitaContent /></AuthGuard>;
}
