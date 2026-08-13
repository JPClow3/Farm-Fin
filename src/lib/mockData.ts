export interface Farm {
  id: string;
  name: string;
  location: string;
  totalArea: number; // hectares
  carNumber: string;
  active: boolean;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  area: number; // hectares
  soilType: string;
  currentCrop: string;
}

export interface CropSeason {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  document: string; // CNPJ
  contact: string;
}

export interface Customer {
  id: string;
  name: string;
  segment: string;
  document: string;
  contact: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  balance: number;
  type: 'Corrente' | 'Poupança' | 'Crédito Rural';
}

export interface Payable {
  id: string;
  farmId: string;
  cropSeasonId: string;
  fieldId?: string;
  supplierId: string;
  supplierName: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido' | 'parcial';
  installments?: string; // ex: "1/3"
  hasAttachment?: boolean;
  paymentDate?: string;
  paidAmount?: number;
  bankAccountId?: string;
}

export interface Receivable {
  id: string;
  farmId: string;
  cropSeasonId: string;
  customerId: string;
  customerName: string;
  crop: string;
  description: string;
  bagsQuantity: number; // sacas de 60kg
  unitPrice: number; // R$/saca
  totalAmount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido' | 'parcial';
  contractType: 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge';
  receivedDate?: string;
  bankAccountId?: string;
}

export interface StockItem {
  id: string;
  farmId: string;
  name: string;
  category: 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis';
  unit: 'kg' | 'L' | 'sc' | 'ton';
  quantity: number;
  minQuantity: number;
  averageCost: number; // R$ por unidade
  lastSupplier: string;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  farmId: string;
  stockItemId: string;
  itemName: string;
  type: 'entrada' | 'saida';
  quantity: number;
  unit: string;
  date: string;
  fieldId?: string;
  fieldName?: string;
  machinery?: string;
  operator?: string;
  documentNumber?: string;
  totalCost: number;
}

export interface Machinery {
  id: string;
  farmId: string;
  name: string;
  type: string;
  plate: string;
  hourCost: number; // R$/hora
  status: 'Operacional' | 'Manutenção' | 'Inativo';
}

export interface BankStatementItem {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number; // positivo para crédito, negativo para débito
  matched: boolean;
  matchedTransactionId?: string;
  confidenceScore?: number; // 0 a 100
}

// Initial Data Fixtures
export const INITIAL_FARMS: Farm[] = [
  {
    id: 'farm-1',
    name: 'Fazenda Santa Fé',
    location: 'Sorriso - MT (BR-163 km 742)',
    totalArea: 2400,
    carNumber: 'MT-5107909-66F5.7E4D.B102.431A',
    active: true,
  },
  {
    id: 'farm-2',
    name: 'Fazenda Rio Verde',
    location: 'Rio Verde - GO (GO-174)',
    totalArea: 1150,
    carNumber: 'GO-5218805-44C1.9A8B.E312.872C',
    active: true,
  },
];

export const INITIAL_FIELDS: Field[] = [
  { id: 'field-1', farmId: 'farm-1', name: 'Talhão 01 - Sede', area: 450, soilType: 'Latossolo Vermelho Argiloso', currentCrop: 'Soja' },
  { id: 'field-2', farmId: 'farm-1', name: 'Talhão 02 - Pivô Central', area: 320, soilType: 'Latossolo Vermelho Escuro', currentCrop: 'Soja' },
  { id: 'field-3', farmId: 'farm-1', name: 'Talhão 03 - Chapadão Norte', area: 680, soilType: 'Latossolo Vermelho-Amarelo', currentCrop: 'Milho' },
  { id: 'field-4', farmId: 'farm-1', name: 'Talhão 04 - Estrada Velha', area: 550, soilType: 'Argissolo Vermelho', currentCrop: 'Soja' },
  { id: 'field-5', farmId: 'farm-1', name: 'Talhão 05 - Reserva Baixa', area: 400, soilType: 'Latossolo Amarelo', currentCrop: 'Pousio' },
  { id: 'field-6', farmId: 'farm-2', name: 'Talhão A1 - Vereda', area: 500, soilType: 'Latossolo Roxo', currentCrop: 'Soja' },
  { id: 'field-7', farmId: 'farm-2', name: 'Talhão A2 - Morro Vermelho', area: 650, soilType: 'Latossolo Vermelho', currentCrop: 'Milho' },
];

