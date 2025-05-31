// js/firestoreService.js
let db;

export function initFirestore(app) {
    db = firebase.firestore(app);
}

// --- Serviços de Materiais ---
export async function addMaterial(materialData) {
    try {
        const docRef = await db.collection("materiais").add(materialData);
        console.log("Material adicionado com ID: ", docRef.id);
        return { id: docRef.id, ...materialData };
    } catch (error) {
        console.error("Erro ao adicionar material: ", error);
        throw error;
    }
}

export async function getMaterials() {
    try {
        const snapshot = await db.collection("materiais").get();
        const materials = [];
        snapshot.forEach(doc => {
            materials.push({ id: doc.id, ...doc.data() });
        });
        return materials;
    } catch (error) {
        console.error("Erro ao buscar materiais: ", error);
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
            criadaEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("receitas").add(dataToSave);
        console.log("Receita adicionada com ID: ", docRef.id);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Erro ao adicionar receita: ", error);
        throw error;
    }
}

export async function getRecipes() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return []; // Ou lançar erro se preferir

        const snapshot = await db.collection("receitas").where("userId", "==", user.uid).orderBy("criadaEm", "desc").get();
        const recipes = [];
        snapshot.forEach(doc => {
            recipes.push({ id: doc.id, ...doc.data() });
        });
        return recipes;
    } catch (error) {
        console.error("Erro ao buscar receitas: ", error);
        throw error;
    }
}

export async function getRecipeById(recipeId) {
    try {
        const doc = await db.collection("receitas").doc(recipeId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.log("Nenhuma receita encontrada com este ID!");
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar receita por ID: ", error);
        throw error;
    }
}