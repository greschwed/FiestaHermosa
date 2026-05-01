'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface LegacyMaterial {
  id: string;
  nome: string;
  unidadeCompra: string;
  unidadeReceita: string;
  precoCompra: number;
  custoPorUnidadeReceita: number;
}

interface LegacyReceita {
  id: string;
  nome: string;
  custoTotal: number;
  ingredientes: { materialId: string; nomeMaterial: string; quantidade: number }[];
}

interface NewInsumo { id: string; nome: string; un: string; custoUn: number }
interface NewReceita { id: string; nome: string; custoTotal: number; ingredientes: { id: string; qtd: number }[] }

interface Result {
  legacyMateriais: LegacyMaterial[];
  legacyReceitas: LegacyReceita[];
  newInsumos: NewInsumo[];
  newReceitas: NewReceita[];
}

export default function DiagnosticoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  const runCheck = async () => {
    if (!user) return;
    setChecking(true);
    setError(null);
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
    } catch (e) {
      setError(String(e));
    } finally {
      setChecking(false);
    }
  };

  if (loading || !user) return null;

  const migratedInsumoIds = result ? new Set(result.newInsumos.map(i => i.id)) : new Set();
  const migratedReceitaIds = result ? new Set(result.newReceitas.map(r => r.id)) : new Set();

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', fontSize: 13, maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'sans-serif', fontSize: 20, marginBottom: 8 }}>Diagnóstico de Migração</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>Usuário: {user.email}</p>

      <button
        onClick={runCheck}
        disabled={checking}
        style={{
          background: '#c2603e', color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
          fontSize: 14, marginBottom: 24, opacity: checking ? 0.6 : 1,
        }}
      >
        {checking ? 'Verificando…' : 'Verificar agora'}
      </button>

      {error && (
        <div style={{ background: '#fee', border: '1px solid #c00', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Erro: {error}
        </div>
      )}

      {result && (
        <>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Ingredientes legados (materiais)', count: result.legacyMateriais.length, col: '#e8f4fd' },
              { label: 'Ingredientes migrados (insumos)', count: result.newInsumos.length, col: '#e8fde8' },
              { label: 'Receitas legadas', count: result.legacyReceitas.length, col: '#e8f4fd' },
              { label: 'Receitas migradas', count: result.newReceitas.length, col: '#e8fde8' },
            ].map(({ label, count, col }) => (
              <div key={label} style={{ background: col, padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#555' }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{count}</div>
              </div>
            ))}
          </div>

          {/* Ingredientes comparison */}
          <h2 style={{ fontFamily: 'sans-serif', fontSize: 15, marginBottom: 8 }}>Ingredientes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={th}>Nome (legado)</th>
                <th style={th}>ID</th>
                <th style={th}>Migrado?</th>
                <th style={th}>Nome (novo)</th>
              </tr>
            </thead>
            <tbody>
              {result.legacyMateriais.map(m => {
                const novo = result.newInsumos.find(i => i.id === m.id);
                return (
                  <tr key={m.id} style={{ background: novo ? '#f6fff6' : '#fff6f6' }}>
                    <td style={td}>{m.nome}</td>
                    <td style={{ ...td, fontSize: 11, color: '#888' }}>{m.id.slice(0, 8)}…</td>
                    <td style={{ ...td, textAlign: 'center' }}>{novo ? '✅' : '❌'}</td>
                    <td style={td}>{novo ? novo.nome : '—'}</td>
                  </tr>
                );
              })}
              {result.legacyMateriais.length === 0 && (
                <tr><td colSpan={4} style={{ ...td, color: '#999', textAlign: 'center' }}>Nenhum ingrediente legado encontrado</td></tr>
              )}
            </tbody>
          </table>

          {/* Receitas comparison */}
          <h2 style={{ fontFamily: 'sans-serif', fontSize: 15, marginBottom: 8 }}>Receitas</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={th}>Nome (legado)</th>
                <th style={th}>ID</th>
                <th style={th}>Ingredientes</th>
                <th style={th}>Migrada?</th>
              </tr>
            </thead>
            <tbody>
              {result.legacyReceitas.map(r => {
                const migrada = migratedReceitaIds.has(r.id);
                const novo = result.newReceitas.find(nr => nr.id === r.id);
                return (
                  <tr key={r.id} style={{ background: migrada ? '#f6fff6' : '#fff6f6' }}>
                    <td style={td}>{r.nome}</td>
                    <td style={{ ...td, fontSize: 11, color: '#888' }}>{r.id.slice(0, 8)}…</td>
                    <td style={td}>
                      {r.ingredientes?.length ?? 0} → {novo?.ingredientes?.length ?? '?'}
                    </td>
                    <td style={{ ...td, textAlign: 'center' }}>{migrada ? '✅' : '❌'}</td>
                  </tr>
                );
              })}
              {result.legacyReceitas.length === 0 && (
                <tr><td colSpan={4} style={{ ...td, color: '#999', textAlign: 'center' }}>Nenhuma receita legada encontrada</td></tr>
              )}
            </tbody>
          </table>

          {/* Orphan check */}
          {result.newInsumos.filter(i => !migratedInsumoIds.has(i.id) && result.legacyMateriais.length > 0).length > 0 && (
            <>
              <h2 style={{ fontFamily: 'sans-serif', fontSize: 15, marginBottom: 8 }}>
                Ingredientes só no novo (seed/manual)
              </h2>
              <ul style={{ marginBottom: 24, paddingLeft: 20 }}>
                {result.newInsumos
                  .filter(i => !result.legacyMateriais.find(m => m.id === i.id))
                  .map(i => <li key={i.id}>{i.nome} <span style={{ color: '#999' }}>({i.id})</span></li>)
                }
              </ul>
            </>
          )}

          {/* All migrated */}
          {result.legacyMateriais.length > 0 &&
           result.legacyMateriais.every(m => migratedInsumoIds.has(m.id)) &&
           result.legacyReceitas.every(r => migratedReceitaIds.has(r.id)) && (
            <div style={{ background: '#d4edda', border: '1px solid #28a745', padding: 16, borderRadius: 8, fontSize: 14 }}>
              ✅ <strong>Migração completa!</strong> Todos os ingredientes e receitas foram migrados corretamente.
            </div>
          )}
        </>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: 11 };
const td: React.CSSProperties = { padding: '6px 10px', borderBottom: '1px solid #eee' };
