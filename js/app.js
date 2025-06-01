// js/app.js
import { firebaseConfig } from './config.js';
import { initAuth, signInWithGoogle, signOutUser, getCurrentUser } from './auth.js';
import { initFirestore, addMaterial, getMaterials, addRecipe, getRecipes, getRecipeById,updateRecipe } from './firestoreService.js';
import {
    updateLoginUI, showSection,
    renderRecipeList, renderRecipeDetails,
    renderMaterialsList, setupRecipeForm, addIngredienteField, getRecipeFormData, clearRecipeForm, clearMaterialForm,
    setRecipeFormMode, populateRecipeFormForEdit
} from './ui.js';

// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
initAuth(app, handleAuthStateChange);
initFirestore(app);

// Variável para rastrear o ID da receita em edição
let currentEditingRecipeId = null;
let currentViewingRecipeId = null; // Para saber qual receita estava sendo vista antes de editar

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
const editarReceitaBtnApp = document.getElementById('editar-receita-btn');
const cancelarEdicaoBtnApp = document.getElementById('cancelar-edicao-btn'); // Referência no app.js


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
        currentViewingRecipeId = recipeId; // Armazena o ID da receita sendo visualizada
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


// Event Listeners de Navegação
navListarReceitas.addEventListener('click', () => {
    currentEditingRecipeId = null; // Sai do modo de edição se estava
    currentViewingRecipeId = null;
    setRecipeFormMode('create');
    loadAndRenderRecipes();
    showSection('listar-receitas-section');
});

navCadastrarReceita.addEventListener('click', async () => {
    currentEditingRecipeId = null; // Garante que está em modo de criação
    console.log("Mudando para modo de criação, currentEditingRecipeId:", currentEditingRecipeId); // Log
    currentViewingRecipeId = null;
    await loadAndRenderMaterials();
    setRecipeFormMode('create'); // Define o modo do formulário
    setupRecipeForm(); // Configura o formulário para nova receita
    showSection('cadastrar-receita-section');
});

navCadastrarMaterial.addEventListener('click', async () => {
    await loadAndRenderMaterials(); // Atualiza a lista de materiais já cadastrados
    clearMaterialForm();
    showSection('cadastrar-material-section');
});

voltarParaListaBtn.addEventListener('click', () => {
    currentViewingRecipeId = null;
    showSection('listar-receitas-section');
});

editarReceitaBtnApp.addEventListener('click', async () => {
    if (!currentViewingRecipeId) {
        alert("Nenhuma receita selecionada para edição.");
        return;
    }
    currentEditingRecipeId = currentViewingRecipeId; // <<<< AQUI É DEFINIDO
    console.log("Iniciando edição para ID:", currentEditingRecipeId); // Log
    try {
        await loadAndRenderMaterials(); // Garante que materiais estão carregados para o select
        const recipeToEdit = await getRecipeById(currentEditingRecipeId);
        if (recipeToEdit) {
            setRecipeFormMode('edit', currentEditingRecipeId); // Passe o ID aqui também se sua função aceitar
            populateRecipeFormForEdit(recipeToEdit);
            showSection('cadastrar-receita-section');
        } else {
            alert("Receita não encontrada para edição.");
            currentEditingRecipeId = null; // Reseta se não encontrou
        }
    } catch (error) {
        alert("Erro ao preparar para editar receita: " + error.message);
        currentEditingRecipeId = null;
    }
});

cancelarEdicaoBtnApp.addEventListener('click', () => {
    const previousRecipeId = currentEditingRecipeId; // Salva o ID antes de limpar
    currentEditingRecipeId = null;
    setRecipeFormMode('create'); // Reseta o formulário para o modo de criação
    clearRecipeForm();

    if (previousRecipeId) { // Se estava editando uma receita específica, volta para os detalhes dela
        currentViewingRecipeId = previousRecipeId;
        handleRecipeClick(previousRecipeId); // Recarrega os detalhes da receita
        // showSection('detalhe-receita-section'); // handleRecipeClick já deve mostrar
    } else { // Senão, volta para a lista
        showSection('listar-receitas-section');
    }
});


// Event Listeners de Formulários
formCadastroReceita.addEventListener('submit', async (e) => {
    e.preventDefault();
    const recipeData = getRecipeFormData();

    if (recipeData) {
        try {
            let savedRecipeId; // Para armazenar o ID da receita salva ou atualizada

            if (currentEditingRecipeId) {
                // Modo de Edição
                console.log("Modo de Edição - ID:", currentEditingRecipeId, "Dados:", recipeData); // Log para depuração
                await updateRecipe(currentEditingRecipeId, recipeData); // << CHAMA updateRecipe
                alert('Receita atualizada com sucesso!');
                savedRecipeId = currentEditingRecipeId; // Mantém o ID da receita editada
            } else {
                // Modo de Criação
                console.log("Modo de Criação - Dados:", recipeData); // Log para depuração
                const newRecipe = await addRecipe(recipeData);      // << CHAMA addRecipe (se não estiver editando)
                alert('Receita cadastrada com sucesso!');
                savedRecipeId = newRecipe.id; // Pega o ID da nova receita criada
            }

            currentEditingRecipeId = null;  // Reseta o modo de edição após salvar/atualizar
            setRecipeFormMode('create');    // Reseta o formulário para o modo de criação visualmente
            clearRecipeForm();              // Limpa os campos do formulário

            await loadAndRenderRecipes();   // Atualiza a lista de receitas na UI

            if (savedRecipeId) { 
                handleRecipeClick(savedRecipeId); 
            } else { 
                showSection('listar-receitas-section');
            }

        } catch (error) {
            console.error('Erro ao salvar receita:', error); 
            alert('Erro ao salvar receita: ' + error.message);
        }
    }
});


addIngredienteBtn.addEventListener('click', addIngredienteField);


// Código de inicialização (se necessário, mas a maior parte é orientada a eventos)
document.addEventListener('DOMContentLoaded', () => {
    // A inicialização do Firebase e auth já acontece no topo do script.
    // UI inicial é controlada por onAuthStateChanged.
    console.log("Aplicação pronta.");
});