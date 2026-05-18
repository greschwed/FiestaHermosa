'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StatusBar from '@/components/StatusBar';
import AuthGuard from '@/components/AuthGuard';
import ConfirmModal from '@/components/ConfirmModal';
import Icon from '@/components/Icon';
import { useAuth } from '@/lib/auth-context';
import { getCardapioItem, updateCardapioItem, deleteCardapioItem } from '@/lib/firestore';
import type { CardapioItem } from '@/lib/data';
import { CATEGORIAS_CARDAPIO } from '@/lib/data';

function EditarItemContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_CARDAPIO[0]);
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState(1);
  const [fotoAtual, setFotoAtual] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    getCardapioItem(user.uid, id).then(item => {
      if (!item) { router.push('/cardapio/admin'); return; }
      setNome(item.nome);
      setCategoria(item.categoria);
      setPreco(item.preco.toFixed(2));
      setDescricao(item.descricao ?? '');
      setOrdem(item.ordem);
      setFotoAtual(item.foto ?? '');
      setLoading(false);
    });
  }, [user, id, router]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSave() {
    if (!user) return;
    if (!nome.trim()) { setErro('Informe o nome do item.'); return; }
    const precoNum = parseFloat(preco.replace(',', '.'));
    if (!preco || isNaN(precoNum) || precoNum <= 0) { setErro('Informe um preço válido.'); return; }

    setSaving(true);
    setErro('');
    try {
      const data: Partial<Omit<CardapioItem, 'id'>> = {
        nome: nome.trim(),
        categoria,
        preco: precoNum,
        ordem,
      };
      if (descricao.trim()) data.descricao = descricao.trim();
      // Se removeu a foto e não selecionou nova, limpa o campo
      if (!preview && !fotoAtual) data.foto = undefined;

      await updateCardapioItem(user.uid, id, data, file ?? undefined);
      router.push('/cardapio/admin');
    } catch {
      setErro('Erro ao salvar. Tente novamente.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    await deleteCardapioItem(user.uid, id);
    router.push('/cardapio/admin');
  }

  const fotoExibida = preview || fotoAtual;

  if (loading) {
    return (
      <div className="app-shell">
        <StatusBar />
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <StatusBar />

      <div className="appbar">
        <button className="iconbtn" onClick={() => router.back()}>
          <Icon name="arrowLeft" size={18} />
        </button>
        <h1 className="serif">Editar item</h1>
        <button className="iconbtn" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" size={17} />
        </button>
      </div>

      <div className="scroll" style={{ padding: '0 20px 100px' }}>

        {/* Upload de foto */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', aspectRatio: '1/1', borderRadius: 'var(--radius)',
            border: fotoExibida ? 'none' : '2px dashed var(--line-2)',
            background: fotoExibida ? 'none' : 'var(--surface-2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, cursor: 'pointer',
            marginTop: 20, marginBottom: 20, overflow: 'hidden', padding: 0,
          }}
        >
          {fotoExibida ? (
            <img src={fotoExibida} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Icon name="camera" size={32} color="var(--ink-3)" />
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)' }}>Adicionar foto</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>JPG ou PNG · máx. 5 MB</div>
            </>
          )}
        </button>
        {fotoExibida && (
          <button
            onClick={() => { setFile(null); setPreview(''); setFotoAtual(''); }}
            style={{
              width: '100%', padding: '8px', marginTop: -12, marginBottom: 20,
              fontSize: 12, color: 'var(--ink-3)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Remover foto
          </button>
        )}

        {/* Nome */}
        <div className="field">
          <label>Nome</label>
          <input
            type="text"
            placeholder="Ex: Brigadeiro Belga"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
        </div>

        {/* Categoria */}
        <div className="field">
          <label>Categoria</label>
          <select value={categoria} onChange={e => setCategoria(e.target.value)}>
            {CATEGORIAS_CARDAPIO.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Preço e Ordem */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Preço</label>
            <div className="input-prefix">
              <span className="prefix">R$</span>
              <input
                type="number"
                placeholder="0,00"
                min="0"
                step="0.01"
                value={preco}
                onChange={e => setPreco(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Ordem</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setOrdem(o => Math.max(1, o - 1))}
                style={{
                  width: 46, height: 46, background: 'var(--surface-2)',
                  border: 'none', borderRight: '1px solid var(--line)',
                  fontSize: 20, color: 'var(--ink-3)', cursor: 'pointer', flexShrink: 0,
                }}
              >−</button>
              <input
                type="number"
                min="1"
                value={ordem}
                onChange={e => setOrdem(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  flex: 1, textAlign: 'center', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 600, background: 'transparent',
                  padding: 0, fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setOrdem(o => o + 1)}
                style={{
                  width: 46, height: 46, background: 'var(--surface-2)',
                  border: 'none', borderLeft: '1px solid var(--line)',
                  fontSize: 20, color: 'var(--ink-3)', cursor: 'pointer', flexShrink: 0,
                }}
              >+</button>
            </div>
          </div>
        </div>

        {/* Descrição */}
        <div className="field">
          <label>Descrição <span style={{ color: 'var(--ink-4)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
          <input
            type="text"
            placeholder="Ex: Chocolate 70% cacau, granulado importado"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>

        {erro && (
          <div style={{
            background: 'var(--danger-bg)', border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            fontSize: 13, color: 'var(--danger)', marginTop: 4,
          }}>
            {erro}
          </div>
        )}
      </div>

      {/* Barra de ações fixa */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px', background: 'var(--bg)',
        borderTop: '1px solid var(--line)', display: 'flex', gap: 10,
      }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: 'center', borderRadius: 999 }}
          onClick={() => router.back()}
        >
          Cancelar
        </button>
        <button
          className="btn btn-primary"
          style={{ flex: 2, justifyContent: 'center', borderRadius: 999 }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Excluir item"
          message={`Remover "${nome}" do cardápio permanentemente?`}
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

export default function EditarItemPage() {
  return <AuthGuard><EditarItemContent /></AuthGuard>;
}
