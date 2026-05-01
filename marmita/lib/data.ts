export interface Insumo {
  id: string;
  nome: string;
  cat: string;
  un: string;
  precoCompra: number;
  qtdCompra: number;
  custoUn: number;
  estoque: number;
  ultCompra: string;
  emoji: string;
}

export interface IngredienteReceita {
  id: string;
  qtd: number;
}

export interface Receita {
  id: string;
  nome: string;
  cat: string;
  rendimento: number;
  custoTotal: number;
  custoPorcao: number;
  precoSugerido: number;
  margem: number;
  taxaApp: number;
  foto: string;
  ingredientes: IngredienteReceita[];
  preparo: string[];
}

export const INSUMOS: Insumo[] = [
  { id: 'i1', nome: 'Arroz branco', cat: 'Grãos', un: 'kg', precoCompra: 28.50, qtdCompra: 5, custoUn: 5.70, estoque: 12.4, ultCompra: '12 abr', emoji: '🍚' },
  { id: 'i2', nome: 'Feijão carioca', cat: 'Grãos', un: 'kg', precoCompra: 32.00, qtdCompra: 5, custoUn: 6.40, estoque: 8.2, ultCompra: '12 abr', emoji: '🫘' },
  { id: 'i3', nome: 'Peito de frango', cat: 'Proteínas', un: 'kg', precoCompra: 89.90, qtdCompra: 5, custoUn: 17.98, estoque: 14.0, ultCompra: '22 abr', emoji: '🍗' },
  { id: 'i4', nome: 'Patinho moído', cat: 'Proteínas', un: 'kg', precoCompra: 42.90, qtdCompra: 1, custoUn: 42.90, estoque: 3.5, ultCompra: '20 abr', emoji: '🥩' },
  { id: 'i5', nome: 'Cenoura', cat: 'Hortifruti', un: 'kg', precoCompra: 6.99, qtdCompra: 1, custoUn: 6.99, estoque: 2.1, ultCompra: '24 abr', emoji: '🥕' },
  { id: 'i6', nome: 'Tomate', cat: 'Hortifruti', un: 'kg', precoCompra: 8.49, qtdCompra: 1, custoUn: 8.49, estoque: 1.8, ultCompra: '24 abr', emoji: '🍅' },
  { id: 'i7', nome: 'Alho', cat: 'Hortifruti', un: 'kg', precoCompra: 32.00, qtdCompra: 0.5, custoUn: 64.00, estoque: 0.6, ultCompra: '15 abr', emoji: '🧄' },
  { id: 'i8', nome: 'Cebola', cat: 'Hortifruti', un: 'kg', precoCompra: 4.99, qtdCompra: 1, custoUn: 4.99, estoque: 5.2, ultCompra: '24 abr', emoji: '🧅' },
  { id: 'i9', nome: 'Óleo de soja', cat: 'Mercearia', un: 'L', precoCompra: 8.49, qtdCompra: 0.9, custoUn: 9.43, estoque: 4.5, ultCompra: '12 abr', emoji: '🫗' },
  { id: 'i10', nome: 'Sal refinado', cat: 'Mercearia', un: 'kg', precoCompra: 3.20, qtdCompra: 1, custoUn: 3.20, estoque: 2.0, ultCompra: '12 abr', emoji: '🧂' },
  { id: 'i11', nome: 'Embalagem 750ml', cat: 'Embalagens', un: 'un', precoCompra: 65.00, qtdCompra: 100, custoUn: 0.65, estoque: 280, ultCompra: '18 abr', emoji: '📦' },
  { id: 'i12', nome: 'Brócolis', cat: 'Hortifruti', un: 'kg', precoCompra: 12.90, qtdCompra: 1, custoUn: 12.90, estoque: 0.8, ultCompra: '24 abr', emoji: '🥦' },
  { id: 'i13', nome: 'Batata', cat: 'Hortifruti', un: 'kg', precoCompra: 5.49, qtdCompra: 1, custoUn: 5.49, estoque: 6.0, ultCompra: '20 abr', emoji: '🥔' },
  { id: 'i14', nome: 'Salmão', cat: 'Proteínas', un: 'kg', precoCompra: 89.00, qtdCompra: 1, custoUn: 89.00, estoque: 2.0, ultCompra: '23 abr', emoji: '🐟' },
];

