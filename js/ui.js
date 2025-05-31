// js/ui.js
import { getMaterials } from './firestoreService.js';

let allMaterialsCache = []; // Cache para os materiais disponíveis

// Elementos do DOM
const loginBtn = document.getElementById('login-google-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoP = document.getElementById('user-info');
const authContainer = document.getElementById('auth-container');
const appNav = document.getElementById('app-nav');
const appContent = document.getElementById('app-content');

const listarReceitasSection = document.getElementById('listar-receitas-section');
const detalheReceitaSection = document.getElementById('detalhe-receita-section');
const cadastrarMaterialSection = document.getElementById('cadastrar-material-section');
const cadastrarReceitaSection = document.getElementById('cadastrar-receita-section');


const sections = [listarReceitasSection, detalheReceitaSection, cadastrarMaterialSection, cadastrarReceitaSection];

function hideAllSections() {
    sections.forEach(section => section.style.display = 'none');
}

export function showSection(sectionId) {
    hideAllSections();
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
    }
}

export function updateLoginUI(user) {
    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        userInfoP.textContent = `Logado como: ${user.displayName || user.email}`;
        userInfoP.style.display = 'block';
        appNav.style.display = 'block';
        appContent.style.display = 'block';
        showSection('listar-receitas-section'); // Mostrar lista de receitas por padrão
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userInfoP.style.display = 'none';
        appNav.style.display = 'none';
        appContent.style.display = 'none';
        hideAllSections();
    }
}

// --- UI para Receitas ---
const receitasContainer = document.getElementById('receitas-container');
export function renderRecipeList(recipes, onRecipeClickCallback) {
    receitasContainer.innerHTML = ''; // Limpa a lista existente
    if (recipes.length === 0) {
        receitasContainer.innerHTML = '<p>Nenhuma receita cadastrada ainda.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const item = document.createElement('div');
        item.classList.add('receita-item');
        item.innerHTML = `<h3>${recipe.nome}</h3><p>Custo: R$ ${parseFloat(recipe.custoTotal || 0).toFixed(2)}</p>`;
        item.addEventListener('click', () => onRecipeClickCallback(recipe.id));
        receitasContainer.appendChild(item);
    });
}

const detalheNome = document.getElementById('detalhe-receita-nome');
const detalheIngredientes = document.getElementById('detalhe-receita-ingredientes');
const detalheInstrucoes = document.getElementById('detalhe-receita-instrucoes');
const detalheCusto = document.getElementById('detalhe-receita-custo');

export function renderRecipeDetails(recipe) {
    detalheNome.textContent = recipe.nome;
    detalheInstrucoes.textContent = recipe.instrucoes;
    detalheCusto.textContent = parseFloat(recipe.custoTotal || 0).toFixed(2);

    detalheIngredientes.innerHTML = '';
    recipe.ingredientes.forEach(ing => {
        const li = document.createElement('li');
        li.textContent = `${ing.quantidade} ${ing.unidadeMaterial || ''} de ${ing.nomeMaterial} (Custo: R$ ${parseFloat(ing.custoIngrediente || 0).toFixed(2)})`;
        detalheIngredientes.appendChild(li);
    });
    showSection('detalhe-receita-section');
}


// --- UI para Cadastro de Materiais ---
const listaMateriaisCadastradosEl = document.getElementById('lista-materiais-cadastrados');
export function renderMaterialsList(materials) {
    allMaterialsCache = materials; // Atualiza o cache
    listaMateriaisCadastradosEl.innerHTML = '';
    if (materials.length === 0) {
        listaMateriaisCadastradosEl.innerHTML = '<li>Nenhum material cadastrado.</li>';
        return;
    }
    materials.forEach(mat => {
        const li = document.createElement('li');
        li.textContent = `${mat.nome} (${mat.unidade}) - R$ ${parseFloat(mat.precoPorUnidade).toFixed(2)}`;
        // Poderia adicionar botões de editar/excluir aqui
        listaMateriaisCadastradosEl.appendChild(li);
    });
}

// --- UI para Cadastro de Receitas ---
const ingredientesReceitaContainer = document.getElementById('ingredientes-receita-container');
const custoTotalReceitaPreview = document.getElementById('custo-total-receita-preview');
const margemLucroPercentualInput = document.getElementById('margem-lucro-percentual');
const precoVendaSugeridoPreview = document.getElementById('preco-venda-sugerido-preview');

let ingredientesDaReceitaAtual = []; // Armazena os ingredientes adicionados no formulário

export function setupRecipeForm() {
    ingredientesReceitaContainer.innerHTML = ''; // Limpa ingredientes anteriores
    ingredientesDaReceitaAtual = [];
    updateRecipeCostPreview();
    addIngredienteField(); // Adiciona o primeiro campo de ingrediente
    // Adiciona o listener para o campo de margem de lucro
    // Remova qualquer listener antigo para evitar duplicação se setupRecipeForm for chamado múltiplas vezes
    margemLucroPercentualInput.removeEventListener('input', updateSalePricePreview);
    margemLucroPercentualInput.addEventListener('input', updateSalePricePreview);
    updateSalePricePreview();

}