export const INITIAL_SEASONS: CropSeason[] = [
  { id: 'season-25-26', name: 'Safra 2025/2026 (Soja/Milho)', startDate: '2025-09-01', endDate: '2026-08-31', isCurrent: true },
  { id: 'safrinha-26', name: 'Safrinha 2026 (Milho Segunda Época)', startDate: '2026-02-01', endDate: '2026-07-31', isCurrent: false },
  { id: 'season-24-25', name: 'Safra 2024/2025 (Histórico)', startDate: '2024-09-01', endDate: '2025-08-31', isCurrent: false },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Yara Brasil Fertilizantes S.A.', category: 'Fertilizantes', document: '00.000.000/0001-91', contact: '(66) 3544-1200' },
  { id: 'sup-2', name: 'Bayer CropScience do Brasil', category: 'Defensivos', document: '18.459.628/0001-15', contact: '(66) 3545-8800' },
  { id: 'sup-3', name: 'Syngenta Proteção de Cultivos', category: 'Sementes e Químicos', document: '60.744.463/0001-90', contact: '(66) 3544-9000' },
  { id: 'sup-4', name: 'Petrobras Distribuidora (Diesel S10)', category: 'Combustíveis', document: '34.274.233/0001-02', contact: '(66) 3544-4422' },
  { id: 'sup-5', name: 'John Deere Maqcampo Tratores', category: 'Maquinário e Peças', document: '01.234.567/0001-88', contact: '(66) 3544-7711' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Bunge Alimentos S.A.', segment: 'Trading Internacional', document: '84.046.101/0001-93', contact: '(66) 3545-2000' },
  { id: 'cust-2', name: 'Cargill Agrícola S.A.', segment: 'Processamento & Exportação', document: '44.934.675/0001-98', contact: '(66) 3544-5500' },
  { id: 'cust-3', name: 'Amaggi Exportação e Importação', segment: 'Trading de Grãos', document: '03.007.331/0001-41', contact: '(65) 2123-1000' },
  { id: 'cust-4', name: 'COAMO Agroindustrial Cooperativa', segment: 'Cooperativa', document: '75.904.383/0001-21', contact: '(44) 3518-1200' },
];

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  { id: 'bank-1', bankName: 'Banco do Brasil Agro', agency: '1240-5', accountNumber: '48.912-3', balance: 1420500.0, type: 'Corrente' },
  { id: 'bank-2', bankName: 'Sicredi União MT/PA', agency: '0810', accountNumber: '105.820-1', balance: 845200.0, type: 'Corrente' },
  { id: 'bank-3', bankName: 'Sicoob Cerrado Agro', agency: '3150', accountNumber: '29.400-8', balance: 350000.0, type: 'Crédito Rural' },
];

export const INITIAL_PAYABLES: Payable[] = [
  {
    id: 'pay-1',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    fieldId: 'field-1',
    supplierId: 'sup-1',
    supplierName: 'Yara Brasil Fertilizantes',
    category: 'Insumos > Fertilizantes',
    description: 'Adubo NPK 04-14-08 (120 Ton) - Talhão 01',
    amount: 384000.0,
    dueDate: '2026-08-20',
    status: 'pendente',
    installments: '2/3',
    hasAttachment: true,
  },
  {
    id: 'pay-2',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    fieldId: 'field-2',
    supplierId: 'sup-2',
    supplierName: 'Bayer CropScience',
    category: 'Insumos > Defensivos',
    description: 'Fungicida Fox Xpro + Herbicida Roundup',
    amount: 142800.0,
    dueDate: '2026-08-14',
    status: 'pendente',
    installments: '1/2',
    hasAttachment: true,
  },
  {
    id: 'pay-3',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    supplierId: 'sup-4',
    supplierName: 'Petrobras Distribuidora',
    category: 'Combustíveis e Lubrificantes',
    description: 'Diesel S10 para Tratores e Colheitadeiras (15.000 L)',
    amount: 93750.0,
    dueDate: '2026-08-10',
    status: 'vencido',
    installments: '1/1',
    hasAttachment: true,
  },
  {
    id: 'pay-4',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    supplierId: 'sup-5',
    supplierName: 'John Deere Maqcampo',
    category: 'Manutenção de Maquinário',
    description: 'Revisão 1000h Colheitadeira S770',
    amount: 28400.0,
    dueDate: '2026-08-05',
    status: 'pago',
    paymentDate: '2026-08-04',
    paidAmount: 28400.0,
    bankAccountId: 'bank-1',
    hasAttachment: true,
  },
  {
    id: 'pay-5',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    fieldId: 'field-3',
    supplierId: 'sup-3',
    supplierName: 'Syngenta Proteção de Cultivos',
    category: 'Insumos > Sementes',
    description: 'Semente Milho VIPTERA 3 - Chapadão',
    amount: 215000.0,
    dueDate: '2026-08-28',
    status: 'pendente',
    installments: '1/3',
    hasAttachment: true,
  },
  {
    id: 'pay-6',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    supplierId: 'sup-5',
    supplierName: 'John Deere Maqcampo',
    category: 'Financiamento Maquinário',
    description: 'Parcela Finame Trator 8R 370',
    amount: 85200.0,
    dueDate: '2026-09-15',
    status: 'pendente',
    installments: '18/60',
    hasAttachment: false,
  },
];

