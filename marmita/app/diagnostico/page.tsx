'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import type { Insumo, Receita } from '@/lib/data';

interface LegacyMaterial {
  id: string; nome: string; unidadeCompra: string; unidadeReceita: string;
  precoCompra: number; quantidadeCompra: number; custoPorUnidadeReceita: number;
  userId: string;
}
interface LegacyReceita {
  id: string; nome: string; custoTotal: number; margemLucro: number;
  precoVendaSugerido: number; instrucoes: string;
  ingredientes: { materialId: string; nomeMaterial: string; quantidade: number; unidadeMaterial: string; custoIngrediente: number }[];
  userId: string;
}
interface NewInsumo { id: string; nome: string; un: string; custoUn: number }
interface NewReceita { id: string; nome: string; custoTotal: number; ingredientes: { id: string; qtd: number }[] }

interface CheckResult {
  legacyMateriais: LegacyMaterial[];
  legacyReceitas: LegacyReceita[];
  newInsumos: NewInsumo[];
  newReceitas: NewReceita[];
}

interface ImportResult { imported: number; skipped: number; errors: string[] }

function classifyReceita(nome: string): string {
  const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (/\b(bolo|cupcake|muffin)\b/.test(n)) return 'Bolos';
  if (/\b(pao|paes|broa|focaccia|ciabatta|croissant|brioche|bisnaga|pao de)\b/.test(n)) return 'Pães';
  if (/\b(biscoito|bolacha|cookie)\b/.test(n)) return 'Biscoitos e Bolachas';
  if (/\b(trufa|trufas)\b/.test(n) || /\bchocolate\b/.test(n)) return 'Chocolates e Trufas';
  if (/\b(torta|quiche|empadao)\b/.test(n)) {
    if (/salgad|frango|atum|queijo|legum|vegetal|carne|presunto|espinafre|alho|bacon/.test(n)) return 'Tortas Salgadas';
    return 'Tortas Doce';
  }
  if (/\b(coxinha|pastel|esfiha|empada|croquete|risole|bolinha|salgado|petisco|quibe)\b/.test(n)) return 'Salgados e Petiscos';
  if (/\b(brigadeiro|beijinho|docinho|mousse|pudim|flan|pirulito|caramelo|doce)\b/.test(n)) return 'Doces';
  return '';
}

