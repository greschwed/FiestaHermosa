import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, deleteDoc, updateDoc,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Insumo, Receita } from './data';

// Collections scoped per user
const insumosCol = (uid: string) => collection(db, 'users', uid, 'insumos');
const receitasCol = (uid: string) => collection(db, 'users', uid, 'receitas');

// ── Insumos ──────────────────────────────────────────────
export async function getInsumos(uid: string): Promise<Insumo[]> {
  const snap = await getDocs(query(insumosCol(uid), orderBy('nome')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Insumo));
}

export async function addInsumo(uid: string, insumo: Omit<Insumo, 'id'>): Promise<string> {
  const ref = await addDoc(insumosCol(uid), { ...insumo, criadoEm: serverTimestamp() });
  return ref.id;
}

export async function updateInsumo(uid: string, id: string, data: Partial<Insumo>) {
  await updateDoc(doc(insumosCol(uid), id), data);
}

export async function deleteInsumo(uid: string, id: string) {
  await deleteDoc(doc(insumosCol(uid), id));
}

// Recalcula custoTotal/custoPorcao/precoSugerido de todas as receitas
// que contêm o insumo alterado, usando os preços atuais da tabela de insumos.
export async function recalcReceitasComInsumo(uid: string, insumoId: string) {
  const [insumosSnap, receitasSnap] = await Promise.all([
    getDocs(insumosCol(uid)),
    getDocs(receitasCol(uid)),
  ]);

  const insumoMap = new Map(
    insumosSnap.docs.map(d => [d.id, { id: d.id, ...d.data() } as Insumo])
  );

  const updates: Promise<void>[] = [];

  for (const snap of receitasSnap.docs) {
    const rec = { id: snap.id, ...snap.data() } as Receita;
    if (!rec.ingredientes?.some(i => i.id === insumoId)) continue;

    const custoTotal = rec.ingredientes.reduce((s, ing) => {
      const ins = insumoMap.get(ing.id);
      return s + (ins ? ing.qtd * ins.custoUn : 0);
    }, 0);
    const custoPorcao = custoTotal / (rec.rendimento || 1);
    const precoSugerido =
      (custoPorcao * (1 + (rec.margem || 0) / 100)) /
      (1 - (rec.taxaApp || 0) / 100);

    updates.push(
      updateDoc(doc(receitasCol(uid), snap.id), { custoTotal, custoPorcao, precoSugerido })
    );
  }

  if (updates.length) await Promise.all(updates);
}

// ── Receitas ─────────────────────────────────────────────
export async function getReceitas(uid: string): Promise<Receita[]> {
  const snap = await getDocs(query(receitasCol(uid), orderBy('nome')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Receita));
}

