import {
  Farm,
  Field,
  CropSeason,
  Supplier,
  Customer,
  BankAccount,
  Payable,
  Receivable,
  StockItem,
  StockMovement,
  Machinery,
  Employee,
  BankStatementItem,
} from './types';

import {
  farms,
  fields,
  cropSeasons,
  suppliers,
  customers,
  bankAccounts,
  payables,
  receivables,
  stockItems,
  stockMovements,
  machinery,
  employees,
  bankStatements,
} from '../db/schema';

export type DbFarm = typeof farms.$inferSelect;
export type DbField = typeof fields.$inferSelect;
export type DbCropSeason = typeof cropSeasons.$inferSelect;
export type DbSupplier = typeof suppliers.$inferSelect;
export type DbCustomer = typeof customers.$inferSelect;
export type DbBankAccount = typeof bankAccounts.$inferSelect;
export type DbPayable = typeof payables.$inferSelect & {
  supplier?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
};
export type DbReceivable = typeof receivables.$inferSelect & {
  customer?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
};
export type DbStockItem = typeof stockItems.$inferSelect;
export type DbStockMovement = typeof stockMovements.$inferSelect;
export type DbMachinery = typeof machinery.$inferSelect;
export type DbEmployee = typeof employees.$inferSelect;
export type DbBankStatement = typeof bankStatements.$inferSelect;

