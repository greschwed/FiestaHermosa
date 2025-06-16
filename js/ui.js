// js/ui.js
import { getMaterials } from './firestoreService.js';
import { calculateCostPerRecipeUnit, CONVERSION_FACTORS } from './firestoreService.js';

export let allMaterialsCache = []; // Cache para os materiais disponíveis

// Elementos do DOM
const loginBtn = document.getElementById('login-google-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoP = document.getElementById('user-info');
const appNav = document.getElementById('app-nav');
const appContent = document.getElementById('app-content');
const listarReceitasSection = document.getElementById('listar-receitas-section');
const detalheReceitaSection = document.getElementById('detalhe-receita-section');
const cadastrarMaterialSection = document.getElementById('cadastrar-material-section');
const cadastrarReceitaSection = document.getElementById('cadastrar-receita-section');
const formReceitaTitulo = document.getElementById('form-receita-titulo');
const formReceitaSubmitBtn = document.getElementById('form-receita-submit-btn');
const cancelarEdicaoBtnUI = document.getElementById('cancelar-edicao-btn');
const receitaNomeInput = document.getElementById('receita-nome');
const receitaInstrucoesInput = document.getElementById('receita-instrucoes');
const formMaterialTitulo = document.getElementById('form-material-titulo');
const formMaterialSubmitBtn = document.getElementById('form-material-submit-btn');
const cancelarEdicaoMaterialBtnUI = document.getElementById('cancelar-edicao-material-btn');
const materialNomeInput = document.getElementById('material-nome');
const listaMateriaisCadastradosUI = document.getElementById('lista-materiais-cadastrados');
const materialPrecoCompraInput = document.getElementById('material-preco-compra');
const materialQtdCompraInput = document.getElementById('material-qtd-compra');
const materialUnidadeCompraSelect = document.getElementById('material-unidade-compra');
const materialUnidadeReceitaSelect = document.getElementById('material-unidade-receita');
const custoCalculadoPreviewSpan = document.getElementById('custo-calculado-preview');
const adminFilterContainer = document.getElementById('admin-filter-container');
const userFilterSelect = document.getElementById('user-filter-select');

const sections = [listarReceitasSection, detalheReceitaSection, cadastrarMaterialSection, cadastrarReceitaSection];
let onEditMaterialCallback = null;

export function setOnEditMaterialCallback(callback) {
    onEditMaterialCallback = callback;
}

// --- Funções de UI para Admin ---

export function toggleAdminFilter(isAdmin) {
    adminFilterContainer.style.display = isAdmin ? 'block' : 'none';
}

export function setupAdminFilter(users, onChangeCallback) {
    userFilterSelect.innerHTML = '<option value="">Todos os Usuários</option>'; // Opção para ver todos
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userFilterSelect.appendChild(option);
    });
    userFilterSelect.removeEventListener('change', onChangeCallback); // Evita duplicar listener
    userFilterSelect.addEventListener('change', onChangeCallback);
}


//Opções de Ações para Menu Ingredientes
export function setMaterialFormMode(mode) {
    if (mode === 'edit') {
        formMaterialTitulo.innerHTML = '<i class="fas fa-edit"></i> Editar Ingrediente';
        formMaterialSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Ingrediente';
        cancelarEdicaoMaterialBtnUI.style.display = 'inline-flex';
    } else { // 'create'
        formMaterialTitulo.innerHTML = '<i class="fas fa-plus-circle"></i> Cadastrar Novo Ingrediente';
        formMaterialSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Adicionar Ingrediente';
        cancelarEdicaoMaterialBtnUI.style.display = 'none';
        clearMaterialForm();
    }
}

export function populateMaterialFormForEdit(material) {
    materialNomeInput.value = material.nome || '';
    materialPrecoCompraInput.value = material.precoCompra !== undefined ? parseFloat(material.precoCompra).toFixed(2) : '';
    materialQtdCompraInput.value = material.quantidadeCompra !== undefined ? parseFloat(material.quantidadeCompra) : '';
    materialUnidadeCompraSelect.value = material.unidadeCompra || '';
    materialUnidadeReceitaSelect.value = material.unidadeReceita || '';
    updateCustoCalculadoPreview();
}

