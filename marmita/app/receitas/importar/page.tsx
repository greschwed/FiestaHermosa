'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getInsumos, addInsumo, addReceita } from '@/lib/firestore';
import type { Insumo } from '@/lib/data';
import { CATEGORIAS_RECEITA, UNIDADES, fmtBRL } from '@/lib/data';

// ── types ──────────────────────────────────────────────────────
interface ExtractedIng { nome: string; qtd: number; un: string; }
interface ExtractedData {
  nome: string; rendimento: number;
  ingredientes: ExtractedIng[];
  preparo: string[];
}
interface ResolvedIng {
  nome: string; qtd: number; un: string;
  insumoId: string | null;
  qtdFinal: number;
  skip: boolean;
}

type Phase = 'capture' | 'processing' | 'review' | 'creating';

// ── helpers ────────────────────────────────────────────────────
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function convertQty(qty: number, from: string, to: string): number {
  if (from === to) return qty;
  if (from === 'g' && to === 'kg') return qty / 1000;
  if (from === 'ml' && to === 'L') return qty / 1000;
  if (from === 'kg' && to === 'g') return qty * 1000;
  if (from === 'L' && to === 'ml') return qty * 1000;
  return qty;
}

function matchInsumo(ing: ExtractedIng, insumos: Insumo[]): { id: string; qtdFinal: number } | null {
  const n = norm(ing.nome);
  const found = insumos.find(i => {
    const m = norm(i.nome);
    return m === n || m.includes(n) || n.includes(m);
  });
  if (!found) return null;
  return { id: found.id, qtdFinal: Math.round(convertQty(ing.qtd, ing.un, found.un) * 1000) / 1000 };
}

function classifyNome(nome: string): string {
  const n = norm(nome);
  if (/\bbolo\b|\bcupcake\b|\bmuffin\b/.test(n)) return 'Bolos';
  if (/\bpao\b|\bpaes\b|\bbroa\b|\bcroissant\b|\bbrioche\b/.test(n)) return 'Pães';
  if (/\bbiscoito\b|\bbolacha\b|\bcookie\b/.test(n)) return 'Biscoitos e Bolachas';
  if (/\btrufa\b|\btrufas\b|\bchocolate\b/.test(n)) return 'Chocolates e Trufas';
  if (/\btorta\b|\bquiche\b/.test(n)) {
    return /salgad|frango|atum|queijo|carne|bacon/.test(n) ? 'Tortas Salgadas' : 'Tortas Doce';
  }
  if (/\bcoxinha\b|\bpastel\b|\besfiha\b|\bempada\b|\bsalgado\b/.test(n)) return 'Salgados e Petiscos';
  if (/\bbrigadeiro\b|\bdocinho\b|\bmousse\b|\bpudim\b|\bdoce\b/.test(n)) return 'Doces';
  return CATEGORIAS_RECEITA[0];
}

async function resizeToBase64(file: File): Promise<{ base64: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({
        base64: canvas.toDataURL('image/jpeg', 0.85).split(',')[1],
      });
    };
    img.src = url;
  });
}

