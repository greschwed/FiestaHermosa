// js/app.js
import { firebaseConfig } from './config.js';
import { initAuth, signInWithGoogle, signOutUser, getCurrentUser } from './auth.js';
import { initFirestore, addMaterial, getMaterials, addRecipe, getRecipes, getRecipeById } from './firestoreService.js';
import {
    updateLoginUI, showSection,
    renderRecipeList, renderRecipeDetails,
    renderMaterialsList, setupRecipeForm, addIngredienteField, getRecipeFormData, clearRecipeForm, clearMaterialForm
} from './ui.js';

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
initAuth(app, handleAuthStateChange);
initFirestore(app);

// Elementos do DOM e Event Listeners de Navegação e Ações
const loginBtn = document.getElementById('login-google-btn');
const logoutBtn = document.getElementById('logout-btn');

const navListarReceitas = document.getElementById('nav-listar-receitas');
const navCadastrarReceita = document.getElementById('nav-cadastrar-receita');
const navCadastrarMaterial = document.getElementById('nav-cadastrar-material');

const formCadastroMaterial = document.getElementById('form-cadastro-material');
const formCadastroReceita = document.getElementById('form-cadastro-receita');
const addIngredienteBtn = document.getElementById('add-ingrediente-btn');
const voltarParaListaBtn = document.getElementById('voltar-para-lista-btn');


// --- Funções de Lógica da Aplicação ---

async function handleAuthStateChange(user) {
    updateLoginUI(user);
    if (user) {
        await loadInitialData(); // Carrega dados após login
        showSection('listar-receitas-section');
    } else {
        // Limpar dados da UI se necessário
    }
}

async function loadInitialData() {
    await loadAndRenderRecipes();
    await loadAndRenderMaterials(); // Carrega materiais para formulários
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
        renderMaterialsList(materials); // Para a lista na tela de cadastro de material
        // A função setupRecipeForm em ui.js usará o cache de materiais
    } catch (error) {
        console.error("Erro ao carregar materiais:", error);
        alert("Não foi possível carregar os materiais.");
    }
}

async function handleRecipeClick(recipeId) {
    try {
        const recipe = await getRecipeById(recipeId);
        if (recipe) {
            renderRecipeDetails(recipe);
        }
    } catch (error) {
        console.error("Erro ao buscar detalhes da receita:", error);
    }
}

// Event Listeners de Autenticação
loginBtn.addEventListener('click', async () => {
    try {
        await signInWithGoogle();
        // handleAuthStateChange será chamado automaticamente
    } catch (error) {
        // Erro já tratado em auth.js
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOutUser();
        // handleAuthStateChange será chamado automaticamente
    } catch (error) {
        // Erro já tratado em auth.js
    }
});

// Event Listeners de Navegação
navListarReceitas.addEventListener('click', () => {
    loadAndRenderRecipes(); // Recarrega caso algo tenha mudado
    showSection('listar-receitas-section');
});

navCadastrarReceita.addEventListener('click', async () => {
    await loadAndRenderMaterials(); // Garante que os materiais estão atualizados para o form
    setupRecipeForm();
    showSection('cadastrar-receita-section');
});

navCadastrarMaterial.addEventListener('click', async () => {
    await loadAndRenderMaterials(); // Atualiza a lista de materiais já cadastrados
    clearMaterialForm();
    showSection('cadastrar-material-section');
});

voltarParaListaBtn.addEventListener('click', () => {
    showSection('listar-receitas-section');
});


// Event Listeners de Formulários
formCadastroMaterial.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('material-nome').value;
    const unidade = document.getElementById('material-unidade').value;
    const precoPorUnidade = parseFloat(document.getElementById('material-preco').value);

    if (nome && unidade && !isNaN(precoPorUnidade)) {
        try {
            await addMaterial({ nome, unidade, precoPorUnidade });
            alert('Material cadastrado com sucesso!');
            clearMaterialForm();
            await loadAndRenderMaterials(); // Atualiza a lista
        } catch (error) {
            alert('Erro ao cadastrar material: ' + error.message);
        }
    } else {
        alert('Por favor, preencha todos os campos corretamente.');
    }
});

addIngredienteBtn.addEventListener('click', addIngredienteField);

formCadastroReceita.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipeData = getRecipeFormData();
    if (recipeData) {
        try {
            await addRecipe(recipeData);
            alert('Receita cadastrada com sucesso!');
            clearRecipeForm();
            await loadAndRenderRecipes(); // Atualiza lista de receitas
            showSection('listar-receitas-section'); // Volta para a lista
        } catch (error) {
            alert('Erro ao cadastrar receita: ' + error.message);
        }
    }
});

// Código de inicialização (se necessário, mas a maior parte é orientada a eventos)
document.addEventListener('DOMContentLoaded', () => {
    // A inicialização do Firebase e auth já acontece no topo do script.
    // UI inicial é controlada por onAuthStateChanged.
    console.log("Aplicação pronta.");
});