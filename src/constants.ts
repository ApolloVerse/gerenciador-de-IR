import { AssetType } from './types';

export const APP_VERSION = '1.2.0';

export const APP_CHANGELOG = [
  {
    version: '1.2.0',
    date: '2026-03-29',
    changes: [
      'Sistema de Versão e Snapshots de Dados.',
      'Melhorias na visualização de Tickers (Código do Ativo).',
      'Configuração de IA para GitHub Pages (Chave de API do Usuário).',
      'Automação de implantação no GitHub Pages.'
    ]
  },
  {
    version: '1.1.0',
    date: '2026-03-28',
    changes: [
      'Relatório IRPF com Grupos e Códigos oficiais.',
      'Dicas de preenchimento para cada ficha do IR.',
      'Filtros de Mês e Ano em Rendimentos.'
    ]
  },
  {
    version: '1.0.0',
    date: '2026-03-27',
    changes: [
      'Lançamento inicial do Gerenciador de Investimentos.',
      'Importação de PDFs via IA.',
      'Cálculo de preço médio e patrimônio.'
    ]
  }
];

export const ASSET_TYPES: AssetType[] = [
  'Ação',
  'FII',
  'BDR',
  'CDB',
  'Tesouro Direto',
  'Crypto',
];

export const ASSET_COLORS: Record<AssetType, string> = {
  'Ação': '#3b82f6', // blue-500
  'FII': '#ef4444',  // red-500
  'BDR': '#f59e0b',  // amber-500
  'CDB': '#10b981',  // emerald-500
  'Tesouro Direto': '#8b5cf6', // violet-500
  'Crypto': '#f97316', // orange-500
};