// ── component ──────────────────────────────────────────────────
function ImportarReceitaContent() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>('capture');
  const [preview, setPreview] = useState('');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [error, setError] = useState('');

  // Reviewed recipe state
  const [nome, setNome] = useState('');
  const [cat, setCat] = useState(CATEGORIAS_RECEITA[0]);
  const [rendimento, setRendimento] = useState(1);
  const [preparo, setPreparo] = useState<string[]>([]);
  const [resolved, setResolved] = useState<ResolvedIng[]>([]);

  // Missing ingredient creation flow
  const [missingQueue, setMissingQueue] = useState<number[]>([]);
  const [missingPos, setMissingPos] = useState(0);
  const [criarNome, setCriarNome] = useState('');
  const [criarUn, setCriarUn] = useState('kg');
  const [criarPreco, setCriarPreco] = useState('');
  const [criarQtd, setCriarQtd] = useState('1');
  const [criando, setCriando] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getInsumos(user.uid).then(setInsumos);
  }, [user]);

  // ── file handling ──────────────────────────────────────────
  const openCamera = () => {
    if (!fileRef.current) return;
    fileRef.current.setAttribute('capture', 'environment');
    fileRef.current.value = '';
    fileRef.current.click();
  };

  const openGallery = () => {
    if (!fileRef.current) return;
    fileRef.current.removeAttribute('capture');
    fileRef.current.value = '';
    fileRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setPhase('processing');
    setError('');

    try {
      const { base64 } = await resizeToBase64(file);
      const res = await fetch('/api/parse-receita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro na análise');
      const data: ExtractedData = await res.json();

      // Match ingredients against existing insumos
      const resolvedIngs: ResolvedIng[] = (data.ingredientes ?? []).map(ing => {
        const match = matchInsumo(ing, insumos);
        return {
          nome: ing.nome, qtd: ing.qtd, un: ing.un,
          insumoId: match?.id ?? null,
          qtdFinal: match?.qtdFinal ?? ing.qtd,
          skip: false,
        };
      });

      setNome(data.nome ?? '');
      setCat(classifyNome(data.nome ?? ''));
      setRendimento(data.rendimento ?? 1);
      setPreparo(data.preparo ?? []);
      setResolved(resolvedIngs);
      setPhase('review');
    } catch (e) {
      setError(String(e));
      setPhase('capture');
    }
  };

  // ── missing ingredient creation ───────────────────────────
  const startCreating = () => {
    const queue = resolved
      .map((r, i) => (!r.insumoId && !r.skip ? i : -1))
      .filter(i => i >= 0);
    if (queue.length === 0) { handleSave(); return; }
    setMissingQueue(queue);
    setMissingPos(0);
    prepareForm(resolved[queue[0]]);
    setPhase('creating');
  };

  const prepareForm = (r: ResolvedIng) => {
    setCriarNome(r.nome);
    const baseUn = r.un === 'g' ? 'kg' : r.un === 'ml' ? 'L' : r.un;
    setCriarUn(UNIDADES.includes(baseUn) ? baseUn : 'un');
    setCriarPreco('');
    setCriarQtd('1');
  };

  const handleCreateInsumo = async () => {
    if (!user || !criarNome || !criarPreco) return;
    setCriando(true);

    const custoUn = (parseFloat(criarPreco) || 0) / (parseFloat(criarQtd) || 1);
    const id = await addInsumo(user.uid, {
      nome: criarNome, cat: '', un: criarUn,
      precoCompra: parseFloat(criarPreco),
      qtdCompra: parseFloat(criarQtd),
      custoUn, estoque: 0, ultCompra: '', emoji: '📦',
    });

    const newInsumo: Insumo = {
      id, nome: criarNome, cat: '', un: criarUn,
      precoCompra: parseFloat(criarPreco),
      qtdCompra: parseFloat(criarQtd),
      custoUn, estoque: 0, ultCompra: '', emoji: '📦',
    };
    setInsumos(prev => [...prev, newInsumo]);

    // Update the resolved entry
    const resolvedIdx = missingQueue[missingPos];
    const ing = resolved[resolvedIdx];
    const qtdFinal = Math.round(convertQty(ing.qtd, ing.un, criarUn) * 1000) / 1000;
    setResolved(prev => prev.map((r, i) =>
      i === resolvedIdx ? { ...r, insumoId: id, qtdFinal } : r
    ));

    setCriando(false);
    advance();
  };

  const skipCurrent = () => {
    const resolvedIdx = missingQueue[missingPos];
    setResolved(prev => prev.map((r, i) => i === resolvedIdx ? { ...r, skip: true } : r));
    advance();
  };

  const advance = () => {
    const nextPos = missingPos + 1;
    if (nextPos >= missingQueue.length) {
      setPhase('review');
      return;
    }
    setMissingPos(nextPos);
    prepareForm(resolved[missingQueue[nextPos]]);
  };

  // ── save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || !nome) return;
    setSaving(true);

    const allInsumos = insumos;
    const ingredientes = resolved
      .filter(r => r.insumoId && !r.skip)
      .map(r => ({ id: r.insumoId!, qtd: r.qtdFinal }));

    const custoTotal = ingredientes.reduce((s, ing) => {
      const ins = allInsumos.find(i => i.id === ing.id);
      return s + (ins ? ing.qtd * ins.custoUn : 0);
    }, 0);
    const custoPorcao = custoTotal / (rendimento || 1);
    const margem = 60;
    const taxaApp = 18;
    const precoSugerido = (custoPorcao * (1 + margem / 100)) / (1 - taxaApp / 100);

    await addReceita(user.uid, {
      nome, cat, rendimento,
      custoTotal, custoPorcao, precoSugerido,
      margem, taxaApp, foto: '',
      ingredientes,
      preparo: preparo.filter(p => p.trim()),
    });
    router.push('/receitas');
  };

  const missingCount = resolved.filter(r => !r.insumoId && !r.skip).length;
  const insumoMap = new Map(insumos.map(i => [i.id, i]));

  // ──────────────────────────────────────────────────────────
  // PHASE: capture
  // ──────────────────────────────────────────────────────────
  if (phase === 'capture') {
    return (
      <div className="app-shell">
        <StatusBar />
        <div className="appbar">
          <Link href="/receitas" className="iconbtn"><Icon name="arrowLeft" size={18} /></Link>
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Importar por foto</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="scroll">
          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 24, textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--terracotta-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={40} color="var(--terracotta)" />
            </div>
            <div>
              <div className="serif" style={{ fontSize: 24, letterSpacing: '-0.02em' }}>Importar receita</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
                Fotografe uma receita impressa ou escrita à mão. A IA vai extrair os ingredientes e o modo de preparo automaticamente.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <button onClick={openCamera} className="btn btn-primary" style={{ justifyContent: 'center', gap: 10 }}>
                <Icon name="camera" size={18} /> Tirar foto
              </button>
              <button onClick={openGallery} className="btn btn-ghost" style={{ justifyContent: 'center', gap: 10 }}>
                <Icon name="image" size={18} /> Escolher da galeria
              </button>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // PHASE: processing
  // ──────────────────────────────────────────────────────────
  if (phase === 'processing') {
    return (
      <div className="app-shell">
        <StatusBar />
        <div className="appbar">
          <div style={{ width: 36 }} />
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Analisando imagem...</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="scroll">
          {preview && (
            <img src={preview} alt="" style={{ width: '100%', borderRadius: 16, maxHeight: 300, objectFit: 'cover', marginBottom: 24 }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0', color: 'var(--ink-2)' }}>
            <Icon name="loader" size={28} style={{ animation: 'spin 1s linear infinite' }} color="var(--terracotta)" />
            <div style={{ fontSize: 14 }}>Extraindo ingredientes e preparo...</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Isso pode levar alguns segundos</div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // PHASE: creating (missing ingredient form)
  // ──────────────────────────────────────────────────────────
  if (phase === 'creating') {
    const total = missingQueue.length;
    const current = missingPos + 1;
    const custoUn = (parseFloat(criarPreco) || 0) / (parseFloat(criarQtd) || 1);

    return (
      <div className="app-shell">
        <StatusBar />
        <div className="appbar">
          <button onClick={() => setPhase('review')} className="iconbtn"><Icon name="arrowLeft" size={18} /></button>
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Insumo {current} de {total}</span>
          <div style={{ width: 36 }} />
        </div>
        <div className="scroll">
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
            {missingQueue.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i < current ? 'var(--terracotta)' : i === current - 1 ? 'var(--terracotta)' : 'var(--line)',
              }} />
            ))}
          </div>

          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Não encontrado na receita</div>
            <h2 className="serif" style={{ fontSize: 22, letterSpacing: '-0.02em', marginTop: 2, marginBottom: 20 }}>
              {resolved[missingQueue[missingPos]]?.nome}
            </h2>
          </div>

          <div className="col gap-4">
            <div className="field">
              <label>Nome do insumo</label>
              <input value={criarNome} onChange={e => setCriarNome(e.target.value)} />
            </div>
            <div className="field">
              <label>Unidade</label>
              <select value={criarUn} onChange={e => setCriarUn(e.target.value)}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="card-soft" style={{ background: 'var(--terracotta-bg)', padding: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Compra de referência</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field">
                  <label>Preço pago</label>
                  <div className="input-prefix">
                    <span className="prefix">R$</span>
                    <input value={criarPreco} onChange={e => setCriarPreco(e.target.value)} placeholder="0,00" inputMode="decimal" />
                  </div>
                </div>
                <div className="field">
                  <label>Quantidade</label>
                  <div className="input-prefix">
                    <input value={criarQtd} onChange={e => setCriarQtd(e.target.value)} inputMode="decimal" />
                    <span className="suffix">{criarUn}</span>
                  </div>
                </div>
              </div>
              {criarPreco && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px dashed var(--terracotta-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Custo unitário</div>
                  <div className="serif tnum" style={{ fontSize: 20, color: 'var(--terracotta)' }}>
                    {fmtBRL(custoUn)}<span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/{criarUn}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            <button onClick={skipCurrent} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
              Pular
            </button>
            <button
              onClick={handleCreateInsumo}
              disabled={criando || !criarNome || !criarPreco}
              className="btn btn-primary"
              style={{ flex: 2, justifyContent: 'center' }}
            >
              <Icon name="check" size={16} />
              {criando ? 'Criando...' : current < total ? 'Criar e continuar' : 'Criar e revisar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // PHASE: review
  // ──────────────────────────────────────────────────────────
  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      <StatusBar />
      <div className="appbar">
        <Link href="/receitas" className="iconbtn"><Icon name="close" size={16} /></Link>
        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Revisar receita</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="scroll" style={{ paddingBottom: 110 }}>
        <div className="col gap-4">
          {/* Name */}
          <div className="field">
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="serif"
              placeholder="Nome da receita"
              style={{ fontSize: 24, padding: '8px 0', border: 'none', borderBottom: '1.5px solid var(--line)', borderRadius: 0, letterSpacing: '-0.02em', background: 'transparent' }}
            />
          </div>

          {/* Category + servings */}
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

          {/* Ingredients */}
          <div>
            <div className="row" style={{ marginBottom: 10 }}>
              <div className="serif" style={{ fontSize: 18 }}>Ingredientes</div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{resolved.length} extraídos</span>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {resolved.map((r, i) => {
                const ins = r.insumoId ? insumoMap.get(r.insumoId) : null;
                const isLast = i === resolved.length - 1;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: r.skip
                        ? 'var(--surface-2)'
                        : ins ? 'rgba(86,138,84,0.12)' : 'var(--warn-bg)',
                    }}>
                      {r.skip
                        ? <Icon name="minus" size={12} color="var(--ink-3)" />
                        : ins
                        ? <Icon name="check" size={12} color="var(--good)" />
                        : <Icon name="alertcircle" size={12} color="var(--warn)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {r.skip
                          ? 'Ignorado'
                          : ins
                          ? `→ ${ins.emoji} ${ins.nome} · ${r.qtdFinal} ${ins.un} · ${fmtBRL(r.qtdFinal * ins.custoUn)}`
                          : `${r.qtd} ${r.un} — não encontrado`}
                      </div>
                    </div>
                    {!r.skip && !ins && (
                      <button
                        onClick={() => {
                          const queue = [i];
                          setMissingQueue(queue);
                          setMissingPos(0);
                          prepareForm(r);
                          setPhase('creating');
                        }}
                        style={{ border: 'none', background: 'none', color: 'var(--terracotta)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                      >
                        + Criar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {missingCount > 0 && (
              <button
                onClick={startCreating}
                style={{ marginTop: 10, width: '100%', padding: '11px 14px', background: 'var(--surface-2)', border: '1.5px dashed var(--terracotta)', borderRadius: 10, color: 'var(--terracotta)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon name="plus" size={14} /> Cadastrar {missingCount} insumo{missingCount !== 1 ? 's' : ''} faltante{missingCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Preparation */}
          {preparo.length > 0 && (
            <div>
              <div className="serif" style={{ fontSize: 18, marginBottom: 10 }}>Modo de preparo</div>
              <div className="col gap-2">
                {preparo.map((passo, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--terracotta)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0, marginTop: 10 }}>{i + 1}</div>
                    <textarea
                      value={passo}
                      onChange={e => setPreparo(prev => prev.map((p, idx) => idx === i ? e.target.value : p))}
                      rows={2}
                      style={{ flex: 1, resize: 'vertical', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save footer */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: '#fff', borderTop: '1px solid var(--line)', padding: '14px 18px 18px', boxShadow: '0 -8px 24px -10px rgba(74,49,30,0.1)', zIndex: 30 }}>
        {missingCount > 0 && (
          <div style={{ fontSize: 12, color: 'var(--warn)', textAlign: 'center', marginBottom: 8 }}>
            {missingCount} insumo{missingCount !== 1 ? 's' : ''} ainda não cadastrado{missingCount !== 1 ? 's' : ''} — serão ignorados ao salvar
          </div>
        )}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleSave}
          disabled={!nome || saving}
        >
          <Icon name="check" size={16} />
          {saving ? 'Salvando...' : 'Salvar receita'}
        </button>
      </div>
    </div>
  );
}

export default function ImportarReceita() {
  return <AuthGuard><ImportarReceitaContent /></AuthGuard>;
}
