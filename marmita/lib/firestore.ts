import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, deleteDoc, updateDoc,
  query, orderBy, serverTimestamp,
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

// ── Receitas ─────────────────────────────────────────────
export async function getReceitas(uid: string): Promise<Receita[]> {
  const snap = await getDocs(query(receitasCol(uid), orderBy('nome')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Receita));
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

// ── Seed inicial (primeiro login) ────────────────────────
import { INSUMOS, RECEITAS } from './data';

export async function seedIfEmpty(uid: string) {
  const snap = await getDocs(insumosCol(uid));
  if (!snap.empty) return; // já tem dados

  const batch: Promise<unknown>[] = [];

  for (const { id, ...insumo } of INSUMOS) {
    batch.push(setDoc(doc(insumosCol(uid), id), insumo));
  }
  for (const { id, ...receita } of RECEITAS) {
    batch.push(setDoc(doc(receitasCol(uid), id), receita));
  }

  await Promise.all(batch);
}
