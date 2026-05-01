'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/lib/auth-context';
import { getInsumo, updateInsumo, deleteInsumo, getReceitas, recalcReceitasComInsumo } from '@/lib/firestore';
import { UNIDADES } from '@/lib/data';
import type { Receita } from '@/lib/data';

function EditarInsumoContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [nome, setNome] = useState('');
  const [un, setUn] = useState('kg');
  const [preco, setPreco] = useState('');
  const [qtd, setQtd] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [receitasAfetadas, setReceitasAfetadas] = useState<Receita[]>([]);
  const [deleting, setDeleting] = useState(false);

  const custoUn = (parseFloat(preco) || 0) / (parseFloat(qtd) || 1);

  useEffect(() => {
    if (!user) return;
    getInsumo(user.uid, id).then(ins => {
      if (!ins) { router.replace('/insumos'); return; }
      setNome(ins.nome);
      setUn(ins.un);
      setPreco(String(ins.precoCompra));
      setQtd(String(ins.qtdCompra));
      setLoading(false);
    });
  }, [user, id, router]);

  const handleSave = async () => {
    if (!user || !nome || !preco) return;
    setSaving(true);
    await updateInsumo(user.uid, id, {
      nome, un,
      precoCompra: parseFloat(preco),
      qtdCompra: parseFloat(qtd),
      custoUn,
    });
    await recalcReceitasComInsumo(user.uid, id);
    router.push('/insumos');
  };

  const handleDeleteClick = async () => {
    if (!user) return;
    const receitas = await getReceitas(user.uid);
    const afetadas = receitas.filter(r => r.ingredientes.some(i => i.id === id));
    setReceitasAfetadas(afetadas);
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user) return;
    setDeleting(true);
    await deleteInsumo(user.uid, id);
    router.replace('/insumos');
  };

  if (loading) {
    return (
      <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <StatusBar />
      <div className="appbar">
        <Link href="/insumos" className="iconbtn"><Icon name="arrowLeft" size={18} /></Link>
        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Editar insumo</span>
        <Link href="/insumos" className="iconbtn"><Icon name="close" size={16} /></Link>
      </div>

      <div className="scroll">
        <h2 className="serif" style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 4 }}>{nome}</h2>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>Custo unitário calculado automaticamente</div>

        <div className="col gap-4">
          <div className="field">
            <label>Nome do insumo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div className="field">
            <label>Unidade</label>
            <select value={un} onChange={e => setUn(e.target.value)}>
              {UNIDADES.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div className="card-soft" style={{ background: 'var(--terracotta-bg)', padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Compra de referência</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <label>Preço pago</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input value={preco} onChange={e => setPreco(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Quantidade</label>
                <div className="input-prefix">
                  <input value={qtd} onChange={e => setQtd(e.target.value)} />
                  <span className="suffix">{un}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px dashed var(--terracotta-soft)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custo unitário</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>R$ {preco} ÷ {qtd} {un}</div>
              </div>
              <div className="serif tnum" style={{ fontSize: 24, color: 'var(--terracotta)' }}>
                R$ {custoUn.toFixed(2).replace('.', ',')}<span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/{un}</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <Link href="/insumos" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</Link>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={saving || !nome}>
            <Icon name="check" size={16} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
          <button
            onClick={handleDeleteClick}
            style={{ width: '100%', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 10, color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="trash" size={16} /> Excluir insumo
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Excluir insumo?"
          message={
            receitasAfetadas.length > 0 ? (
              <span>
                Este insumo é usado em {receitasAfetadas.length} receita(s):{' '}
                <strong>{receitasAfetadas.map(r => r.nome).join(', ')}</strong>.
                Ele será removido dessas receitas.
              </span>
            ) : 'Esta ação não pode ser desfeita.'
          }
          confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
          danger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function EditarInsumo() {
  return <AuthGuard><EditarInsumoContent /></AuthGuard>;
}