export default function DiagnosticoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categorizing, setCategorizing] = useState(false);
  const [catResult, setCatResult] = useState<{ updated: number; unchanged: number; unknown: string[] } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const runCheck = async () => {
    if (!user) return;
    setChecking(true);
    setError(null);
    setImportResult(null);
    try {
      const [mSnap, rSnap, iSnap, nrSnap] = await Promise.all([
        getDocs(query(collection(db, 'materiais'), where('userId', '==', user.uid), orderBy('nome'))),
        getDocs(query(collection(db, 'receitas'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'users', user.uid, 'insumos'), orderBy('nome'))),
        getDocs(query(collection(db, 'users', user.uid, 'receitas'), orderBy('nome'))),
      ]);
      setResult({
        legacyMateriais: mSnap.docs.map(d => ({ id: d.id, ...d.data() } as LegacyMaterial)),
        legacyReceitas: rSnap.docs.map(d => ({ id: d.id, ...d.data() } as LegacyReceita)),
        newInsumos: iSnap.docs.map(d => ({ id: d.id, ...d.data() } as NewInsumo)),
        newReceitas: nrSnap.docs.map(d => ({ id: d.id, ...d.data() } as NewReceita)),
      });
    } catch (e) { setError(String(e)); }
    finally { setChecking(false); }
  };

  const importFromOtherAccounts = async () => {
    if (!user) return;
    setImporting(true);
    setError(null);
    setImportResult(null);
    const res: ImportResult = { imported: 0, skipped: 0, errors: [] };

    try {
      // Lê TODOS os materiais e receitas da coleção raiz (todas as contas)
      const [allMat, allRec, myInsumos, myReceitas] = await Promise.all([
        getDocs(collection(db, 'materiais')),
        getDocs(collection(db, 'receitas')),
        getDocs(collection(db, 'users', user.uid, 'insumos')),
        getDocs(collection(db, 'users', user.uid, 'receitas')),
      ]);

      const existingInsumoIds = new Set(myInsumos.docs.map(d => d.id));
      const existingReceitaIds = new Set(myReceitas.docs.map(d => d.id));

      const batch: Promise<unknown>[] = [];

      // Importa materiais de outras contas
      for (const d of allMat.docs) {
        const old = d.data() as LegacyMaterial & { userId?: string };
        if (old.userId === user.uid) continue; // já é meu
        if (existingInsumoIds.has(d.id)) { res.skipped++; continue; }

        const insumo: Omit<Insumo, 'id'> = {
          nome: old.nome ?? '',
          cat: 'Outros',
          un: old.unidadeReceita ?? old.unidadeCompra ?? 'un',
          precoCompra: Number(old.precoCompra) || 0,
          qtdCompra: Number(old.quantidadeCompra) || 1,
          custoUn: Number(old.custoPorUnidadeReceita) || 0,
          estoque: 0,
          ultCompra: '',
          emoji: '📦',
        };
        batch.push(
          setDoc(doc(db, 'users', user.uid, 'insumos', d.id), insumo)
            .then(() => res.imported++)
            .catch(e => res.errors.push(`insumo ${old.nome}: ${e}`))
        );
      }

      // Importa receitas de outras contas
      for (const d of allRec.docs) {
        const old = d.data() as LegacyReceita & { userId?: string };
        if (old.userId === user.uid) continue; // já é minha
        if (existingReceitaIds.has(d.id)) { res.skipped++; continue; }

        const ingredientes = (old.ingredientes ?? []).map(ing => ({
          id: ing.materialId ?? '',
          qtd: Number(ing.quantidade) || 0,
        }));

        let preparo: string[] = [];
        if (typeof old.instrucoes === 'string' && old.instrucoes.trim()) {
          preparo = old.instrucoes.split('\n').map(s => s.trim()).filter(Boolean);
        }

        const rendimento = 1;
        const custoTotal = Number(old.custoTotal) || 0;
        const receita: Omit<Receita, 'id'> = {
          nome: old.nome ?? '',
          cat: 'Outros',
          rendimento,
          custoTotal,
          custoPorcao: custoTotal,
          precoSugerido: Number(old.precoVendaSugerido) || 0,
          margem: Number(old.margemLucro) || 30,
          taxaApp: 0,
          foto: '',
          ingredientes,
          preparo,
        };
        batch.push(
          setDoc(doc(db, 'users', user.uid, 'receitas', d.id), receita)
            .then(() => res.imported++)
            .catch(e => res.errors.push(`receita ${old.nome}: ${e}`))
        );
      }

      await Promise.all(batch);
      setImportResult(res);
      // Atualiza a visão após importar
      await runCheck();
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  };

  const autoCategorize = async () => {
    if (!user) return;
    setCategorizing(true);
    setCatResult(null);
    const snap = await getDocs(collection(db, 'users', user.uid, 'receitas'));
    const res = { updated: 0, unchanged: 0, unknown: [] as string[] };
    await Promise.all(snap.docs.map(async d => {
      const nome = (d.data().nome as string) ?? '';
      const cat = classifyReceita(nome);
      if (!cat) { res.unknown.push(nome); return; }
      if (d.data().cat === cat) { res.unchanged++; return; }
      await updateDoc(doc(db, 'users', user.uid, 'receitas', d.id), { cat });
      res.updated++;
    }));
    setCatResult(res);
    setCategorizing(false);
  };

  if (loading || !user) return null;

  const myInsumoIds = result ? new Set(result.newInsumos.map(i => i.id)) : new Set<string>();
  const myReceitaIds = result ? new Set(result.newReceitas.map(r => r.id)) : new Set<string>();

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'sans-serif', fontSize: 20, marginBottom: 4 }}>Diagnóstico de Migração</h1>
      <p style={{ color: '#666', marginBottom: 20 }}>
        Logado como: <strong>{user.email}</strong> &nbsp;|&nbsp;
        UID: <span style={{ fontSize: 11 }}>{user.uid}</span>
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={runCheck} disabled={checking || importing} style={btnStyle('#2563eb')}>
          {checking ? 'Verificando…' : '🔍 Verificar dados desta conta'}
        </button>
        <button onClick={importFromOtherAccounts} disabled={checking || importing} style={btnStyle('#c2603e')}>
          {importing ? 'Importando…' : '📥 Importar dados de outras contas'}
        </button>
        <button onClick={autoCategorize} disabled={categorizing} style={btnStyle('#2a7a2a')}>
          {categorizing ? 'Categorizando…' : '🏷️ Auto-categorizar receitas por nome'}
        </button>
      </div>

      {catResult && (
        <div style={{ background: '#d4edda', border: '1px solid #28a745', padding: 16, borderRadius: 8, marginBottom: 20 }}>
          <strong>Categorização concluída</strong><br />
          ✅ {catResult.updated} receita(s) atualizadas &nbsp;|&nbsp;
          ⏭ {catResult.unchanged} já corretas
          {catResult.unknown.length > 0 && (
            <div style={{ marginTop: 8, color: '#856404' }}>
              ⚠️ Não reconhecidas (mantidas sem alteração):{' '}
              <em>{catResult.unknown.join(', ')}</em>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: '#fee', border: '1px solid #c00', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          ❌ Erro: {error}
        </div>
      )}

      {importResult && (
        <div style={{
          background: importResult.errors.length ? '#fff8e1' : '#d4edda',
          border: `1px solid ${importResult.errors.length ? '#f9a825' : '#28a745'}`,
          padding: 16, borderRadius: 8, marginBottom: 20
        }}>
          <strong>Importação concluída</strong><br />
          ✅ {importResult.imported} item(ns) importado(s) &nbsp;|&nbsp;
          ⏭ {importResult.skipped} já existia(m)<br />
          {importResult.errors.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 16, color: '#b45309' }}>
              {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Ingredientes legados', count: result.legacyMateriais.length, col: '#e8f4fd' },
              { label: 'Ingredientes novos', count: result.newInsumos.length, col: '#e8fde8' },
              { label: 'Receitas legadas', count: result.legacyReceitas.length, col: '#e8f4fd' },
              { label: 'Receitas novas', count: result.newReceitas.length, col: '#e8fde8' },
            ].map(({ label, count, col }) => (
              <div key={label} style={{ background: col, padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#555' }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{count}</div>
              </div>
            ))}
          </div>

          <h2 style={h2}>Ingredientes (nova estrutura)</h2>
          <table style={tableStyle}>
            <thead><tr style={{ background: '#f0f0f0' }}>
              <th style={th}>Nome</th><th style={th}>Unidade</th>
              <th style={th}>Custo/un</th><th style={th}>Origem</th>
            </tr></thead>
            <tbody>
              {result.newInsumos.map(i => {
                const fromLegacy = result.legacyMateriais.find(m => m.id === i.id);
                return (
                  <tr key={i.id}>
                    <td style={td}>{i.nome}</td>
                    <td style={td}>{i.un}</td>
                    <td style={td}>R$ {i.custoUn?.toFixed(4)}</td>
                    <td style={td}>{fromLegacy ? '🔄 migrado' : '✨ novo'}</td>
                  </tr>
                );
              })}
              {result.newInsumos.length === 0 && <tr><td colSpan={4} style={{ ...td, color: '#999', textAlign: 'center' }}>Nenhum</td></tr>}
            </tbody>
          </table>

          <h2 style={h2}>Receitas (nova estrutura)</h2>
          <table style={tableStyle}>
            <thead><tr style={{ background: '#f0f0f0' }}>
              <th style={th}>Nome</th><th style={th}>Ingredientes</th>
              <th style={th}>Custo total</th><th style={th}>Origem</th>
            </tr></thead>
            <tbody>
              {result.newReceitas.map(r => {
                const fromLegacy = result.legacyReceitas.find(l => l.id === r.id);
                return (
                  <tr key={r.id}>
                    <td style={td}>{r.nome}</td>
                    <td style={td}>{r.ingredientes?.length ?? 0} itens</td>
                    <td style={td}>R$ {r.custoTotal?.toFixed(2)}</td>
                    <td style={td}>{fromLegacy ? '🔄 migrado' : '✨ novo'}</td>
                  </tr>
                );
              })}
              {result.newReceitas.length === 0 && <tr><td colSpan={4} style={{ ...td, color: '#999', textAlign: 'center' }}>Nenhum</td></tr>}
            </tbody>
          </table>

          {/* Legado não migrado */}
          {result.legacyMateriais.filter(m => !myInsumoIds.has(m.id)).length > 0 && (
            <>
              <h2 style={{ ...h2, color: '#c00' }}>⚠️ Ingredientes legados não migrados</h2>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                {result.legacyMateriais.filter(m => !myInsumoIds.has(m.id)).map(m =>
                  <li key={m.id}>{m.nome} <span style={{ color: '#999' }}>({m.id})</span></li>
                )}
              </ul>
            </>
          )}
          {result.legacyReceitas.filter(r => !myReceitaIds.has(r.id)).length > 0 && (
            <>
              <h2 style={{ ...h2, color: '#c00' }}>⚠️ Receitas legadas não migradas</h2>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                {result.legacyReceitas.filter(r => !myReceitaIds.has(r.id)).map(r =>
                  <li key={r.id}>{r.nome} <span style={{ color: '#999' }}>({r.id})</span></li>
                )}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none',
  padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
});
const h2: React.CSSProperties = { fontFamily: 'sans-serif', fontSize: 14, margin: '20px 0 8px' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: 16 };
const th: React.CSSProperties = { padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11 };
const td: React.CSSProperties = { padding: '5px 10px', borderBottom: '1px solid #eee' };
