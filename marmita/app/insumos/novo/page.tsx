'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import AuthGuard from '@/components/AuthGuard';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { addInsumo } from '@/lib/firestore';
import { CATEGORIAS_INSUMO, UNIDADES } from '@/lib/data';

function CadastroInsumoContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [cat, setCat] = useState('Mercearia');
  const [un, setUn] = useState('kg');
  const [preco, setPreco] = useState('');
  const [qtd, setQtd] = useState('1');
  const [estoque, setEstoque] = useState('');
  const [saving, setSaving] = useState(false);

  const custoUn = (parseFloat(preco) || 0) / (parseFloat(qtd) || 1);

  const handleSave = async () => {
    if (!user || !nome || !preco) return;
    setSaving(true);
    await addInsumo(user.uid, {
      nome, cat, un,
      precoCompra: parseFloat(preco),
      qtdCompra: parseFloat(qtd),
      custoUn,
      estoque: parseFloat(estoque) || 0,
      ultCompra: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      emoji: '📦',
    });
    router.push('/insumos');
  };

  return (
    <div className="app-shell">
      <StatusBar />
      <div className="appbar">
        <Link href="/insumos" className="iconbtn"><Icon name="arrowLeft" size={18} /></Link>
        <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Novo insumo</span>
        <Link href="/insumos" className="iconbtn"><Icon name="close" size={16} /></Link>
      </div>

      <div className="scroll">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div className="img-placeholder" style={{ width: 64, height: 64, borderRadius: 16, fontSize: 10 }}>foto</div>
          <div style={{ flex: 1 }}>
            <h2 className="serif" style={{ fontSize: 22, letterSpacing: '-0.02em' }}>Cadastrar insumo</h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Custo unitário calculado automaticamente</div>
          </div>
        </div>

        <div className="col gap-4">
          <div className="field">
            <label>Nome do insumo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Farinha de trigo" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="field">
              <label>Categoria</label>
              <select value={cat} onChange={e => setCat(e.target.value)}>
                {CATEGORIAS_INSUMO.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Unidade</label>
              <select value={un} onChange={e => setUn(e.target.value)}>
                {UNIDADES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="card-soft" style={{ background: 'var(--terracotta-bg)', padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Compra de referência</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="field">
                <label>Preço pago</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" />
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
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>R$ {preco || '0'} ÷ {qtd} {un}</div>
              </div>
              <div className="serif tnum" style={{ fontSize: 24, color: 'var(--terracotta)' }}>
                R$ {custoUn.toFixed(2).replace('.', ',')}<span style={{ fontSize: 13, color: 'var(--ink-3)' }}>/{un}</span>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Estoque atual</label>
            <div className="input-prefix">
              <input value={estoque} onChange={e => setEstoque(e.target.value)} placeholder="0" />
              <span className="suffix">{un}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <Link href="/insumos" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</Link>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleSave} disabled={saving || !nome}>
            <Icon name="check" size={16} /> {saving ? 'Salvando...' : 'Salvar insumo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CadastroInsumo() {
  return <AuthGuard><CadastroInsumoContent /></AuthGuard>;
}
