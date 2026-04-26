# Sistema Gestão Receitas

_Started 2026-04-26 13:20 UTC_

---

## User

GitHub connected

## Assistant

Hey! 👋 You can paste any github.com repository URL — a repo, folder, or file — and I'll explore the structure and pull in the files we need to use as reference for design mockups.

## User

crie um protótipo de um sistema de gestão que possui cadastro de insumos para utilizar nas receitas e cadastro de receitas que calcula custo e preço sugerido para venda.

## Assistant

Vou criar um protótipo de sistema de gestão para cadastro de insumos e receitas com cálculo de custo e preço de venda. Antes de começar, deixa eu fazer algumas perguntas para entender melhor o que você precisa:

_[tool: questions_v2]_

## User

Questions answered:
- contexto: Marmitaria/Food service
- plataforma: Ambos / responsivo
- imagens_referencia: Sim, seguir estética similar (clean, mobile, cards)
- telas_principais: Dashboard com visão geral, Lista de receitas, Lista de insumos, Cadastro/edição de insumo, Cadastro/edição de receita (com cálculo), Detalhe de receita (ficha técnica)
- campos_insumo: Nome, Categoria (farinhas, laticínios, etc), Unidade de medida (kg, g, L, ml, un), Preço de compra, Quantidade comprada (ex: pacote de 5kg por R$25), Custo unitário (calculado automaticamente), Data de última compra, Estoque atual
- calculo_preco: Custo dos insumos (matéria-prima), Margem de lucro (%), Taxas de marketplace/iFood
- extras_receita: Rendimento (quantas porções/unidades), Modo de preparo (passo a passo), Categoria/tag
- interatividade: Navegação entre telas + alguns formulários funcionais
- estetica: Caloroso e convidativo (tons terrosos, ideal pra confeitaria)
- variacoes: Sim, 2-3 variações da tela de cadastro de receita (a tela mais importante)
- idioma: Português (BR)

## Assistant

Boa! Vou começar a montar. Plano:

**Sistema:** "Marmita" — gestão para marmitaria. Web responsivo, estética calorosa (off-whites cremosos, terracota como accent, verde-oliva secundário), tipografia: Fraunces (display) + Inter (UI)... espera, Fraunces e Inter estão na lista a evitar. Vou usar **Instrument Serif** (display) + **Geist** (UI), bem caloroso e fora do óbvio.

**Telas:** Dashboard, Lista de Insumos, Cadastro de Insumo, Lista de Receitas, Cadastro de Receita (com cálculo ao vivo) + 3 variações dessa tela, Detalhe/Ficha técnica.

**Estrutura:** vou usar `design_canvas` para apresentar tudo lado a lado, com a tela de cadastro de receita aparecendo em 3 variações.

_[tool: update_todos]_

_[tool: copy_starter_component]_

Vou começar montando a estrutura principal e os componentes compartilhados.

_[tool: write_file]_

_[tool: write_file]_

Agora vou criar os dados compartilhados (insumos e receitas) e os componentes de cada tela.

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

Agora as 3 variações da tela mais importante — Cadastro de Receita com cálculo. Cada uma tem uma abordagem visual e de UX diferente.

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Pronto! Sistema **Marmita** criado.

**O que tem:**
- **5 telas mobile** do fluxo principal: Dashboard, Lista de Insumos, Cadastrar Insumo (com cálculo automático de custo unitário), Lista de Receitas e Ficha Técnica detalhada
- **3 variações da tela de cadastro de receita** — a mais crítica, onde acontece o cálculo de custo + preço sugerido:
  - **A · Mobile clean** — fluxo vertical com rodapé sticky mostrando cálculo ao vivo, picker de insumos como bottom sheet
  - **B · Desktop split** — formulário à esquerda + painel de cálculo lateral fixo com card de preço grande e sliders
  - **C · Editorial / "recibo do chef"** — vibe de receituário tipográfico com um "recibo" ao lado mostrando o cálculo passo a passo

**Estética:** tons terrosos calorosos (terracota como accent, cremes e off-whites), tipografia Instrument Serif (display) + Geist (UI) + JetBrains Mono nos números/recibo.

**Interatividade:** os 3 cadastros de receita têm cálculo real — adicionar/remover insumos, ajustar quantidades e mexer nos sliders de margem e taxa atualiza preço em tempo real. Filtros nas listas também funcionam.

Próximos passos sugeridos quando quiser: telas de relatórios/dashboard de margem por receita, fluxo de "produção do dia" puxando insumos do estoque, e configurações de custos fixos rateados.

