// js/app.js
import { firebaseConfig } from './config.js';
import { initAuth, signInWithGoogle, signOutUser } from './auth.js';
import {
    initFirestore, addMaterial, getMaterials, getMaterialById, updateMaterial,
    addRecipe, getRecipes, getRecipeById, updateRecipe,
    isAdmin, getAllUsers // Funções de admin
} from './firestoreService.js';
import {
    updateLoginUI, showSection,
    renderRecipeList, renderRecipeDetails,
    renderMaterialsList, setupRecipeForm, addIngredienteField, getRecipeFormData, clearRecipeForm, clearMaterialForm,
    setRecipeFormMode, populateRecipeFormForEdit,
    setMaterialFormMode, populateMaterialFormForEdit, getMaterialFormData,
    setOnEditMaterialCallback,
    setupAdminFilter, toggleAdminFilter // Funções de UI para admin
} from './ui.js';

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
initAuth(app, handleAuthStateChange);
initFirestore(app);

// Variáveis de estado
let currentEditingRecipeId = null;
let currentViewingRecipeId = null;
let currentEditingMaterialId = null;
let currentUserIsAdmin = false;

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
const userFilterSelect = document.getElementById('user-filter-select');

// --- Lógica da Aplicação ---

async function handleAuthStateChange(user) {
    updateLoginUI(user);
    currentUserIsAdmin = isAdmin(user);
    toggleAdminFilter(currentUserIsAdmin);

    if (user) {
        if (currentUserIsAdmin) {
            const users = await getAllUsers();
            setupAdminFilter(users, handleUserFilterChange);
        }
        await loadInitialData();
        showSection('listar-receitas-section');
    }
}

async function loadInitialData() {
    const selectedUserId = currentUserIsAdmin ? userFilterSelect.value : null;
    await loadAndRenderRecipes(selectedUserId);
    await loadAndRenderMaterials(selectedUserId);
}

async function loadAndRenderRecipes(userId = null) {
    try {
        const recipes = await getRecipes(userId);
        renderRecipeList(recipes, handleRecipeClick);
    } catch (error) {
        console.error("Erro ao carregar receitas:", error);
        alert("Não foi possível carregar as receitas.");
    }
}

async function loadAndRenderMaterials(userId = null) {
    try {
        const materials = await getMaterials(userId);
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

function handleUserFilterChange() {
    loadInitialData();
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
                // Lógica para criar como admin para outro usuário
                const selectedUserId = currentUserIsAdmin ? userFilterSelect.value : null;
                const selectedUserName = currentUserIsAdmin && userFilterSelect.value ? userFilterSelect.options[userFilterSelect.selectedIndex].text : null;
                await addMaterial(materialData, selectedUserId, selectedUserName);
                alert('Material cadastrado com sucesso!');
            }
            currentEditingMaterialId = null;
            setMaterialFormMode('create');
            await loadAndRenderMaterials(currentUserIsAdmin ? userFilterSelect.value : null);
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
                // Lógica para criar como admin para outro usuário
                const selectedUserId = currentUserIsAdmin ? userFilterSelect.value : null;
                const selectedUserName = currentUserIsAdmin && userFilterSelect.value ? userFilterSelect.options[userFilterSelect.selectedIndex].text : null;
                const newRecipe = await addRecipe(recipeData, selectedUserId, selectedUserName);
                alert('Receita cadastrada com sucesso!');
                savedRecipeId = newRecipe.id;
            }
            currentEditingRecipeId = null;
            setRecipeFormMode('create');
            await loadAndRenderRecipes(currentUserIsAdmin ? userFilterSelect.value : null);
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
    await loadAndRenderMaterials(currentUserIsAdmin ? userFilterSelect.value : null);
    setupRecipeForm();
    showSection('cadastrar-receita-section');
});

navCadastrarMaterial.addEventListener('click', async () => {
    currentEditingMaterialId = null;
    setMaterialFormMode('create');
    await loadAndRenderMaterials(currentUserIsAdmin ? userFilterSelect.value : null);
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
        await loadAndRenderMaterials(currentUserIsAdmin ? userFilterSelect.value : null);
        const recipeToEdit = await getRecipeById(currentEditingRecipeId);
        if (recipeToEdit) {
            setRecipeFormMode('edit');
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