export function mapDbFarmToFarm(row: DbFarm): Farm {
  let participants: Farm['participants'] = undefined;
  if (row.participantsJson) {
    try {
      participants = JSON.parse(row.participantsJson);
    } catch {
      participants = undefined;
    }
  }
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    cnpjCpf: row.cnpjCpf || undefined,
    caepf: row.caepf || undefined,
    stateRegistration: row.stateRegistration || undefined,
    nirf: row.nirf || undefined,
    sncr: row.sncr || undefined,
    address: row.address || undefined,
    location: row.location || 'Mato Grosso - MT',
    totalArea: Number(row.totalArea) || 0,
    carNumber: row.carNumber || 'N/A',
    active: row.active ?? true,
    exploitationType: (row.exploitationType as Farm['exploitationType']) || 'individual',
    declarantPercentage:
      row.declarantPercentage !== null && row.declarantPercentage !== undefined
        ? Number(row.declarantPercentage)
        : 100,
    participants,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbFieldToField(row: DbField): Field {
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    area: Number(row.area) || 0,
    soilType: row.soilType || 'Latossolo Vermelho',
    currentCrop: row.currentCrop || 'Soja',
    variety: row.variety || undefined,
    latitude:
      row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
    longitude:
      row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
    coordinates: row.coordinates || undefined,
    plantingDate: row.plantingDate || undefined,
    expectedHarvestDate: row.expectedHarvestDate || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbSeasonToSeason(row: DbCropSeason): CropSeason {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    plantingDate: row.plantingDate || undefined,
    expectedHarvestDate: row.expectedHarvestDate || undefined,
    isCurrent: row.isCurrent ?? true,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbSupplierToSupplier(row: DbSupplier): Supplier {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    category: row.category || 'Insumos Agrícolas',
    document: row.document || 'N/A',
    contact: row.contact || 'N/A',
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbCustomerToCustomer(row: DbCustomer): Customer {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    segment: row.segment || 'Trading / Exportação',
    document: row.document || 'N/A',
    contact: row.contact || 'N/A',
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbBankAccountToBankAccount(row: DbBankAccount): BankAccount {
  return {
    id: row.id,
    organizationId: row.organizationId,
    bankName: row.bankName,
    agency: row.agency || '0001',
    accountNumber: row.accountNumber || '12345-6',
    balance: Number(row.balance) || 0,
    type: (row.type as 'Corrente' | 'Poupança' | 'Crédito Rural') || 'Corrente',
    pixKey: row.pixKey || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbPayableToPayable(row: DbPayable): Payable {
  const isRec = Boolean(
    row.recurringGroupId || (row.recurrencePattern && row.recurrencePattern !== 'none')
  );
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    cropSeasonId: row.cropSeasonId,
    fieldId: row.fieldId || undefined,
    supplierId: row.supplierId,
    supplierName: row.supplierName || row.supplier?.name || 'Fornecedor',
    category: row.category || row.category?.name || 'Insumos > Fertilizantes',
    description: row.description,
    amount: Number(row.amount) || 0,
    dueDate: row.dueDate,
    status: (row.status as 'pendente' | 'pago' | 'vencido' | 'parcial') || 'pendente',
    installments: row.installments || '1/1',
    hasAttachment: row.hasAttachment ?? false,
    attachmentUrl: row.attachmentUrl || undefined,
    paymentDate: row.paymentDate || undefined,
    paidAmount: row.paidAmount ? Number(row.paidAmount) : undefined,
    bankAccountId: row.bankAccountId || undefined,
    linkedReceivableId: row.linkedReceivableId || undefined,
    isBarter: row.isBarter ?? false,
    barterStatus: (row.barterStatus as 'nenhum' | 'aberto' | 'vinculado' | 'liquidado') || 'nenhum',
    requiresApproval: row.requiresApproval ?? false,
    approvalStatus:
      (row.approvalStatus as 'pendente' | 'aprovado' | 'rejeitado') ||
      (row.requiresApproval ? 'pendente' : 'aprovado'),
    approvedBy: row.approvedBy || undefined,
    approvedAt: row.approvedAt || undefined,
    rejectionReason: row.rejectionReason || undefined,
    recurrencePattern:
      (row.recurrencePattern as
        'none' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly') || 'none',
    recurringGroupId: row.recurringGroupId || undefined,
    isRecurring: isRec,
    includeInLcdpr: row.includeInLcdpr ?? true,
    documentType: row.documentType || 'Nota Fiscal',
    documentNumber: row.documentNumber || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbReceivableToReceivable(row: DbReceivable): Receivable {
  const commUnit = (row.commodityUnit as 'sc' | 'ton' | 'kg' | '@') || 'sc';
  const rawQty =
    row.quantity !== null && row.quantity !== undefined
      ? Number(row.quantity)
      : Number(row.bagsQuantity) || 0;
  const bags =
    row.bagsQuantity !== null && row.bagsQuantity !== undefined && Number(row.bagsQuantity) > 0
      ? Number(row.bagsQuantity)
      : commUnit === 'ton'
        ? rawQty * 16.6667
        : commUnit === '@'
          ? rawQty * 0.25
          : rawQty;

  const isRec = Boolean(
    row.recurringGroupId || (row.recurrencePattern && row.recurrencePattern !== 'none')
  );

  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    cropSeasonId: row.cropSeasonId,
    customerId: row.customerId,
    customerName: row.customerName || row.customer?.name || 'Cliente',
    crop: row.crop || 'Soja',
    description: row.description,
    commodityUnit: commUnit,
    quantity: rawQty,
    bagsQuantity: bags,
    unitPrice: Number(row.unitPrice) || 0,
    totalAmount: Number(row.totalAmount) || 0,
    dueDate: row.dueDate,
    status: (row.status as 'pendente' | 'pago' | 'vencido' | 'parcial') || 'pendente',
    contractType:
      (row.contractType as 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge') ||
      'Venda Spot',
    linkedPayableId: row.linkedPayableId || undefined,
    barterStatus: (row.barterStatus as 'nenhum' | 'aberto' | 'vinculado' | 'liquidado') || 'nenhum',
    barterExchangeRate:
      row.barterExchangeRate !== null && row.barterExchangeRate !== undefined
        ? Number(row.barterExchangeRate)
        : undefined,
    hedgeType:
      (row.hedgeType as
        | 'Nenhum'
        | 'Futuro B3'
        | 'Futuro CME'
        | 'Opcao Venda (Put)'
        | 'Opcao Compra (Call)'
        | 'NDF Cambial'
        | 'CPR Financeira'
        | 'Termo Físico') || 'Nenhum',
    priceFixingStatus: (row.priceFixingStatus as 'fixado' | 'a_fixar') || 'fixado',
    referenceIndex: row.referenceIndex || undefined,
    targetPrice:
      row.targetPrice !== null && row.targetPrice !== undefined
        ? Number(row.targetPrice)
        : undefined,
    basis: row.basis !== null && row.basis !== undefined ? Number(row.basis) : undefined,
    strikePrice:
      row.strikePrice !== null && row.strikePrice !== undefined
        ? Number(row.strikePrice)
        : undefined,
    receivedDate: row.receivedDate || undefined,
    bankAccountId: row.bankAccountId || undefined,
    recurrencePattern:
      (row.recurrencePattern as
        'none' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly') || 'none',
    recurringGroupId: row.recurringGroupId || undefined,
    isRecurring: isRec,
    includeInLcdpr: row.includeInLcdpr ?? true,
    documentType: row.documentType || 'Nota Fiscal / Recibo',
    documentNumber: row.documentNumber || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbStockItemToStockItem(row: DbStockItem): StockItem {
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    name: row.name,
    category:
      (row.category as 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis') ||
      'Fertilizantes',
    unit: (row.unit as 'kg' | 'L' | 'sc' | 'ton') || 'kg',
    quantity: Number(row.quantity) || 0,
    minQuantity: Number(row.minQuantity) || 0,
    averageCost: Number(row.averageCost) || 0,
    lastSupplier: row.lastSupplier || 'N/A',
    batchNumber: row.batchNumber || undefined,
    location: row.location || undefined,
    expiryDate: row.expiryDate || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbStockMovementToStockMovement(row: DbStockMovement): StockMovement {
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    stockItemId: row.stockItemId,
    itemName: row.itemName,
    type: (row.type as 'entrada' | 'saida') || 'entrada',
    quantity: Number(row.quantity) || 0,
    unit: row.unit || 'L',
    date: row.date,
    fieldId: row.fieldId || undefined,
    fieldName: row.fieldName || undefined,
    machinery: row.machinery || undefined,
    operator: row.operator || undefined,
    documentNumber: row.documentNumber || undefined,
    batchNumber: row.batchNumber || undefined,
    location: row.location || undefined,
    totalCost: Number(row.totalCost) || 0,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbMachineryToMachinery(row: DbMachinery): Machinery {
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    name: row.name,
    type: row.type,
    brand: row.brand || undefined,
    model: row.model || undefined,
    plate: row.plate || 'AGRO-001',
    chassis: row.chassis || undefined,
    year: row.year !== null && row.year !== undefined ? Number(row.year) : undefined,
    fuelConsumption:
      row.fuelConsumption !== null && row.fuelConsumption !== undefined
        ? Number(row.fuelConsumption)
        : undefined,
    hourCost: Number(row.hourCost) || 0,
    status: (row.status as 'Operacional' | 'Manutenção' | 'Inativo') || 'Operacional',
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
  };
}

export function mapDbEmployeeToEmployee(row: DbEmployee): Employee {
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    name: row.name,
    document: row.document || undefined,
    phone: row.phone || undefined,
    role: row.role,
    type: (row.type as 'CLT' | 'PJ' | 'Diarista' | 'Temporário') || 'CLT',
    remuneration: Number(row.remuneration) || 0,
    additionalCosts: Number(row.additionalCosts) || 0,
    hourCost: Number(row.hourCost) || 0,
    admissionDate: row.admissionDate || undefined,
    status: (row.status as 'Ativo' | 'Férias' | 'Afastado' | 'Desligado') || 'Ativo',
    notes: row.notes || undefined,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
  };
}

export function mapDbBankStatementToBankStatement(row: DbBankStatement): BankStatementItem {
  return {
    id: row.id,
    organizationId: row.organizationId,
    bankAccountId: row.bankAccountId,
    date: row.date,
    description: row.description,
    amount: Number(row.amount) || 0,
    matched: row.matched ?? false,
    matchedTransactionId: row.matchedTransactionId || undefined,
    matchedTransactionIds: (() => {
      if (!row.matchedTransactionIds) return undefined;
      try {
        const parsed = JSON.parse(row.matchedTransactionIds);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    })(),
    confidenceScore: row.confidenceScore ?? 0,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}