export function addIngredienteField() {
    if (allMaterialsCache.length === 0) {
        alert("Cadastre materiais primeiro para poder adicioná-los à receita.");
        return;
    }

    const fieldIndex = ingredientesReceitaContainer.children.length;
    const div = document.createElement('div');
    div.classList.add('ingrediente-item-form');
    div.innerHTML = `
        <label for="material-select-${fieldIndex}">Material:</label>
        <select id="material-select-${fieldIndex}" class="material-select" required>
            <option value="">Selecione um material</option>
            ${allMaterialsCache.map(m => `<option value="${m.id}" data-preco="${m.precoPorUnidade}" data-unidade="${m.unidade}">${m.nome} (${m.unidade} - R$ ${m.precoPorUnidade.toFixed(2)})</option>`).join('')}
        </select>
        <label for="quantidade-material-${fieldIndex}">Quantidade:</label>
        <input type="number" id="quantidade-material-${fieldIndex}" class="quantidade-material" step="0.01" min="0" required placeholder="Ex: 0.5">
        <span class="unidade-display-receita"></span>
        <p>Custo do ingrediente: R$ <span class="custo-ingrediente-preview">0.00</span></p>
        <button type="button" class="remover-ingrediente-btn">Remover</button>
    `;
    ingredientesReceitaContainer.appendChild(div);

    const select = div.querySelector('.material-select');
    const quantidadeInput = div.querySelector('.quantidade-material');
    const unidadeDisplay = div.querySelector('.unidade-display-receita');
    const custoPreview = div.querySelector('.custo-ingrediente-preview');

    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        unidadeDisplay.textContent = `(${selectedOption.dataset.unidade || ''})`;
        updateSingleIngredientCost(select, quantidadeInput, custoPreview);
        updateRecipeCostPreview();
    });

    
    quantidadeInput.addEventListener('input', () => {
        updateSingleIngredientCost(select, quantidadeInput, custoPreview);
        updateRecipeCostPreview();
    });

    div.querySelector('.remover-ingrediente-btn').addEventListener('click', () => {
        div.remove();
        updateRecipeCostPreview();
    });
}

function updateSingleIngredientCost(materialSelect, quantidadeInput, custoPreviewEl) {
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const precoPorUnidade = parseFloat(selectedOption.dataset.preco);
    const quantidade = parseFloat(quantidadeInput.value);

    if (selectedOption.value && !isNaN(precoPorUnidade) && !isNaN(quantidade) && quantidade > 0) {
        const custo = precoPorUnidade * quantidade;
        custoPreviewEl.textContent = custo.toFixed(2);
    } else {
        custoPreviewEl.textContent = '0.00';
    }
}

export function updateRecipeCostPreview() {
    let custoTotal = 0;
    const ingredienteFields = ingredientesReceitaContainer.querySelectorAll('.ingrediente-item-form');
    ingredienteFields.forEach(field => {
        const custoText = field.querySelector('.custo-ingrediente-preview').textContent;
        custoTotal += parseFloat(custoText) || 0;
    });
    custoTotalReceitaPreview.textContent = custoTotal.toFixed(2);
    updateSalePricePreview(); 
}

export function getRecipeFormData() {
    const nome = document.getElementById('receita-nome').value;
    const instrucoes = document.getElementById('receita-instrucoes').value;
    const ingredientes = [];
    let custoTotalCalculado = 0;

    const ingredienteFields = ingredientesReceitaContainer.querySelectorAll('.ingrediente-item-form');
    ingredienteFields.forEach(field => {
        const materialSelect = field.querySelector('.material-select');
        const selectedOption = materialSelect.options[materialSelect.selectedIndex];
        const quantidadeInput = field.querySelector('.quantidade-material');

        if (selectedOption.value && quantidadeInput.value) {
            const materialId = selectedOption.value;
            const nomeMaterial = selectedOption.text.split(' (')[0]; // Pega só o nome
            const quantidade = parseFloat(quantidadeInput.value);
            const unidadeMaterial = selectedOption.dataset.unidade;
            const precoPorUnidade = parseFloat(selectedOption.dataset.preco);
            const custoIngrediente = precoPorUnidade * quantidade;

            ingredientes.push({
                materialId,
                nomeMaterial,
                quantidade,
                unidadeMaterial,
                custoIngrediente
            });
            custoTotalCalculado += custoIngrediente;
        }
    });

    if (!nome || !instrucoes || ingredientes.length === 0) {
        alert("Por favor, preencha todos os campos da receita, incluindo pelo menos um ingrediente.");
        return null;
    }

    return {
        nome,
        instrucoes,
        ingredientes,
        custoTotal: custoTotalCalculado
    };
}

export function clearRecipeForm() {
    document.getElementById('form-cadastro-receita').reset();
    ingredientesReceitaContainer.innerHTML = '';
    margemLucroPercentualInput.value = '100'; // Valor padrão
    addIngredienteField(); // Adiciona um campo de ingrediente inicial
    updateRecipeCostPreview(); // Isso já chama updateSalePricePreview que resetará o valor
}

export function clearMaterialForm() {
    document.getElementById('form-cadastro-material').reset();
}

export function updateSalePricePreview() {
    const custoTotalText = custoTotalReceitaPreview.textContent;
    const custoTotal = parseFloat(custoTotalText) || 0;
    const margemPercentual = parseFloat(margemLucroPercentualInput.value) || 0;

    if (custoTotal > 0 && margemPercentual >= 0) {
        const precoVenda = custoTotal * (1 + (margemPercentual / 100));
        precoVendaSugeridoPreview.textContent = precoVenda.toFixed(2);
    } else {
        precoVendaSugeridoPreview.textContent = '0.00';
    }
}

