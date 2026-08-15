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

export interface FarmParticipant {
  id: string;
  farmId?: string;
  name: string;
  document: string; // CPF / CNPJ
  participationPercentage: number; // e.g. 50 (%)
  isDeclarant?: boolean;
}

export type ExploitationType =
  'individual' | 'condominio' | 'parceria' | 'arrendamento' | 'comodato' | 'outros';

export interface Farm {
  id: string;
  organizationId?: string | null;
  name: string;
  cnpjCpf?: string | null;
  caepf?: string | null;
  stateRegistration?: string | null;
  nirf?: string | null;
  sncr?: string | null;
  address?: string | null;
  location: string;
  totalArea: number; // hectares
  carNumber: string;
  active: boolean;
  exploitationType?: ExploitationType;
  declarantPercentage?: number;
  participants?: FarmParticipant[];
  createdAt?: string | Date | null;
}

export interface Category {
  id: string;
  organizationId?: string | null;
  parentId?: string | null;
  name: string;
  type: 'despesa' | 'receita';
  includeInLcdpr: boolean;
  createdAt?: string | Date | null;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  area: number; // hectares
  soilType: string;
  currentCrop: string;
  variety?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: string | null;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
  createdAt?: string | Date | null;
}

export interface CropSeason {
  id: string;
  organizationId?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  plantingDate?: string | null;
  expectedHarvestDate?: string | null;
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

export type RecurrencePattern =
  'none' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';

export type ApprovalStatus = 'pendente' | 'aprovado' | 'rejeitado';

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
  linkedReceivableId?: string | null;
  isBarter?: boolean | null;
  barterStatus?: BarterStatus | null;
  requiresApproval?: boolean;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  recurrencePattern?: RecurrencePattern;
  recurringGroupId?: string | null;
  isRecurring?: boolean;
  includeInLcdpr?: boolean;
  documentType?: string;
  documentNumber?: string;
  createdAt?: string | Date | null;
}

export type CommodityUnit = 'sc' | 'ton' | 'kg' | '@';
export type BarterStatus = 'nenhum' | 'aberto' | 'vinculado' | 'liquidado';
export type HedgeType =
  | 'Nenhum'
  | 'Futuro B3'
  | 'Futuro CME'
  | 'Opcao Venda (Put)'
  | 'Opcao Compra (Call)'
  | 'NDF Cambial'
  | 'CPR Financeira'
  | 'Termo Físico';
export type PriceFixingStatus = 'fixado' | 'a_fixar';
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
  commodityUnit?: CommodityUnit; // 'sc' | 'ton' | 'kg' | '@'
  quantity?: number; // Volume na unidade original negociada
  bagsQuantity: number; // Volume normalizado em sacas de 60kg
  unitPrice: number; // Preço unitário por commodityUnit
  totalAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: 'pendente' | 'pago' | 'vencido' | 'parcial' | string;
  contractType: ContractType;
  linkedPayableId?: string | null;
  barterStatus?: BarterStatus | null;
  barterExchangeRate?: number | null;
  hedgeType?: HedgeType | null;
  priceFixingStatus?: PriceFixingStatus | null;
  referenceIndex?: string | null;
  targetPrice?: number | null;
  basis?: number | null;
  strikePrice?: number | null;
  receivedDate?: string | null;
  bankAccountId?: string | null;
  recurrencePattern?: RecurrencePattern;
  recurringGroupId?: string | null;
  isRecurring?: boolean;
  includeInLcdpr?: boolean;
  documentType?: string;
  documentNumber?: string;
  createdAt?: string | Date | null;
}

// Financial Aging Types
export type AgingBucketKey = 'a_vencer' | '1_30' | '31_60' | '61_90' | '90_plus';

export interface AgingBucketItem<T = Payable | Receivable> {
  key: AgingBucketKey;
  label: string;
  rangeDescription: string;
  count: number;
  totalAmount: number;
  percentage: number;
  items: T[];
}

export interface AgingSummary<T = Payable | Receivable> {
  totalOpenAmount: number;
  totalCount: number;
  buckets: Record<AgingBucketKey, AgingBucketItem<T>>;
}

// Due Date Alert Types
export type DueDateAlertCategory = 'vencido' | 'hoje' | 'ate_3_dias' | 'ate_7_dias';

export interface DueDateAlertItem {
  id: string;
  type: 'payable' | 'receivable';
  description: string;
  partyName: string;
  amount: number;
  dueDate: string;
  category: DueDateAlertCategory;
  daysDiff: number;
  status: string;
}