export function getMaterialFormData() {
    const nome = materialNomeInput.value.trim();
    const precoCompra = materialPrecoCompraInput.value;
    const quantidadeCompra = materialQtdCompraInput.value;
    const unidadeCompra = materialUnidadeCompraSelect.value;
    const unidadeReceita = materialUnidadeReceitaSelect.value;

    if (!nome || !precoCompra || !quantidadeCompra || !unidadeCompra || !unidadeReceita) {
        alert("Por favor, preencha todos os campos do material obrigatórios.");
        return null;
    }
    return { nome, precoCompra, quantidadeCompra, unidadeCompra, unidadeReceita };
}

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
        showSection('listar-receitas-section');
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userInfoP.style.display = 'none';
        appNav.style.display = 'none';
        appContent.style.display = 'none';
        hideAllSections();
        toggleAdminFilter(false); // Esconde filtro no logout
    }
}

// --- UI para Receitas ---
const receitasContainer = document.getElementById('receitas-container');
export function renderRecipeList(recipes, onRecipeClickCallback) {
    receitasContainer.innerHTML = '';
    if (recipes.length === 0) {
        receitasContainer.innerHTML = '<p>Nenhuma receita encontrada para este usuário.</p>';
        return;
    }
    recipes.forEach(recipe => {
        const item = document.createElement('div');
        item.classList.add('receita-item'); 

        const custoText = `Custo: R$ ${parseFloat(recipe.custoTotal || 0).toFixed(2)}`;
        let precoVendaText = 'Preço de Venda: N/A';
        if (typeof recipe.precoVendaSugerido !== 'undefined') {
            precoVendaText = `Venda: R$ ${parseFloat(recipe.precoVendaSugerido).toFixed(2)}`;
            if (typeof recipe.margemLucro !== 'undefined') {
                precoVendaText += ` (${recipe.margemLucro.toFixed(0)}%)`;
            }
        }
        
        item.innerHTML = `
            <h3>${recipe.nome}</h3>
            <div class="details">
                <p>${custoText}</p>
                <p>${precoVendaText}</p>
                ${recipe.userName ? `<p class="recipe-owner">Por: ${recipe.userName}</p>` : ''}
            </div>
        `;
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
    
    if (recipe.instrucoes) {
        detalheInstrucoes.innerHTML = recipe.instrucoes.replace(/\n/g, '<br>');
    } else {
        detalheInstrucoes.innerHTML = '';
    }

    detalheCusto.textContent = parseFloat(recipe.custoTotal || 0).toFixed(2);
    const detalheMargem = document.getElementById('detalhe-receita-margem');
    const detalhePrecoVenda = document.getElementById('detalhe-receita-preco-venda');

    if (detalheMargem) {
        detalheMargem.textContent = typeof recipe.margemLucro !== 'undefined' ? parseFloat(recipe.margemLucro).toFixed(0) : 'N/A';
    }
    if (detalhePrecoVenda) {
        detalhePrecoVenda.textContent = typeof recipe.precoVendaSugerido !== 'undefined' ? parseFloat(recipe.precoVendaSugerido).toFixed(2) : 'N/A';
    }
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
    allMaterialsCache = materials;
    listaMateriaisCadastradosUI.innerHTML = '';
    if (!materials || materials.length === 0) {
        listaMateriaisCadastradosUI.innerHTML = '<li>Nenhum material cadastrado para este usuário.</li>';
        return;
    }
    materials.forEach(material => {
        const li = document.createElement('li');
        const custoDisplay = material.custoPorUnidadeReceita !== undefined ?
            `R$ ${parseFloat(material.custoPorUnidadeReceita).toFixed(4)} / ${material.unidadeReceita}` :
            'Custo não calculado';

        li.innerHTML = `
            <span class="material-info">${material.nome} (${custoDisplay})</span>
            <div class="material-actions">
                <button class="edit-material-btn" data-id="${material.id}"><i class="fas fa-edit"></i> Editar</button>
            </div>
        `;
        const editBtn = li.querySelector('.edit-material-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (event) => {
                const materialId = event.target.closest('button').dataset.id;
                if (onEditMaterialCallback) { 
                    onEditMaterialCallback(materialId);
                }
            });
        }
        listaMateriaisCadastradosUI.appendChild(li);
    });
}

// --- UI para Cadastro de Receitas ---
const ingredientesReceitaContainer = document.getElementById('ingredientes-receita-container');
const custoTotalReceitaPreview = document.getElementById('custo-total-receita-preview');
const margemLucroPercentualInput = document.getElementById('margem-lucro-percentual');
const precoVendaSugeridoPreview = document.getElementById('preco-venda-sugerido-preview');

