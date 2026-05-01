// js/firestoreService.js
let db;

export function initFirestore(app) {
    db = firebase.firestore(app);
}

// --- Funções de Admin e Usuário ---

// As funções isAdmin e getAllUsers foram removidas para que todos os usuários vejam todo o conteúdo.

// --- Serviços de Materiais / Ingredientes ---

export const CONVERSION_FACTORS = {
    'kg': { 'g': 1000, 'kg': 1 },
    'g': { 'g': 1, 'kg': 0.001 },
    'L': { 'ml': 1000, 'L': 1 },
    'ml': { 'ml': 1, 'L': 0.001 }
};

export function calculateCostPerRecipeUnit(precoCompra, quantidadeCompra, unidadeCompra, unidadeReceita) {
    precoCompra = parseFloat(precoCompra);
    quantidadeCompra = parseFloat(quantidadeCompra);

    if (isNaN(precoCompra) || isNaN(quantidadeCompra) || quantidadeCompra <= 0) return null;
    if (unidadeReceita === 'un') return (unidadeCompra === 'un') ? (precoCompra / quantidadeCompra) : null;
    if (!CONVERSION_FACTORS[unidadeCompra] || CONVERSION_FACTORS[unidadeCompra][unidadeReceita] === undefined) return null;

    const factor = CONVERSION_FACTORS[unidadeCompra][unidadeReceita];
    const quantidadeTotalEmUnidadeReceita = quantidadeCompra * factor;
    return (quantidadeTotalEmUnidadeReceita > 0) ? (precoCompra / quantidadeTotalEmUnidadeReceita) : null;
}


// Cadastrar Ingrediente
export async function addMaterial(materialData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        let custoCalculado = calculateCostPerRecipeUnit(materialData.precoCompra, materialData.quantidadeCompra, materialData.unidadeCompra, materialData.unidadeReceita);
        if (custoCalculado === null) throw new Error("Não foi possível calcular o custo. Verifique as unidades.");

        const dataToSave = {
            ...materialData,
            precoCompra: parseFloat(materialData.precoCompra),
            quantidadeCompra: parseFloat(materialData.quantidadeCompra),
            custoPorUnidadeReceita: custoCalculado,
            userId: user.uid,
            userName: user.displayName || user.email,
            criadaEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("materiais").add(dataToSave);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Erro ao adicionar material: ", error);
        throw error;
    }
}

// Atualização de Ingrediente (não muda a propriedade do documento)
export async function updateMaterial(materialId, materialData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        let custoCalculado = calculateCostPerRecipeUnit(materialData.precoCompra, materialData.quantidadeCompra, materialData.unidadeCompra, materialData.unidadeReceita);
        if (custoCalculado === null) throw new Error("Não foi possível calcular o custo para atualização.");

        const materialRef = db.collection("materiais").doc(materialId);
        const dataToUpdate = {
            ...materialData,
            precoCompra: parseFloat(materialData.precoCompra),
            quantidadeCompra: parseFloat(materialData.quantidadeCompra),
            custoPorUnidadeReceita: custoCalculado,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        await materialRef.update(dataToUpdate);
        return { id: materialId, ...dataToUpdate };
    } catch (error) {
        console.error("Erro ao atualizar material: ", error);
        throw error;
    }
}

// Obter dados de Ingredientes
export async function getMaterials() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        const snapshot = await db.collection("materiais").orderBy("nome").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Erro ao buscar materiais: ", error);
        throw error;
    }
}

export async function getMaterialById(materialId) {
    try {
        const doc = await db.collection("materiais").doc(materialId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error("Erro ao buscar material por ID:", error);
        throw error;
    }
}

// --- Serviços de Receitas ---
export async function addRecipe(recipeData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        const dataToSave = {
            ...recipeData,
            userId: user.uid,
            userName: user.displayName || user.email,
            criadaEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("receitas").add(dataToSave);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Erro ao adicionar receita: ", error);
        throw error;
    }
}

export async function getRecipes() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        const snapshot = await db.collection("receitas").orderBy("criadaEm", "desc").get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
        console.error("Erro ao buscar receitas: ", error);
        throw error;
    }
}

export async function getRecipeById(recipeId) {
    try {
        const doc = await db.collection("receitas").doc(recipeId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error("Erro ao buscar receita por ID: ", error);
        throw error;
    }
}

export async function updateRecipe(recipeId, recipeData) {
    try {
        const recipeRef = db.collection("receitas").doc(recipeId);
        await recipeRef.update({
            ...recipeData,
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { id: recipeId, ...recipeData };
    } catch (error) {
        console.error("Erro ao atualizar receita: ", error);
        throw error;
    }
}