export interface DueDateAlertSummary {
  totalAlerts: number;
  overdueCount: number;
  overdueAmount: number;
  dueTodayCount: number;
  dueTodayAmount: number;
  dueIn3DaysCount: number;
  dueIn3DaysAmount: number;
  dueIn7DaysCount: number;
  dueIn7DaysAmount: number;
  totalAmountInAlert: number;
  alerts: DueDateAlertItem[];
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
  batchNumber?: string | null;
  location?: string | null;
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
  batchNumber?: string | null;
  location?: string | null;
  totalCost: number;
  createdAt?: string | Date | null;
}

// ----------------------------------------------------
// Stock Alerts, Thresholds, & Lot Traceability Types
// ----------------------------------------------------

export type StockAlertCategory = 'zerado' | 'critico' | 'minimo' | 'atencao' | 'normal';
export type ExpiryAlertCategory =
  'vencido' | 'vencendo_30d' | 'vencendo_60d' | 'vencendo_90d' | 'valido';

export interface StockAlertItem {
  id: string;
  stockItemId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  stockAlertCategory: StockAlertCategory;
  expiryDate?: string | null;
  expiryAlertCategory?: ExpiryAlertCategory | null;
  daysToExpiry?: number | null;
  batchNumber?: string | null;
  location?: string | null;
  averageCost: number;
  suggestedReorderQty: number;
  suggestedReorderCost: number;
}

export interface StockAlertSummary {
  totalItems: number;
  outOfStockCount: number; // zerado
  criticalStockCount: number; // critico
  lowStockCount: number; // minimo
  reorderAttentionCount: number; // atencao
  expiredLotsCount: number; // vencido
  expiring30dLotsCount: number; // vencendo_30d
  totalAlertsCount: number;
  totalReplenishmentCost: number;
  alerts: StockAlertItem[];
}

export interface KardexReportItem {
  id: string;
  date: string;
  stockItemId: string;
  itemName: string;
  category?: string;
  type: 'entrada' | 'saida';
  documentNumber: string;
  batchNumber: string;
  location?: string;
  fieldOrSupplier: string;
  fieldId?: string | null;
  machinery?: string | null;
  operator?: string | null;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  runningBalanceQty: number;
  runningBalanceValue: number;
}

export interface LotTraceabilityReport {
  batchNumber: string;
  stockItemId: string;
  itemName: string;
  category: string;
  unit: string;
  location: string;
  expiryDate?: string | null;
  expiryStatus: ExpiryAlertCategory;
  daysToExpiry?: number | null;
  totalEnteredQty: number;
  totalExitedQty: number;
  remainingQty: number;
  averageCost: number;
  totalImmobilizedValue: number;
  entries: StockMovement[];
  applications: StockMovement[];
}

export interface Machinery {
  id: string;
  organizationId?: string | null;
  farmId: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  plate: string;
  chassis?: string | null;
  year?: number | null;
  fuelConsumption?: number | null; // L/h
  hourCost: number; // R$/hora
  status: 'Operacional' | 'Manutenção' | 'Inativo' | string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface Employee {
  id: string;
  organizationId?: string | null;
  farmId: string;
  name: string;
  document?: string | null; // CPF
  phone?: string | null;
  role: string; // Tratorista, Operador de Máquinas, Agrônomo, Gerente de Campo, etc.
  type: 'CLT' | 'PJ' | 'Diarista' | 'Temporário' | string;
  remuneration: number; // Salário base R$/mês
  additionalCosts: number; // Encargos sociais, FGTS, INSS, benefícios R$/mês
  hourCost: number; // R$/hora
  admissionDate?: string | null; // YYYY-MM-DD
  status: 'Ativo' | 'Férias' | 'Afastado' | 'Desligado' | string;
  notes?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
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
  matchedTransactionIds?: string[] | null; // N:M support - multiple payables/receivables matched to one statement line
  confidenceScore?: number | null; // 0 a 100
  createdAt?: string | Date | null;
}

export interface AgroKPIs {
  totalBankBalance: number;
  totalPendingPayables: number;
  totalOverduePayables: number;
  totalDueTodayPayables: number;
  totalDueIn3DaysPayables: number;
  totalDueIn7DaysPayables: number;
  totalPendingReceivables: number;
  totalReceivedThisMonth: number;
  totalPaidThisMonth: number;
  estimatedCropRevenue: number;
  estimatedCropCost: number;
  estimatedCropMargin: number;
  averageCostPerHectare: number;
  lowStockCount: number;
  overduePayablesCount: number;
  dueTodayPayablesCount: number;
  dueIn3DaysPayablesCount: number;
  dueIn7DaysPayablesCount: number;
  pendingApprovalPayablesCount: number;
}

// ----------------------------------------------------
// Fixed Cost Apportionment (Rateio) Types
// ----------------------------------------------------

export type CostApportionmentMethod =
  'planted_area' | 'equal_split' | 'direct_cost' | 'production_volume' | 'custom_percentage';

export interface OverheadExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  source: 'payable' | 'custom' | 'manual';
  supplierName?: string;
  dueDate?: string;
  included?: boolean;
}

