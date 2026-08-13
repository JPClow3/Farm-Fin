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
export type DbBankStatement = typeof bankStatements.$inferSelect;

export function mapDbFarmToFarm(row: DbFarm): Farm {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    location: row.location || 'Mato Grosso - MT',
    totalArea: Number(row.totalArea) || 0,
    carNumber: row.carNumber || 'N/A',
    active: row.active ?? true,
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
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}

export function mapDbReceivableToReceivable(row: DbReceivable): Receivable {
  return {
    id: row.id,
    organizationId: row.organizationId,
    farmId: row.farmId,
    cropSeasonId: row.cropSeasonId,
    customerId: row.customerId,
    customerName: row.customerName || row.customer?.name || 'Cliente',
    crop: row.crop || 'Soja',
    description: row.description,
    bagsQuantity: Number(row.bagsQuantity) || 0,
    unitPrice: Number(row.unitPrice) || 0,
    totalAmount: Number(row.totalAmount) || 0,
    dueDate: row.dueDate,
    status: (row.status as 'pendente' | 'pago' | 'vencido' | 'parcial') || 'pendente',
    contractType:
      (row.contractType as 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge') ||
      'Venda Spot',
    receivedDate: row.receivedDate || undefined,
    bankAccountId: row.bankAccountId || undefined,
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
    plate: row.plate || 'AGRO-001',
    hourCost: Number(row.hourCost) || 0,
    status: (row.status as 'Operacional' | 'Manutenção' | 'Inativo') || 'Operacional',
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
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
    confidenceScore: row.confidenceScore ?? 0,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  };
}
