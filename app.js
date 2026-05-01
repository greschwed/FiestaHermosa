// js/app.js
import { firebaseConfig } from './config.js';
import { initAuth, signInWithGoogle, signOutUser } from './auth.js';
import {
    initFirestore, addMaterial, getMaterials, getMaterialById, updateMaterial,
    addRecipe, getRecipes, getRecipeById, updateRecipe
} from './firestoreService.js';
import {
    updateLoginUI, showSection,
    renderRecipeList, renderRecipeDetails,
    renderMaterialsList, setupRecipeForm, addIngredienteField, getRecipeFormData, clearRecipeForm, clearMaterialForm,
    setRecipeFormMode, populateRecipeFormForEdit,
    setMaterialFormMode, populateMaterialFormForEdit, getMaterialFormData,
    setOnEditMaterialCallback
} from './ui.js';

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
initAuth(app, handleAuthStateChange);
initFirestore(app);

// Variáveis de estado
let currentEditingRecipeId = null;
let currentViewingRecipeId = null;
let currentEditingMaterialId = null;

// Elementos do DOM
const loginBtn = document.getElementById('login-google-btn');
const logoutBtn = document.getElementById('logout-btn');
const navListarReceitas = document.getElementById('nav-listar-receitas');
const navCadastrarReceita = document.getElementById('nav-cadastrar-receita');
const navCadastrarMaterial = document.getElementById('nav-cadastrar-material');
const formCadastroMaterial = document.getElementById('form-cadastro-material');
const formCadastroReceita = document.getElementById('form-cadastro-receita');
const addIngredienteBtn = document.getElementById('add-ingrediente-btn');
const voltarParaListaBtn = document.getElementById('voltar-para-lista-btn');
const editarReceitaBtnApp = document.getElementById('editar-receita-btn');
const cancelarEdicaoBtnApp = document.getElementById('cancelar-edicao-btn');

// --- Lógica da Aplicação ---

async function handleAuthStateChange(user) {
    updateLoginUI(user);

    if (user) {
        await loadInitialData();
        showSection('listar-receitas-section');
    }
}

async function loadInitialData() {
    await loadAndRenderRecipes();
    await loadAndRenderMaterials();
}

async function loadAndRenderRecipes() {
    try {
        const recipes = await getRecipes();
        renderRecipeList(recipes, handleRecipeClick);
    } catch (error) {
        console.error("Erro ao carregar receitas:", error);
        alert("Não foi possível carregar as receitas.");
    }
}

async function loadAndRenderMaterials() {
    try {
        const materials = await getMaterials();
        renderMaterialsList(materials);
    } catch (error) {
        console.error("Erro ao carregar materiais:", error);
        alert("Não foi possível carregar os materiais.");
    }
}

async function handleRecipeClick(recipeId) {
    try {
        currentViewingRecipeId = recipeId;
        const recipe = await getRecipeById(recipeId);
        if (recipe) {
            renderRecipeDetails(recipe);
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes da receita:", error);
    }
}

async function handleEditMaterialClick(materialId) {
    currentEditingMaterialId = materialId;
    try {
        const materialToEdit = await getMaterialById(materialId);
        if (materialToEdit) {
            setMaterialFormMode('edit');
            populateMaterialFormForEdit(materialToEdit);
            showSection('cadastrar-material-section');
        } else {
            alert("Material não encontrado para edição.");
            currentEditingMaterialId = null;
        }
    } catch (error) {
        alert("Erro ao carregar dados do material para edição.");
        currentEditingMaterialId = null;
    }
}

// --- Event Listeners ---

loginBtn.addEventListener('click', signInWithGoogle);
logoutBtn.addEventListener('click', signOutUser);

formCadastroMaterial.addEventListener('submit', async (e) => {
    e.preventDefault();
    const materialData = getMaterialFormData();
    if (materialData) {
        try {
            if (currentEditingMaterialId) {
                await updateMaterial(currentEditingMaterialId, materialData);
                alert('Material atualizado com sucesso!');
            } else {
                await addMaterial(materialData);
                alert('Material cadastrado com sucesso!');
            }
            currentEditingMaterialId = null;
            setMaterialFormMode('create');
            await loadAndRenderMaterials();
        } catch (error) {
            alert("Erro ao salvar material: " + error.message);
        }
    }
});

formCadastroReceita.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipeData = getRecipeFormData();
    if (recipeData) {
        try {
            let savedRecipeId;
            if (currentEditingRecipeId) {
                await updateRecipe(currentEditingRecipeId, recipeData);
                alert('Receita atualizada com sucesso!');
                savedRecipeId = currentEditingRecipeId;
            } else {
                const newRecipe = await addRecipe(recipeData);
                alert('Receita cadastrada com sucesso!');
                savedRecipeId = newRecipe.id;
            }
            currentEditingRecipeId = null;
            setRecipeFormMode('create');
            await loadAndRenderRecipes();
            handleRecipeClick(savedRecipeId);
        } catch (error) {
            alert('Erro ao salvar receita: ' + error.message);
        }
    }
});

// Navegação
navListarReceitas.addEventListener('click', () => {
    currentEditingRecipeId = null;
    currentViewingRecipeId = null;
    showSection('listar-receitas-section');
    loadInitialData();
});

navCadastrarReceita.addEventListener('click', async () => {
    currentEditingRecipeId = null;
    setRecipeFormMode('create');
    await setupRecipeForm(); // setupRecipeForm já carrega os materiais
    showSection('cadastrar-receita-section');
});

navCadastrarMaterial.addEventListener('click', async () => {
    currentEditingMaterialId = null;
    setMaterialFormMode('create');
    await loadAndRenderMaterials();
    showSection('cadastrar-material-section');
});

voltarParaListaBtn.addEventListener('click', () => {
    currentViewingRecipeId = null;
    showSection('listar-receitas-section');
});

editarReceitaBtnApp.addEventListener('click', async () => {
    if (!currentViewingRecipeId) return;
    currentEditingRecipeId = currentViewingRecipeId;
    try {
        const recipeToEdit = await getRecipeById(currentEditingRecipeId);
        if (recipeToEdit) {
            setRecipeFormMode('edit');
            await setupRecipeForm(); // Garante que os materiais estão carregados
            populateRecipeFormForEdit(recipeToEdit);
            showSection('cadastrar-receita-section');
        } else {
            currentEditingRecipeId = null;
        }
    } catch (error) {
        alert("Erro ao preparar para editar receita: " + error.message);
    }
});

cancelarEdicaoBtnApp.addEventListener('click', () => {
    const wasViewingId = currentViewingRecipeId;
    currentEditingRecipeId = null;
    setRecipeFormMode('create');
    if (wasViewingId) {
        handleRecipeClick(wasViewingId);
    } else {
        showSection('listar-receitas-section');
    }
});

document.getElementById('cancelar-edicao-material-btn').addEventListener('click', () => {
    currentEditingMaterialId = null;
    setMaterialFormMode('create');
});

addIngredienteBtn.addEventListener('click', addIngredienteField);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    setOnEditMaterialCallback(handleEditMaterialClick);
});