export async function setupRecipeForm() {
    // Busca os materiais mais recentes ao abrir o formulário
    await getMaterials().then(materials => {
        allMaterialsCache = materials; // Atualiza o cache
    });

    ingredientesReceitaContainer.innerHTML = ''; 
    updateRecipeCostPreview();
    addIngredienteField(); 
    margemLucroPercentualInput.removeEventListener('input', updateSalePricePreview);
    margemLucroPercentualInput.addEventListener('input', updateSalePricePreview);
    updateSalePricePreview();
}

export function addIngredienteField() {
    if (!allMaterialsCache || allMaterialsCache.length === 0) {
        alert("Nenhum material cadastrado. Por favor, cadastre um ingrediente primeiro.");
        return;
    }

    const fieldIndex = ingredientesReceitaContainer.children.length;
    const div = document.createElement('div');
    div.classList.add('ingrediente-item-form');
    div.innerHTML = `
        <select id="material-select-${fieldIndex}" class="material-select" required>
            <option value="">Selecione um material</option>
            ${allMaterialsCache.map(m => {
                const custoDisplay = parseFloat(m.custoPorUnidadeReceita || 0).toFixed(4);
                const unidadeReceitaDisplay = m.unidadeReceita || 'N/A';
                return `<option value="${m.id}" data-preco="${m.custoPorUnidadeReceita}" data-unidade="${unidadeReceitaDisplay}">${m.nome} (${unidadeReceitaDisplay})</option>`;
            }).join('')}
        </select>
        <input type="number" id="quantidade-material-${fieldIndex}" class="quantidade-material" step="0.01" min="0" required placeholder="Qtd.">
        <p class="custo-ingrediente-preview">Custo: R$ <span>0.00</span></p>
        <button type="button" class="remover-ingrediente-btn"><i class="fas fa-trash-alt"></i></button>
    `;
    ingredientesReceitaContainer.appendChild(div);

    const select = div.querySelector('.material-select');
    const quantidadeInput = div.querySelector('.quantidade-material');
    const custoPreviewSpan = div.querySelector('.custo-ingrediente-preview span'); 

    select.addEventListener('change', () => {
        updateSingleIngredientCost(select, quantidadeInput, custoPreviewSpan);
        updateRecipeCostPreview();
    });
    quantidadeInput.addEventListener('input', () => {
        updateSingleIngredientCost(select, quantidadeInput, custoPreviewSpan);
        updateRecipeCostPreview();
    });
    div.querySelector('.remover-ingrediente-btn').addEventListener('click', () => {
        div.remove();
        updateRecipeCostPreview();
    });
}

function updateCustoCalculadoPreview() {
    const precoCompra = materialPrecoCompraInput.value;
    const qtdCompra = materialQtdCompraInput.value;
    const unidadeCompra = materialUnidadeCompraSelect.value;
    const unidadeReceita = materialUnidadeReceitaSelect.value;

    if (precoCompra && qtdCompra && unidadeCompra && unidadeReceita) {
        const custo = calculateCostPerRecipeUnit(precoCompra, qtdCompra, unidadeCompra, unidadeReceita);
        if (custo !== null && isFinite(custo)) { 
            custoCalculadoPreviewSpan.textContent = `${custo.toFixed(5)} / ${unidadeReceita}`;
        } else {
            custoCalculadoPreviewSpan.textContent = "Verifique unidades";
        }
    } else {
        custoCalculadoPreviewSpan.textContent = "---";
    }
}

if(materialPrecoCompraInput && materialQtdCompraInput && materialUnidadeCompraSelect && materialUnidadeReceitaSelect) {
    [materialPrecoCompraInput, materialQtdCompraInput, materialUnidadeCompraSelect, materialUnidadeReceitaSelect].forEach(el => {
        el.addEventListener('input', updateCustoCalculadoPreview);
        el.addEventListener('change', updateCustoCalculadoPreview);
    });
}

