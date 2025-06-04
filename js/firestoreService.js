// js/firestoreService.js
let db;

export function initFirestore(app) {
    db = firebase.firestore(app);
}

// --- Serviços de Materiais / Ingredientes ---

export const CONVERSION_FACTORS = { // Movido para cima para referência caso seja usado por outras funções
    'kg': { 'g': 1000, 'kg': 1 },
    'g': { 'g': 1, 'kg': 0.001 },
    'L': { 'ml': 1000, 'L': 1 },
    'ml': { 'ml': 1, 'L': 0.001 }
    // 'un': { 'un': 1} // Adicionar 'un' se quiser que calculateCostPerRecipeUnit lide com isso via CONVERSION_FACTORS
};

export function calculateCostPerRecipeUnit(precoCompra, quantidadeCompra, unidadeCompra, unidadeReceita) {
    precoCompra = parseFloat(precoCompra);
    quantidadeCompra = parseFloat(quantidadeCompra);

    if (isNaN(precoCompra) || isNaN(quantidadeCompra) || quantidadeCompra <= 0) {
        console.warn("Dados de compra inválidos para cálculo de custo:", {precoCompra, quantidadeCompra});
        return null;
    }

    if (unidadeReceita === 'un') {
        if (unidadeCompra === 'un') {
             return precoCompra / quantidadeCompra;
        } else {
             console.warn(`Para unidadeReceita 'un', idealmente unidadeCompra ('${unidadeCompra}') também é 'un'. Cálculo pode não ser direto.`);
             // Retornando null para forçar o usuário a definir a compra em 'un' se a receita usa 'un'
             // Ou você pode ter uma lógica de conversão específica se, por ex, 'kg' de algo sempre tem X unidades.
             return null;
        }
    }

    // Verifica se a unidade de compra existe e se a conversão para unidade de receita é possível
    if (!CONVERSION_FACTORS[unidadeCompra] || CONVERSION_FACTORS[unidadeCompra][unidadeReceita] === undefined) {
        console.error(`Conversão impossível ou não suportada: de '${unidadeCompra}' para '${unidadeReceita}'.`);
        return null;
    }

    const factor = CONVERSION_FACTORS[unidadeCompra][unidadeReceita];
    const quantidadeTotalEmUnidadeReceita = quantidadeCompra * factor;

    if (quantidadeTotalEmUnidadeReceita <= 0) {
        console.warn("Quantidade total em unidade de receita calculada é zero ou negativa.");
        return null;
    }

    return precoCompra / quantidadeTotalEmUnidadeReceita;
}


// Cadastrar Ingrediente
export async function addMaterial(materialData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        let custoCalculado = calculateCostPerRecipeUnit(
            materialData.precoCompra,
            materialData.quantidadeCompra,
            materialData.unidadeCompra,
            materialData.unidadeReceita
        );

        // Se o cálculo retornou null e não é uma unidade 'un' (que tem sua própria lógica de cálculo acima), lance erro.
        if (custoCalculado === null && materialData.unidadeReceita !== 'un') {
            throw new Error("Não foi possível calcular o custo por unidade de receita. Verifique as unidades e valores fornecidos.");
        }
        // Se for 'un', e o cálculo acima não resolveu, pode ser um problema de configuração
        if (materialData.unidadeReceita === 'un' && custoCalculado === null) {
             // A lógica em calculateCostPerRecipeUnit já deve lidar com un/un.
             // Se chegou aqui com null, é porque unidadeCompra não era 'un'.
             throw new Error("Para unidade de receita 'un', a unidade de compra também deve ser 'un' e a quantidade de compra deve ser o número de unidades.");
        }
        // Garante que custoCalculado não seja null se passou pelas verificações.
        // Se custoCalculado for null, a UI deve tratar ou impedir o salvamento.
        // Mas para o banco, é melhor salvar um número ou um placeholder.
        // No entanto, a lógica acima já lança erro se for null e não deveria ser.
        // Se for intencionalmente null (ex: erro de conversão não bloqueante), usar 0 ou tratar.
        // Por ora, as throws acima devem cobrir.

        const dataToSave = {
            nome: materialData.nome,
            precoCompra: parseFloat(materialData.precoCompra),
            quantidadeCompra: parseFloat(materialData.quantidadeCompra),
            unidadeCompra: materialData.unidadeCompra,
            unidadeReceita: materialData.unidadeReceita,
            custoPorUnidadeReceita: custoCalculado, // Salva o valor calculado (pode ser null se a lógica permitir)
            userId: user.uid,
            criadaEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        const docRef = await db.collection("materiais").add(dataToSave);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Erro ao adicionar material: ", error);
        throw error; // Re-throw para ser pego pela UI
    }
}