export interface FieldApportionmentAllocation {
  fieldId: string;
  fieldName: string;
  area: number;
  crop: string;
  directCost: number;
  allocationBasisValue: number;
  allocationPercentage: number;
  allocatedOverhead: number;
  directCostPerHa: number;
  allocatedOverheadPerHa: number;
  finalTotalCost: number;
  finalTotalCostPerHa: number;
}

export interface ApportionmentCalculationResult {
  farmId: string;
  seasonId: string;
  method: CostApportionmentMethod;
  totalOverheadAmount: number;
  overheadItems: OverheadExpenseItem[];
  allocations: FieldApportionmentAllocation[];
  summary: {
    totalArea: number;
    totalDirectCost: number;
    totalFinalCost: number;
    avgDirectCostPerHa: number;
    avgOverheadCostPerHa: number;
    avgFinalCostPerHa: number;
  };
}

// ----------------------------------------------------
// Cross-Season Comparison Types
// ----------------------------------------------------

export interface SeasonHistoricalMetrics {
  seasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  crop: string;
  plantedArea: number; // hectares
  totalProductionBags: number; // sacas de 60kg
  productivityScHa: number; // sc/ha
  averagePricePerBag: number; // R$/sc
  grossRevenue: number;
  grossRevenuePerHa: number;
  directCosts: {
    fertilizantes: number;
    defensivos: number;
    sementes: number;
    combustivel: number;
    maoDeObra: number;
    manutencao: number;
    total: number;
  };
  overheadCosts: {
    arrendamento: number;
    seguroAgricola: number;
    despesasAdm: number;
    total: number;
  };
  totalCost: number;
  costPerHa: number;
  costPerBag: number;
  grossMargin: number;
  grossMarginPct: number;
  ebitda: number;
  ebitdaPct: number;
  netProfit: number;
  netProfitPct: number;
  breakevenYieldScHa: number; // sacas/ha necessárias para cobrir custo
  breakevenPriceSc: number; // R$/saca necessária para cobrir custo
}

export interface SeasonVariationComparison {
  seasonA: string;
  seasonB: string;
  revenueVarPct: number;
  costVarPct: number;
  costPerHaVarPct: number;
  productivityVarPct: number;
  netProfitVarPct: number;
  marginVarPct: number;
}

export interface CrossSeasonComparisonResult {
  seasons: SeasonHistoricalMetrics[];
  variations: SeasonVariationComparison[];
  categoryCostEvolution: {
    category: string;
    valuesBySeason: Record<string, number>;
  }[];
}

// ----------------------------------------------------
// LCDPR (Livro Caixa Digital do Produtor Rural) Types
// ----------------------------------------------------

export interface LCDPREntry {
  id: string;
  date: string;
  data: string;
  imovel: string;
  imovelCode?: string;
  conta: string;
  bankAccountId?: string | null;
  docNumber: string;
  numDoc: string;
  docType: string;
  tipoDoc: string;
  history: string;
  historico: string;
  participante: string;
  participantDoc: string;
  cpfCnpj: string;
  entryType: string;
  tipoLancamento: string;
  amount: number; // Valor Total / Bruto
  valor: number;
  rateioAmount: number; // Valor Rateado proporcional ao % do declarante
  valorRateio: number;
  sharePercentage: number; // % de participação declarada
  balanceType: 'E' | 'S';
  tipo: 'E' | 'S';
  includeInLcdpr: boolean;
  isDeductible: boolean;
  category?: string;
  sourceType: 'payable' | 'receivable';
}

export type LCDPRIssueSeverity = 'error' | 'warning';
export type LCDPRIssueCategory = 'producer' | 'farm' | 'bank' | 'participant' | 'entry' | 'rateio';

export interface LCDPRIssue {
  id: string;
  category: LCDPRIssueCategory;
  severity: LCDPRIssueSeverity;
  field: string;
  message: string;
  itemRef?: string;
  fixRoute?: string;
}

export interface LCDPRValidationResult {
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  issues: LCDPRIssue[];
  producerReady: boolean;
  farmReady: boolean;
  bankAccountsReady: boolean;
  participantsReady: boolean;
  entriesReady: boolean;
  summaryText: string;
}

export interface ProducerFiscalProfile {
  name: string;
  cpfCnpj: string;
  caepf?: string;
  stateRegistration?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  accountantName?: string;
  accountantCpf?: string;
  accountantCrc?: string;
}
