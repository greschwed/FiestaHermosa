// js/ui.js
import { getMaterials } from './firestoreService.js';
import { calculateCostPerRecipeUnit, CONVERSION_FACTORS } from './firestoreService.js';

export let allMaterialsCache = []; // Cache para os materiais disponíveis

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
const formMaterialTitulo = document.getElementById('form-material-titulo');
const formMaterialSubmitBtn = document.getElementById('form-material-submit-btn');
const cancelarEdicaoMaterialBtnUI = document.getElementById('cancelar-edicao-material-btn');
const materialNomeInput = document.getElementById('material-nome');
const materialUnidadeInput = document.getElementById('material-unidade');
const materialPrecoInput = document.getElementById('material-preco');
const listaMateriaisCadastradosUI = document.getElementById('lista-materiais-cadastrados');
const materialPrecoCompraInput = document.getElementById('material-preco-compra');
const materialQtdCompraInput = document.getElementById('material-qtd-compra');
const materialUnidadeCompraSelect = document.getElementById('material-unidade-compra');
const materialUnidadeReceitaSelect = document.getElementById('material-unidade-receita');
const custoCalculadoPreviewSpan = document.getElementById('custo-calculado-preview');

const sections = [listarReceitasSection, detalheReceitaSection, cadastrarMaterialSection, cadastrarReceitaSection];
let onEditMaterialCallback = null;

export function setOnEditMaterialCallback(callback) {
    onEditMaterialCallback = callback;
}

//Opções de Ações para Menu Ingredientes