function updateSingleIngredientCost(materialSelect, quantidadeInput, custoPreviewEl) {
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    if (selectedOption && selectedOption.value && typeof selectedOption.dataset.preco !== 'undefined') {
        const precoPorUnidade = parseFloat(selectedOption.dataset.preco);
        const quantidade = parseFloat(quantidadeInput.value);
        if (!isNaN(precoPorUnidade) && !isNaN(quantidade) && quantidade > 0) {
            custoPreviewEl.textContent = (precoPorUnidade * quantidade).toFixed(2);
        } else {
            custoPreviewEl.textContent = "0.00";
        }
    } else {
        custoPreviewEl.textContent = "0.00";
    }   
}

export function updateRecipeCostPreview() {
    let custoTotal = 0;
    const ingredienteFields = ingredientesReceitaContainer.querySelectorAll('.ingrediente-item-form');
    ingredienteFields.forEach(field => {
        const custoText = field.querySelector('.custo-ingrediente-preview span').textContent;
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
            const materialDoCache = allMaterialsCache.find(m => m.id === materialId);
            const nomeMaterial = materialDoCache ? materialDoCache.nome : selectedOption.text.split(' (')[0];
            const quantidade = parseFloat(quantidadeInput.value);
            const unidadeMaterial = selectedOption.dataset.unidade;
            const precoPorUnidade = parseFloat(selectedOption.dataset.preco);

            if (!isNaN(precoPorUnidade) && !isNaN(quantidade)) {
                const custoIngrediente = precoPorUnidade * quantidade;
                ingredientes.push({ materialId, nomeMaterial, quantidade, unidadeMaterial, custoIngrediente });
                custoTotalCalculado += custoIngrediente;
            }
        }
    });

    if (!nome || !instrucoes || ingredientes.length === 0) {
        alert("Por favor, preencha todos os campos da receita, incluindo pelo menos um ingrediente.");
        return null;
    }

    const margemLucroValor = parseFloat(margemLucroPercentualInput.value) || 0;
    const precoVendaCalculado = custoTotalCalculado * (1 + (margemLucroValor / 100));

   return {
        nome,
        instrucoes,
        ingredientes,
        custoTotal: custoTotalCalculado,
        margemLucro: margemLucroValor,
        precoVendaSugerido: precoVendaCalculado
    };
}

export function clearRecipeForm() {
    document.getElementById('form-cadastro-receita').reset();
    ingredientesReceitaContainer.innerHTML = '';
    margemLucroPercentualInput.value = '100';
    addIngredienteField();
    updateRecipeCostPreview();
}

export function clearMaterialForm() {
    document.getElementById('form-cadastro-material').reset();
    custoCalculadoPreviewSpan.textContent = "---";
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
        formReceitaTitulo.innerHTML = '<i class="fas fa-edit"></i> Editar Receita';
        formReceitaSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Atualizar Receita';
        cancelarEdicaoBtnUI.style.display = 'inline-flex';
    } else { 
        formReceitaTitulo.innerHTML = '<i class="fas fa-pen-fancy"></i> Cadastrar Nova Receita';
        formReceitaSubmitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Receita';
        cancelarEdicaoBtnUI.style.display = 'none';
        clearRecipeForm();
    }
}

export function populateRecipeFormForEdit(recipe) {
    clearRecipeForm(); 

    receitaNomeInput.value = recipe.nome || '';
    receitaInstrucoesInput.value = recipe.instrucoes || '';
    margemLucroPercentualInput.value = typeof recipe.margemLucro !== 'undefined' ? recipe.margemLucro : '100';

    ingredientesReceitaContainer.innerHTML = '';

    if (recipe.ingredientes && Array.isArray(recipe.ingredientes)) {
        recipe.ingredientes.forEach(ing => {
            addIngredienteField();
            const lastIngredienteField = ingredientesReceitaContainer.lastElementChild;
            if (lastIngredienteField) {
                const materialSelect = lastIngredienteField.querySelector('.material-select');
                const quantidadeInput = lastIngredienteField.querySelector('.quantidade-material');
                const custoPreview = lastIngredienteField.querySelector('.custo-ingrediente-preview span');

                if (materialSelect) materialSelect.value = ing.materialId;
                if (quantidadeInput) quantidadeInput.value = ing.quantidade;
                
                if (materialSelect && quantidadeInput && custoPreview) {
                     updateSingleIngredientCost(materialSelect, quantidadeInput, custoPreview);
                }
            }
        });
    }
    if (recipe.ingredientes.length === 0) { 
        addIngredienteField();
    }

    updateRecipeCostPreview();
}