export const INITIAL_RECEIVABLES: Receivable[] = [
  {
    id: 'rec-1',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    customerId: 'cust-1',
    customerName: 'Bunge Alimentos',
    crop: 'Soja',
    description: 'Contrato a Termo Soja Grão - Lote 1 (30.000 sacas)',
    bagsQuantity: 30000,
    unitPrice: 138.5,
    totalAmount: 4155000.0,
    dueDate: '2026-08-25',
    status: 'pendente',
    contractType: 'Contrato Futuro',
  },
  {
    id: 'rec-2',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    customerId: 'cust-2',
    customerName: 'Cargill Agrícola',
    crop: 'Milho',
    description: 'Venda Antecipada Milho Safrinha (15.000 sacas)',
    bagsQuantity: 15000,
    unitPrice: 58.0,
    totalAmount: 870000.0,
    dueDate: '2026-09-10',
    status: 'pendente',
    contractType: 'Venda Spot',
  },
  {
    id: 'rec-3',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    customerId: 'cust-3',
    customerName: 'Amaggi Exportação',
    crop: 'Soja',
    description: 'Liquidação Barter Fertilizante Yara (10.000 sacas)',
    bagsQuantity: 10000,
    unitPrice: 135.0,
    totalAmount: 1350000.0,
    dueDate: '2026-08-01',
    status: 'pago',
    receivedDate: '2026-08-01',
    bankAccountId: 'bank-1',
    contractType: 'Barter Insumos',
  },
  {
    id: 'rec-4',
    farmId: 'farm-1',
    cropSeasonId: 'season-25-26',
    customerId: 'cust-4',
    customerName: 'COAMO Agroindustrial',
    crop: 'Soja',
    description: 'Complemento de Fixação Mercado Físico (5.000 sacas)',
    bagsQuantity: 5000,
    unitPrice: 140.0,
    totalAmount: 700000.0,
    dueDate: '2026-08-30',
    status: 'pendente',
    contractType: 'Hedge',
  },
];

