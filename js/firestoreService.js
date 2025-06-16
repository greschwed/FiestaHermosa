// js/firestoreService.js
// js/firestoreService.js
let db;

export function initFirestore(app) {
    db = firebase.firestore(app);
}

// --- Funções de Admin e Usuário ---

// Checa se o usuário logado é o administrador
export function isAdmin(user) {
    // IMPORTANTE: Substitua pelo UID real do seu usuário administrador
    const ADMIN_UID = "PX2X421ir9O6o9tIH0VprV0wbQc2"; 
    return user && user.uid === ADMIN_UID;
}

// Busca todos os usuários que já cadastraram algo (para o filtro do admin)
export async function getAllUsers() {
    const users = new Map();
    
    // Busca usuários de receitas
    const recipesSnapshot = await db.collection("receitas").get();
    recipesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId && !users.has(data.userId)) {
             // Prioriza o nome do usuário salvo no documento
            const userName = data.userName || `Usuário (${data.userId.substring(0, 6)}...)`;
            users.set(data.userId, userName);
        }
    });

    // Busca usuários de materiais
    const materialsSnapshot = await db.collection("materiais").get();
    materialsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId && !users.has(data.userId)) {
            const userName = data.userName || `Usuário (${data.userId.substring(0, 6)}...)`;
            users.set(data.userId, userName);
        }
    });
    
    // Converte o Map para um array de objetos para ser usado no select
    return Array.from(users, ([id, name]) => ({ id, name }));
}


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
export async function addMaterial(materialData, userIdFor = null, userNameFor = null) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        let custoCalculado = calculateCostPerRecipeUnit(materialData.precoCompra, materialData.quantidadeCompra, materialData.unidadeCompra, materialData.unidadeReceita);
        if (custoCalculado === null) throw new Error("Não foi possível calcular o custo. Verifique as unidades.");

        // Define o proprietário do documento. Se o admin especificou um, usa esse. Senão, usa o próprio admin/usuário.
        const ownerId = isAdmin(user) && userIdFor ? userIdFor : user.uid;
        const ownerName = isAdmin(user) && userNameFor ? userNameFor : (user.displayName || user.email);

        const dataToSave = {
            ...materialData,
            precoCompra: parseFloat(materialData.precoCompra),
            quantidadeCompra: parseFloat(materialData.quantidadeCompra),
            custoPorUnidadeReceita: custoCalculado,
            userId: ownerId,
            userName: ownerName,
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
export async function getMaterials(userIdToFilter = null) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        let query = db.collection("materiais");

        if (userIdToFilter) {
            query = query.where("userId", "==", userIdToFilter);
        } else if (!isAdmin(user)) {
            query = query.where("userId", "==", user.uid);
        }
        
        const snapshot = await query.orderBy("nome").get();
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
export async function addRecipe(recipeData, userIdFor = null, userNameFor = null) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        const ownerId = isAdmin(user) && userIdFor ? userIdFor : user.uid;
        const ownerName = isAdmin(user) && userNameFor ? userNameFor : (user.displayName || user.email);

        const dataToSave = {
            ...recipeData,
            userId: ownerId,
            userName: ownerName,
            criadaEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("receitas").add(dataToSave);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Erro ao adicionar receita: ", error);
        throw error;
    }
}

export async function getRecipes(userIdToFilter = null) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return [];

        let query = db.collection("receitas");

        if (userIdToFilter) {
            query = query.where("userId", "==", userIdToFilter);
        } else if (!isAdmin(user)) {
            query = query.where("userId", "==", user.uid);
        }
        
        const snapshot = await query.orderBy("criadaEm", "desc").get();
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
