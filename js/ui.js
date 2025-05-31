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
const formReceitaTitulo = document.getElementById('form-receita-titulo');
const formReceitaSubmitBtn = document.getElementById('form-receita-submit-btn');
const cancelarEdicaoBtnUI = document.getElementById('cancelar-edicao-btn');
// Campos do formulário que serão populados
const receitaNomeInput = document.getElementById('receita-nome');
const receitaInstrucoesInput = document.getElementById('receita-instrucoes');


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

        // Preparar as strings de custo e preço de venda
        const custoText = `Custo: R$ ${parseFloat(recipe.custoTotal || 0).toFixed(2)}`;
        let precoVendaText = '';

        // Verifica se os campos de margem e preço de venda existem na receita
        // (para compatibilidade com receitas antigas)
        if (typeof recipe.precoVendaSugerido !== 'undefined') {
            precoVendaText = `Preço de Venda sugerido: R$ ${parseFloat(recipe.precoVendaSugerido).toFixed(2)}`;
            if (typeof recipe.margemLucro !== 'undefined') {
                precoVendaText += ` (${recipe.margemLucro.toFixed(0)}%)`;
            }
        } else {
            precoVendaText = 'Preço de Venda sugerido: Não calculado';
        }

        item.innerHTML = `
            <h3>${recipe.nome}</h3>
            <p>${custoText}</p>
            <p>${precoVendaText}</p>
        `;
        // Adicionamos um data attribute para fácil acesso ao ID se necessário no futuro
        item.dataset.recipeId = recipe.id;
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
    // CAPTURANDO OS VALORES DOS ELEMENTOS ESPECIFICADOS:
    // Pega o valor ATUAL do input com id "margem-lucro-percentual"
    const margemLucroValor = parseFloat(margemLucroPercentualInput.value) || 0;
    // Pega o valor ATUAL (textContent) do span com id "preco-venda-sugerido-preview"
    const precoVendaValor = parseFloat(precoVendaSugeridoPreview.textContent) || 0;
    return {
        nome,
        instrucoes,
        ingredientes,
        custoTotal: custoTotalCalculado,
        margemLucro: margemLucroValor,          // Valor do input margem-lucro-percentual
        precoVendaSugerido: precoVendaValor     // Valor do span preco-venda-sugerido-preview
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
export function setRecipeFormMode(mode, recipeId = null) {
    if (mode === 'edit') {
        formReceitaTitulo.textContent = 'Editar Receita';
        formReceitaSubmitBtn.textContent = 'Atualizar Receita';
        cancelarEdicaoBtnUI.style.display = 'inline-block';
    } else { // 'create' mode
        formReceitaTitulo.textContent = 'Cadastrar Nova Receita';
        formReceitaSubmitBtn.textContent = 'Salvar Receita';
        cancelarEdicaoBtnUI.style.display = 'none';
        clearRecipeForm(); // Garante que o formulário está limpo para nova receita
    }
}

export function populateRecipeFormForEdit(recipe) {
    clearRecipeForm(); // Começa limpando para evitar resíduos

    receitaNomeInput.value = recipe.nome || '';
    receitaInstrucoesInput.value = recipe.instrucoes || '';
    margemLucroPercentualInput.value = typeof recipe.margemLucro !== 'undefined' ? recipe.margemLucro : '100';

    ingredientesReceitaContainer.innerHTML = ''; // Limpa campos de ingredientes existentes

    if (recipe.ingredientes && Array.isArray(recipe.ingredientes)) {
        recipe.ingredientes.forEach(ing => {
            addIngredienteField(); // Adiciona um novo conjunto de campos de ingrediente
            const lastIngredienteField = ingredientesReceitaContainer.lastElementChild;
            if (lastIngredienteField) {
                const materialSelect = lastIngredienteField.querySelector('.material-select');
                const quantidadeInput = lastIngredienteField.querySelector('.quantidade-material');
                const unidadeDisplay = lastIngredienteField.querySelector('.unidade-display-receita'); // Para atualizar
                const custoPreview = lastIngredienteField.querySelector('.custo-ingrediente-preview'); // Para atualizar

                if (materialSelect) materialSelect.value = ing.materialId;
                if (quantidadeInput) quantidadeInput.value = ing.quantidade;

                // Disparar manualmente a atualização da unidade e custo do ingrediente individual
                // após definir os valores
                if (materialSelect && quantidadeInput && custoPreview) {
                    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
                    if (selectedOption && selectedOption.value) { // Garante que uma opção válida está selecionada
                         unidadeDisplay.textContent = `(${selectedOption.dataset.unidade || ''})`;
                         updateSingleIngredientCost(materialSelect, quantidadeInput, custoPreview);
                    } else if (materialSelect.options.length > 0) { // Se não achou, mas há opções, tenta a primeira
                        materialSelect.selectedIndex = 0; // ou uma opção placeholder
                        // e chama updateSingleIngredientCost
                    }
                }
            }
        });
    }
    if (recipe.ingredientes.length === 0) { // Se a receita salva não tinha ingredientes
        addIngredienteField();
    }


    updateRecipeCostPreview(); // Recalcula custo total e preço de venda com os dados carregados
}