export const INITIAL_STOCK: StockItem[] = [
  { id: 'stk-1', farmId: 'farm-1', name: 'NPK 04-14-08 Granulado', category: 'Fertilizantes', unit: 'ton', quantity: 64, minQuantity: 20, averageCost: 3200.0, lastSupplier: 'Yara Brasil', expiryDate: '2027-05-01' },
  { id: 'stk-2', farmId: 'farm-1', name: 'Glifosato Roundup Transorb 480 SL', category: 'Defensivos', unit: 'L', quantity: 1800, minQuantity: 500, averageCost: 48.5, lastSupplier: 'Bayer CropScience', expiryDate: '2027-10-15' },
  { id: 'stk-3', farmId: 'farm-1', name: 'Fungicida Fox Xpro', category: 'Defensivos', unit: 'L', quantity: 450, minQuantity: 200, averageCost: 260.0, lastSupplier: 'Bayer CropScience', expiryDate: '2027-08-20' },
  { id: 'stk-4', farmId: 'farm-1', name: 'Semente Soja TMG 2381 IPRO', category: 'Sementes', unit: 'sc', quantity: 380, minQuantity: 100, averageCost: 295.0, lastSupplier: 'Syngenta', expiryDate: '2026-11-30' },
  { id: 'stk-5', farmId: 'farm-1', name: 'Óleo Diesel S10 Rodoviário/Agrícola', category: 'Combustíveis', unit: 'L', quantity: 4200, minQuantity: 5000, averageCost: 6.25, lastSupplier: 'Petrobras', expiryDate: '2026-12-31' },
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: 'mov-1', farmId: 'farm-1', stockItemId: 'stk-1', itemName: 'NPK 04-14-08 Granulado', type: 'entrada', quantity: 120, unit: 'ton', date: '2026-07-28', documentNumber: 'NF-e 84920', totalCost: 384000.0 },
  { id: 'mov-2', farmId: 'farm-1', stockItemId: 'stk-1', itemName: 'NPK 04-14-08 Granulado', type: 'saida', quantity: 56, unit: 'ton', date: '2026-08-02', fieldId: 'field-1', fieldName: 'Talhão 01 - Sede', machinery: 'Trator JD 8R + Distribuidor Stara', operator: 'Marcos Silva', totalCost: 179200.0 },
  { id: 'mov-3', farmId: 'farm-1', stockItemId: 'stk-2', itemName: 'Glifosato Roundup', type: 'saida', quantity: 600, unit: 'L', date: '2026-08-06', fieldId: 'field-2', fieldName: 'Talhão 02 - Pivô Central', machinery: 'Pulverizador John Deere 4730', operator: 'José Alves', totalCost: 29100.0 },
  { id: 'mov-4', farmId: 'farm-1', stockItemId: 'stk-5', itemName: 'Óleo Diesel S10', type: 'entrada', quantity: 15000, unit: 'L', date: '2026-08-01', documentNumber: 'NF-e 31902', totalCost: 93750.0 },
];

export const INITIAL_MACHINERY: Machinery[] = [
  { id: 'mac-1', farmId: 'farm-1', name: 'Trator John Deere 8R 370', type: 'Trator Pesado', plate: 'MT-SRR-8370', hourCost: 340.0, status: 'Operacional' },
  { id: 'mac-2', farmId: 'farm-1', name: 'Colheitadeira John Deere S770', type: 'Colheitadeira de Grãos', plate: 'MT-SRR-7700', hourCost: 680.0, status: 'Operacional' },
  { id: 'mac-3', farmId: 'farm-1', name: 'Pulverizador Autopropelido JD 4730', type: 'Pulverizador', plate: 'MT-SRR-4730', hourCost: 290.0, status: 'Operacional' },
  { id: 'mac-4', farmId: 'farm-1', name: 'Plantadeira Stara Absoluta 44 Linhas', type: 'Plantadeira', plate: 'IMP-4401', hourCost: 180.0, status: 'Operacional' },
];

export const INITIAL_STATEMENTS: BankStatementItem[] = [
  { id: 'stmt-1', bankAccountId: 'bank-1', date: '2026-08-01', description: 'TED RECEB AMAGGI EXPORTACAO SA', amount: 1350000.0, matched: true, matchedTransactionId: 'rec-3', confidenceScore: 100 },
  { id: 'stmt-2', bankAccountId: 'bank-1', date: '2026-08-04', description: 'PAGTO TITULO JOHN DEERE MAQCAMP', amount: -28400.0, matched: true, matchedTransactionId: 'pay-4', confidenceScore: 100 },
  { id: 'stmt-3', bankAccountId: 'bank-1', date: '2026-08-10', description: 'DEB AUT ENERGISA MATO GROSSO', amount: -14520.0, matched: false, confidenceScore: 0 },
  { id: 'stmt-4', bankAccountId: 'bank-1', date: '2026-08-12', description: 'PIX TRANSF FORNECEDOR COMBUSTIV', amount: -93750.0, matched: false, matchedTransactionId: 'pay-3', confidenceScore: 95 },
  { id: 'stmt-5', bankAccountId: 'bank-2', date: '2026-08-08', description: 'RESG APLIC RURAL SICREDI', amount: 200000.0, matched: false, confidenceScore: 0 },
];
