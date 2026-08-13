export type UserRoleType = 'Produtor' | 'Gestor' | 'Financeiro' | 'Contador' | 'Operador';

export interface User {
  id: string;
  organizationId?: string | null;
  name: string;
  email: string;
  role: UserRoleType;
  image?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  cnpjCpf?: string | null;
  createdAt?: string | Date | null;
}

export interface Farm {
  id: string;
  organizationId?: string | null;
  name: string;
  location: string;
  totalArea: number; // hectares
  carNumber: string;
  active: boolean;
  createdAt?: string | Date | null;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  area: number; // hectares
  soilType: string;
  currentCrop: string;
  createdAt?: string | Date | null;
}

export interface CropSeason {
  id: string;
  organizationId?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt?: string | Date | null;
}

export interface Supplier {
  id: string;
  organizationId?: string | null;
  name: string;
  category: string;
  document: string; // CNPJ / CPF
  contact: string;
  createdAt?: string | Date | null;
}

export interface Customer {
  id: string;
  organizationId?: string | null;
  name: string;
  segment: string;
  document: string; // CNPJ / CPF
  contact: string;
  createdAt?: string | Date | null;
}

export interface BankAccount {
  id: string;
  organizationId?: string | null;
  bankName: string;
  agency: string;
  accountNumber: string;
  balance: number;
  type: 'Corrente' | 'Poupança' | 'Crédito Rural' | string;
  pixKey?: string | null;
  createdAt?: string | Date | null;
}

export interface Payable {
  id: string;
  organizationId?: string | null;
  farmId: string;
  cropSeasonId: string;
  fieldId?: string | null;
  supplierId: string;
  supplierName: string;
  category: string;
  description: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'vencido' | 'parcial' | string;
  installments?: string | null;
  hasAttachment?: boolean | null;
  attachmentUrl?: string | null;
  paymentDate?: string | null;
  paidAmount?: number | null;
  bankAccountId?: string | null;
  createdAt?: string | Date | null;
}

export type ContractType = 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge';

export interface Receivable {
  id: string;
  organizationId?: string | null;
  farmId: string;
  cropSeasonId: string;
  customerId: string;
  customerName: string;
  crop: string;
  description: string;
  bagsQuantity: number; // sacas de 60kg
  unitPrice: number; // R$/saca
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'vencido' | 'parcial' | string;
  contractType: ContractType;
  receivedDate?: string | null;
  bankAccountId?: string | null;
  createdAt?: string | Date | null;
}

export interface StockItem {
  id: string;
  organizationId?: string | null;
  farmId: string;
  name: string;
  category: 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis' | string;
  unit: 'kg' | 'L' | 'sc' | 'ton' | string;
  quantity: number;
  minQuantity: number;
  averageCost: number; // R$ por unidade
  unitPrice?: number;
  lastSupplier: string | null;
  expiryDate?: string | null;
  documentNumber?: string | null;
  createdAt?: string | Date | null;
}

export interface StockMovement {
  id: string;
  organizationId?: string | null;
  farmId: string;
  stockItemId: string;
  itemName: string;
  type: 'entrada' | 'saida' | string;
  quantity: number;
  unit: string;
  date: string;
  fieldId?: string | null;
  fieldName?: string | null;
  machinery?: string | null;
  operator?: string | null;
  documentNumber?: string | null;
  totalCost: number;
  createdAt?: string | Date | null;
}

export interface Machinery {
  id: string;
  organizationId?: string | null;
  farmId: string;
  name: string;
  type: string;
  plate: string;
  hourCost: number; // R$/hora
  status: 'Operacional' | 'Manutenção' | 'Inativo' | string;
  createdAt?: string | Date | null;
}

export interface BankStatementItem {
  id: string;
  organizationId?: string | null;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number; // positivo para crédito, negativo para débito
  matched: boolean;
  matchedTransactionId?: string | null;
  confidenceScore?: number | null; // 0 a 100
  createdAt?: string | Date | null;
}

export interface AgroKPIs {
  totalBankBalance: number;
  totalPendingPayables: number;
  totalOverduePayables: number;
  totalDueTodayPayables: number;
  totalPendingReceivables: number;
  totalReceivedThisMonth: number;
  totalPaidThisMonth: number;
  estimatedCropRevenue: number;
  estimatedCropCost: number;
  estimatedCropMargin: number;
  averageCostPerHectare: number;
  lowStockCount: number;
  overduePayablesCount: number;
}