export function setMaterialFormMode(mode) { // Remova 'materialId' dos parâmetros aqui
    // currentEditingMaterialId = materialId; // <<< REMOVA ESTA LINHA

    if (mode === 'edit') {
        formMaterialTitulo.textContent = 'Editar Ingrediente';
        formMaterialSubmitBtn.textContent = 'Atualizar Ingrediente';
        cancelarEdicaoMaterialBtnUI.style.display = 'inline-block';
    } else { // 'create'
        formMaterialTitulo.textContent = 'Cadastrar Novo Ingrediente';
        formMaterialSubmitBtn.textContent = 'Adicionar Ingrediente';
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
    updateCustoCalculadoPreview(); // Atualiza o preview com os dados carregados
}

export function getMaterialFormData() {
    const nome = materialNomeInput.value.trim();
    const precoCompra = materialPrecoCompraInput.value; // Já é string, parseFloat no backend
    const quantidadeCompra = materialQtdCompraInput.value; // Já é string, parseFloat no backend
    const unidadeCompra = materialUnidadeCompraSelect.value;
    const unidadeReceita = materialUnidadeReceitaSelect.value;

    // Validação básica dos campos obrigatórios
    if (!nome || !precoCompra || !quantidadeCompra || !unidadeCompra || !unidadeReceita) {
        alert("Por favor, preencha todos os campos do material obrigatórios.");
        return null;
    }
    // Validação mais específica (ex: números positivos) pode ser feita aqui ou antes de chamar calculateCostPerRecipeUnit

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
    allMaterialsCache = materials; // Cache para os selects de receita
    listaMateriaisCadastradosUI.innerHTML = '';
    if (!materials || materials.length === 0) {
        listaMateriaisCadastradosUI.innerHTML = '<li>Nenhum material cadastrado.</li>';
        return;
    }
    materials.forEach(material => {
        const li = document.createElement('li');
        // Exibe o custo por unidade de receita
        const custoDisplay = material.custoPorUnidadeReceita !== undefined ?
            `R$ ${parseFloat(material.custoPorUnidadeReceita).toFixed(4)} / ${material.unidadeReceita}` :
            'Custo não calculado';

        li.innerHTML = `
            <span class="material-info">${material.nome} (${custoDisplay})</span>
            <div class="material-actions">
                <button class="edit-material-btn" data-id="${material.id}">Editar</button>
            </div>
        `;
        const editBtn = li.querySelector('.edit-material-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (event) => {
                const materialId = event.target.dataset.id;
                if (onEditMaterialCallback) { // onEditMaterialCallback foi setado em app.js
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

let ingredientesDaReceitaAtual = []; // Armazena os ingredientes adicionados no formulário


// CRUCIAL: Atualizar como os selects de material nas receitas são populados

export function _populateMaterialSelect(materialSelect) {
    materialSelect.innerHTML = '<option value="">Selecione um material</option>';

    if (allMaterialsCache && allMaterialsCache.length > 0) {
        allMaterialsCache.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            // O texto da opção agora mostra o custo calculado e a unidade de receita
            option.textContent = `${material.nome} (R$ ${parseFloat(material.custoPorUnidadeReceita || 0).toFixed(4)}/${material.unidadeReceita})`;
            // O dataset.unidade agora é a unidade DA RECEITA
            option.dataset.unidade = material.unidadeReceita;
            // O dataset.precoUnidade agora é o CUSTO POR UNIDADE DE RECEITA
            option.dataset.precoUnidade = material.custoPorUnidadeReceita;
            materialSelect.appendChild(option);
        });
    }
}

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
    if (!allMaterialsCache || allMaterialsCache.length === 0) { // Adicionada verificação de nulidade/vazio
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
            ${allMaterialsCache.map(m => {
                // Usar custoPorUnidadeReceita e unidadeReceita
                const custoDisplay = parseFloat(m.custoPorUnidadeReceita || 0).toFixed(4); // Usar 4 casas para o display no select
                const unidadeReceitaDisplay = m.unidadeReceita || 'N/A';
                return `<option value="${m.id}" data-preco="${m.custoPorUnidadeReceita}" data-unidade="${unidadeReceitaDisplay}">${m.nome} (${unidadeReceitaDisplay} - R$ ${custoDisplay})</option>`;
            }).join('')}
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
    const custoPreviewSpan = div.querySelector('.custo-ingrediente-preview'); // Este é o <span>

    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        if (selectedOption && selectedOption.value) { // Apenas se uma opção de material válida for selecionada
            unidadeDisplay.textContent = `(${selectedOption.dataset.unidade || ''})`;
        } else {
            unidadeDisplay.textContent = ''; // Limpa se "Selecione um material"
        }
        updateSingleIngredientCost(select, quantidadeInput, custoPreviewSpan); // Passa o <span>
        updateRecipeCostPreview();
    });

    quantidadeInput.addEventListener('input', () => {
        updateSingleIngredientCost(select, quantidadeInput, custoPreviewSpan); // Passa o <span>
        updateRecipeCostPreview();
    });

    div.querySelector('.remover-ingrediente-btn').addEventListener('click', () => {
        div.remove();
        updateRecipeCostPreview(); // Fundamental recalcular ao remover
    });

    // Chame para definir a unidade inicial se o select já tiver um valor (ao editar)
    // ou para limpar a unidade se for "Selecione um material"
    const initialSelectedOption = select.options[select.selectedIndex];
    if (initialSelectedOption && initialSelectedOption.value) {
        unidadeDisplay.textContent = `(${initialSelectedOption.dataset.unidade || ''})`;
    } else {
        unidadeDisplay.textContent = '';
    }
}

function updateCustoCalculadoPreview() {
    const precoCompra = materialPrecoCompraInput.value;
    const qtdCompra = materialQtdCompraInput.value;
    const unidadeCompra = materialUnidadeCompraSelect.value;
    const unidadeReceita = materialUnidadeReceitaSelect.value;

    if (precoCompra && qtdCompra && unidadeCompra && unidadeReceita) {
        // Usar a função de cálculo importada ou definida localmente
        // Para usar aqui, calculateCostPerRecipeUnit precisaria ser exportada de firestoreService.js
        // e importada em ui.js, ou movida para um local comum.
        // Por ora, podemos assumir que o backend fará o cálculo final.
        // Esta preview é apenas uma estimativa visual.
        // Para um preview preciso, a função calculateCostPerRecipeUnit teria que ser chamada aqui.
        // Vamos simplificar e apenas mostrar "Aguardando cálculo" ou algo similar,
        // já que o cálculo real e a validação ocorrem no backend/firestoreService.
        // Ou, para um preview real, você precisaria ter acesso à função de cálculo aqui.

        // Exemplo com chamada à função (requer que ela seja acessível aqui)
    const custo = calculateCostPerRecipeUnit(precoCompra, qtdCompra, unidadeCompra, unidadeReceita);
    if (custo !== null && isFinite(custo)) { // Adicionado isFinite para checar se é um número válido
        custoCalculadoPreviewSpan.textContent = `${custo.toFixed(5)} / ${unidadeReceita}`;
    } else {
        custoCalculadoPreviewSpan.textContent = "Verifique unidades";
    }

    } else {
        custoCalculadoPreviewSpan.textContent = "---";
    }
}

// Adicionar listeners para atualizar o preview
if(materialPrecoCompraInput && materialQtdCompraInput && materialUnidadeCompraSelect && materialUnidadeReceitaSelect) {
    [materialPrecoCompraInput, materialQtdCompraInput, materialUnidadeCompraSelect, materialUnidadeReceitaSelect].forEach(el => {
        el.addEventListener('input', updateCustoCalculadoPreview);
        el.addEventListener('change', updateCustoCalculadoPreview); // Para selects
    });
}

function updateSingleIngredientCost(materialSelect, quantidadeInput, custoPreviewEl) {
    const selectedOption = materialSelect.options[materialSelect.selectedIndex];
    const precoPorUnidade = parseFloat(selectedOption.dataset.precoPorUnidade);
    const quantidade = parseFloat(quantidadeInput.value);
if (selectedOption && selectedOption.value && typeof selectedOption.dataset.preco !== 'undefined') {
        const precoPorUnidade = parseFloat(selectedOption.dataset.preco); // Vem de data-preco
        const quantidade = parseFloat(quantidadeInput.value);

        if (!isNaN(precoPorUnidade) && !isNaN(quantidade) && quantidade > 0) {
            const custo = precoPorUnidade * quantidade;
            custoPreviewEl.textContent = custo.toFixed(2); // APENAS O NÚMERO
        } else {
            custoPreviewEl.textContent = "0.00"; // APENAS O NÚMERO
        }
    } else {
        // Caso "Selecione um material" ou opção sem data-preco
        custoPreviewEl.textContent = "0.00"; // APENAS O NÚMERO
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
            const materialDoCache = allMaterialsCache.find(m => m.id === materialId);
            const nomeMaterial = materialDoCache ? materialDoCache.nome : selectedOption.text.split(' (')[0]; // Fallback se não achar no cache            const quantidade = parseFloat(quantidadeInput.value);
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
        margemLucro: margemLucroValor,
        precoVendaSugerido: precoVendaCalculado // Use o valor recalculado
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
    custoCalculadoPreviewSpan.textContent = "---"; // Limpa o preview
    // Se materialNomeInput for uma referência global/módulo:
    // materialNomeInput.value = '';
    // materialPrecoCompraInput.value = '';
    // ... etc.
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

