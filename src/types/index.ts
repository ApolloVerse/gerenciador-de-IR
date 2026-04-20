export type AssetType = 
  | 'ACAO' 
  | 'FII' 
  | 'ETF' 
  | 'RENDA_FIXA' 
  | 'CRIPTO' 
  | 'OPCAO' 
  | 'FUTUROS' 
  | 'OURO' 
  | 'BDR';

export type TransactionType = 'COMPRA' | 'VENDA' | 'RENDIMENTO' | 'AMORTIZACAO' | 'BONIFICACAO';

export interface Transaction {
  id: string;
  assetId: string;
  type: TransactionType;
  date: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  costs: number;
  irrf: number;
  notes?: string;
  isDayTrade: boolean;
}

export interface Asset {
  id: string;
  userId: string;
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  institution: string;
  lastUpdate: string;
  cnpj?: string; // Tax ID of the issuer
  irpfGroup?: string; // IRPF Group (e.g., 03 - Participações Societárias)
  irpfCode?: string; // IRPF Code (e.g., 31 - Ações)
  irpfDescription?: string; // Full text for the "Discriminação" field
}


export interface Dividend {
  id: string;
  assetId: string;
  userId: string;
  amount: number;
  date: string;
  type: 'DIVIDENDO' | 'JCP' | 'RENDIMENTO' | 'ALUGUEL';
  isTaxable: boolean;
}

export interface DARF {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  assetType: 'DAY_TRADE' | 'SWING_TRADE' | 'RENDA_FIXA' | 'OUTROS';
  code: string;
  dueDate: string;
}

export interface PDFUpload {
  id: string;
  userId: string;
  filename: string;
  status: 'PROCESSING' | 'COMPLETED' | 'ERROR';
  extractedData?: any;
  createdAt: string;
  institution?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  cpf?: string;
  address?: string;
}