// Atualização de Ingrediente
export async function updateMaterial(materialId, materialData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        let custoCalculado = calculateCostPerRecipeUnit(
            materialData.precoCompra,
            materialData.quantidadeCompra,
            materialData.unidadeCompra,
            materialData.unidadeReceita
        );

        if (custoCalculado === null && materialData.unidadeReceita !== 'un') {
            throw new Error("Não foi possível calcular o custo por unidade de receita para atualização. Verifique as unidades e valores.");
        }
        if (materialData.unidadeReceita === 'un' && custoCalculado === null) {
             throw new Error("Para unidade de receita 'un' na atualização, a unidade de compra também deve ser 'un'.");
        }

        const materialRef = db.collection("materiais").doc(materialId);
        const dataToUpdate = {
            nome: materialData.nome,
            precoCompra: parseFloat(materialData.precoCompra),
            quantidadeCompra: parseFloat(materialData.quantidadeCompra),
            unidadeCompra: materialData.unidadeCompra,
            unidadeReceita: materialData.unidadeReceita,
            custoPorUnidadeReceita: custoCalculado,
            userId: user.uid, // Garante que o userId não seja removido na atualização
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        await materialRef.update(dataToUpdate);
        // Retornar o objeto completo com os dados atualizados e o ID
        // É uma boa prática buscar o documento novamente para garantir consistência,
        // mas para simplificar, vamos retornar o que foi enviado para atualização.
        return { id: materialId, ...dataToUpdate, criadaEm: materialData.criadaEm }; // Preservar criadaEm se existir no objeto original
    } catch (error) {
        console.error("Erro ao atualizar material: ", error);
        throw error;
    }
}

// Obter dados de Ingredientes
export async function getMaterials() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.log("Nenhum usuário autenticado para buscar materiais.");
            return []; // Retorna array vazio se não houver usuário
        }

        const snapshot = await db.collection("materiais")
                                 .where("userId", "==", user.uid) // <<< FILTRAR POR USUÁRIO LOGADO
                                 .orderBy("nome") // Opcional: ordenar por nome
                                 .get();
        const materials = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            materials.push({
                id: doc.id,
                nome: data.nome || 'Nome Indisponível',
                precoCompra: data.precoCompra !== undefined ? data.precoCompra : 0,
                quantidadeCompra: data.quantidadeCompra !== undefined ? data.quantidadeCompra : 0,
                unidadeCompra: data.unidadeCompra || 'N/A',
                // >>> AJUSTES CRÍTICOS AQUI para evitar 'toFixed' em undefined <<<
                unidadeReceita: data.unidadeReceita || 'un', // Fallback para 'un' se não definido
                custoPorUnidadeReceita: (data.custoPorUnidadeReceita !== undefined && data.custoPorUnidadeReceita !== null)
                                          ? data.custoPorUnidadeReceita
                                          : 0, // Fallback para 0 se undefined ou null
                criadaEm: data.criadaEm, // Preservar outros campos
                userId: data.userId
            });
        });
        return materials;
    } catch (error) {
        console.error("Erro ao buscar materiais: ", error);
        throw error; // Re-throw para ser pego pela UI
    }
}

export async function getMaterialById(materialId) {
    try {
        const user = firebase.auth().currentUser; // Opcional: verificar se o material pertence ao usuário
        if (!user) throw new Error("Usuário não autenticado.");

        const doc = await db.collection("materiais").doc(materialId).get();
        if (doc.exists) {
            const data = doc.data();
            // Opcional: Verificar se data.userId === user.uid se for uma regra de negócio
            if (data.userId !== user.uid) {
                console.warn("Tentativa de acesso a material de outro usuário.");
                return null; // Ou lançar um erro de permissão
            }
            return {
                id: doc.id,
                nome: data.nome || 'Nome Indisponível',
                precoCompra: data.precoCompra !== undefined ? data.precoCompra : 0,
                quantidadeCompra: data.quantidadeCompra !== undefined ? data.quantidadeCompra : 0,
                unidadeCompra: data.unidadeCompra || 'N/A',
                // >>> AJUSTES CRÍTICOS AQUI <<<
                unidadeReceita: data.unidadeReceita || 'un',
                custoPorUnidadeReceita: (data.custoPorUnidadeReceita !== undefined && data.custoPorUnidadeReceita !== null)
                                          ? data.custoPorUnidadeReceita
                                          : 0,
                criadaEm: data.criadaEm,
                userId: data.userId
            };
        } else {
            console.log("Nenhum material encontrado com o ID:", materialId);
            return null;
        }
    } catch (error) {
        console.error("Erro ao buscar material por ID:", error);
        throw error;
    }
}

// --- Serviços de Receitas ---
// (O restante do código de receitas parece OK, não foram reportados erros nele)
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
        if (!user) return [];

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
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");

        const doc = await db.collection("receitas").doc(recipeId).get();
        if (doc.exists) {
            const data = doc.data();
            if (data.userId !== user.uid) {
                 console.warn("Tentativa de acesso a receita de outro usuário.");
                 return null;
            }
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
export async function updateRecipe(recipeId, recipeData) {
    try {
        const user = firebase.auth().currentUser;
        if (!user) throw new Error("Usuário não autenticado.");
        
        // Opcional: buscar a receita primeiro para garantir que pertence ao usuário
        const currentRecipeDoc = await db.collection("receitas").doc(recipeId).get();
        if (!currentRecipeDoc.exists || currentRecipeDoc.data().userId !== user.uid) {
            throw new Error("Receita não encontrada ou não pertence ao usuário.");
        }

        const recipeRef = db.collection("receitas").doc(recipeId);
        await recipeRef.update({
            ...recipeData,
            userId: user.uid, // Garantir que o userId permaneça
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Receita atualizada com ID: ", recipeId);
        return { id: recipeId, ...recipeData }; // Idealmente, retorne o objeto atualizado do Firestore
    } catch (error) {
        console.error("Erro ao atualizar receita: ", error);
        throw error;
    }
}