export async function getInsumo(uid: string, id: string): Promise<Insumo | null> {
  const snap = await getDoc(doc(insumosCol(uid), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Insumo;
}

export async function getReceita(uid: string, id: string): Promise<Receita | null> {
  const snap = await getDoc(doc(receitasCol(uid), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Receita;
}

export async function addReceita(uid: string, receita: Omit<Receita, 'id'>): Promise<string> {
  const ref = await addDoc(receitasCol(uid), { ...receita, criadoEm: serverTimestamp() });
  return ref.id;
}

export async function updateReceita(uid: string, id: string, data: Partial<Receita>) {
  await updateDoc(doc(receitasCol(uid), id), data);
}

export async function deleteReceita(uid: string, id: string) {
  await deleteDoc(doc(receitasCol(uid), id));
}

// ── Migração do projeto legado (fiesta-hermosa vanilla JS) ───────────────
// O projeto original usava coleções na raiz: `materiais` e `receitas`
// com campo `userId`. O novo usa subcoleções por usuário.
async function migrateFromLegacy(uid: string): Promise<boolean> {
  const materiaisSnap = await getDocs(
    query(collection(db, 'materiais'), where('userId', '==', uid))
  );

  if (materiaisSnap.empty) return false; // sem dados legados

  // IDs já existentes no novo formato (evita duplicar)
  const [existingInsumos, existingReceitas] = await Promise.all([
    getDocs(insumosCol(uid)),
    getDocs(receitasCol(uid)),
  ]);
  const existingInsumoIds = new Set(existingInsumos.docs.map(d => d.id));
  const existingReceitaIds = new Set(existingReceitas.docs.map(d => d.id));

  const batch: Promise<unknown>[] = [];

  // Migra materiais → insumos
  for (const d of materiaisSnap.docs) {
    if (existingInsumoIds.has(d.id)) continue;
    const old = d.data();
    const insumo: Omit<Insumo, 'id'> = {
      nome: old.nome ?? '',
      cat: old.cat ?? 'Outros',
      // unidadeReceita é a unidade usada em receitas e cálculo de custo
      un: old.unidadeReceita ?? old.unidadeCompra ?? 'un',
      precoCompra: Number(old.precoCompra) || 0,
      qtdCompra: Number(old.quantidadeCompra) || 1,
      custoUn: Number(old.custoPorUnidadeReceita) || 0,
      estoque: 0,
      ultCompra: '',
      emoji: '📦',
    };
    batch.push(setDoc(doc(insumosCol(uid), d.id), insumo));
  }

  // Migra receitas
  const receitasSnap = await getDocs(
    query(collection(db, 'receitas'), where('userId', '==', uid))
  );

  for (const d of receitasSnap.docs) {
    if (existingReceitaIds.has(d.id)) continue;
    const old = d.data();

    // Ingredientes: {materialId, quantidade} → {id, qtd}
    const ingredientes = (old.ingredientes ?? []).map((ing: Record<string, unknown>) => ({
      id: (ing.materialId ?? ing.id ?? '') as string,
      qtd: Number(ing.quantidade ?? ing.qtd) || 0,
    }));

    // instrucoes (string) → preparo (array)
    let preparo: string[] = [];
    if (Array.isArray(old.preparo)) {
      preparo = old.preparo;
    } else if (typeof old.instrucoes === 'string' && old.instrucoes.trim()) {
      preparo = old.instrucoes.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }

    const rendimento = Number(old.rendimento) || 1;
    const custoTotal = Number(old.custoTotal) || 0;

    const receita: Omit<Receita, 'id'> = {
      nome: old.nome ?? '',
      cat: old.cat ?? 'Outros',
      rendimento,
      custoTotal,
      custoPorcao: custoTotal / rendimento,
      precoSugerido: Number(old.precoVendaSugerido ?? old.precoSugerido) || 0,
      margem: Number(old.margemLucro ?? old.margem) || 30,
      taxaApp: Number(old.taxaApp) || 0,
      foto: old.foto ?? '',
      ingredientes,
      preparo,
    };
    batch.push(setDoc(doc(receitasCol(uid), d.id), receita));
  }

  if (batch.length > 0) await Promise.all(batch);
  return true;
}

// ── Inicialização no primeiro login ──────────────────────
import { INSUMOS, RECEITAS } from './data';

export async function seedIfEmpty(uid: string) {
  // Tenta migrar dados do projeto legado primeiro
  const migrated = await migrateFromLegacy(uid);
  if (migrated) return; // dados legados encontrados e migrados

  // Se não há legado, verifica se a coleção já tem dados
  const snap = await getDocs(insumosCol(uid));
  if (!snap.empty) return;

  // Sem dados em lugar nenhum: popula com dados de exemplo
  const batch: Promise<unknown>[] = [];
  for (const { id, ...insumo } of INSUMOS) {
    batch.push(setDoc(doc(insumosCol(uid), id), insumo));
  }
  for (const { id, ...receita } of RECEITAS) {
    batch.push(setDoc(doc(receitasCol(uid), id), receita));
  }
  await Promise.all(batch);
}