export const RECEITAS: Receita[] = [
  {
    id: 'r1',
    nome: 'Frango grelhado com arroz integral',
    cat: 'Fitness',
    rendimento: 8,
    custoTotal: 38.20,
    custoPorcao: 4.78,
    precoSugerido: 22.90,
    margem: 60,
    taxaApp: 18,
    foto: 'frango-grelhado',
    ingredientes: [
      { id: 'i3', qtd: 1.2 }, { id: 'i1', qtd: 1.0 }, { id: 'i12', qtd: 0.4 },
      { id: 'i7', qtd: 0.05 }, { id: 'i9', qtd: 0.08 }, { id: 'i10', qtd: 0.02 }, { id: 'i11', qtd: 8 },
    ],
    preparo: [
      'Tempere o frango com sal, alho e ervas. Deixe descansar 20 min.',
      'Cozinhe o arroz integral em fogo médio com 2,5 partes de água.',
      'Refogue o brócolis no alho com um fio de óleo, sem deixar amolecer.',
      'Grelhe o frango em chapa quente, 4 min de cada lado.',
      'Monte o prato: arroz, brócolis, frango por cima.',
    ],
  },
  {
    id: 'r2',
    nome: 'Strogonoff de carne tradicional',
    cat: 'Tradicional',
    rendimento: 6,
    custoTotal: 47.80,
    custoPorcao: 7.97,
    precoSugerido: 28.90,
    margem: 55,
    taxaApp: 18,
    foto: 'strogonoff',
    ingredientes: [
      { id: 'i4', qtd: 0.8 }, { id: 'i1', qtd: 0.7 }, { id: 'i8', qtd: 0.3 },
      { id: 'i7', qtd: 0.04 }, { id: 'i6', qtd: 0.2 }, { id: 'i11', qtd: 6 },
    ],
    preparo: [
      'Corte a carne em tiras finas.',
      'Refogue cebola e alho até dourar.',
      'Adicione carne e doure bem.',
      'Acrescente molho de tomate e deixe apurar.',
      'Finalize com creme de leite e sirva.',
    ],
  },
  { id: 'r3', nome: 'Salmão grelhado com legumes', cat: 'Fitness', rendimento: 4, custoTotal: 98.40, custoPorcao: 24.60, precoSugerido: 49.90, margem: 50, taxaApp: 18, foto: 'salmao', ingredientes: [{ id: 'i14', qtd: 0.8 }, { id: 'i12', qtd: 0.4 }, { id: 'i5', qtd: 0.3 }, { id: 'i11', qtd: 4 }], preparo: [] },
  { id: 'r4', nome: 'Feijoada light', cat: 'Tradicional', rendimento: 10, custoTotal: 62.00, custoPorcao: 6.20, precoSugerido: 24.90, margem: 60, taxaApp: 18, foto: 'feijoada', ingredientes: [], preparo: [] },
  { id: 'r5', nome: 'Lasanha à bolonhesa', cat: 'Tradicional', rendimento: 8, custoTotal: 54.30, custoPorcao: 6.79, precoSugerido: 26.90, margem: 60, taxaApp: 18, foto: 'lasanha', ingredientes: [], preparo: [] },
  { id: 'r6', nome: 'Vegano: grão-de-bico ao curry', cat: 'Vegano', rendimento: 6, custoTotal: 28.50, custoPorcao: 4.75, precoSugerido: 21.90, margem: 65, taxaApp: 18, foto: 'curry', ingredientes: [], preparo: [] },
];

export const CATEGORIAS_INSUMO = ['Grãos', 'Proteínas', 'Hortifruti', 'Mercearia', 'Embalagens', 'Laticínios', 'Temperos'];
export const CATEGORIAS_RECEITA = [
  'Pães',
  'Bolos',
  'Doces',
  'Tortas Doce',
  'Tortas Salgadas',
  'Salgados e Petiscos',
  'Biscoitos e Bolachas',
  'Chocolates e Trufas',
];
export const UNIDADES = ['kg', 'g', 'L', 'ml', 'un'];

export function fmtBRL(n: number): string {
  return 'R$ ' + (n || 0).toFixed(2).replace('.', ',');
}

export function fmtNum(n: number, decimals = 2): string {
  return (n || 0).toFixed(decimals).replace('.', ',');
}
