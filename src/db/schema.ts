import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  real,
  date,
  numeric,
  boolean,
  integer,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ----------------------------------------------------
// Core Multi-Tenant & Identity Tables
// ----------------------------------------------------

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  cnpjCpf: varchar('cnpj_cpf', { length: 30 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  role: varchar('role', { length: 50 }).default('Produtor').notNull(), // 'Produtor' | 'Gestor' | 'Financeiro' | 'Contador' | 'Operador'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const verifications = pgTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'PROPRIETARIO' | 'ADMIN' | 'GESTOR' | 'FINANCEIRO' | 'CONTADOR' | 'OPERADOR'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// Agronomic Base Cadastros
// ----------------------------------------------------

export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).default('Mato Grosso - MT').notNull(),
  totalArea: real('total_area').default(0).notNull(), // hectares
  carNumber: varchar('car_number', { length: 100 }).default('MT-0000000-0000.0000.0000'),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fields = pgTable('fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  area: real('area').default(0).notNull(), // hectares
  soilType: varchar('soil_type', { length: 100 }).default('Latossolo Vermelho'),
  currentCrop: varchar('current_crop', { length: 100 }).default('Soja'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cropSeasons = pgTable('crop_seasons', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  isCurrent: boolean('is_current').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const crops = pgTable('crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cropSeasonFields = pgTable('crop_season_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  cropSeasonId: uuid('crop_season_id')
    .references(() => cropSeasons.id, { onDelete: 'cascade' })
    .notNull(),
  fieldId: uuid('field_id')
    .references(() => fields.id, { onDelete: 'cascade' })
    .notNull(),
  cropId: uuid('crop_id')
    .references(() => crops.id)
    .notNull(),
  plantedArea: real('planted_area').default(0),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).default('despesa').notNull(), // 'despesa' | 'receita'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).default('Insumos Agrícolas'),
  document: varchar('document', { length: 30 }).default('N/A'), // CNPJ / CPF
  contact: varchar('contact', { length: 150 }).default('N/A'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  segment: varchar('segment', { length: 100 }).default('Trading / Exportação'),
  document: varchar('document', { length: 30 }).default('N/A'), // CNPJ / CPF
  contact: varchar('contact', { length: 150 }).default('N/A'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  agency: varchar('agency', { length: 20 }).default('0001'),
  accountNumber: varchar('account_number', { length: 30 }).default('12345-6'),
  balance: real('balance').default(0).notNull(),
  type: varchar('type', { length: 50 }).default('Corrente').notNull(), // 'Corrente' | 'Poupança' | 'Crédito Rural'
  pixKey: varchar('pix_key', { length: 150 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// Financial Module (Payables & Receivables)
// ----------------------------------------------------

export const payables = pgTable('payables', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  cropSeasonId: uuid('crop_season_id')
    .references(() => cropSeasons.id)
    .notNull(),
  fieldId: uuid('field_id').references(() => fields.id),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id)
    .notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  description: varchar('description', { length: 255 }).notNull(),
  category: varchar('category_name', { length: 100 }).default('Insumos > Fertilizantes'),
  supplierName: varchar('supplier_name', { length: 255 }).default('Fornecedor'),
  amount: real('amount').default(0).notNull(),
  dueDate: varchar('due_date', { length: 20 }).notNull(), // YYYY-MM-DD
  status: varchar('status', { length: 50 }).default('pendente').notNull(), // 'pendente' | 'pago' | 'vencido' | 'parcial'
  installments: varchar('installments', { length: 20 }).default('1/1'),
  hasAttachment: boolean('has_attachment').default(false),
  attachmentUrl: text('attachment_url'),
  paymentDate: varchar('payment_date', { length: 20 }),
  paidAmount: real('paid_amount'),
  bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payableInstallments = pgTable('payable_installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  payableId: uuid('payable_id')
    .references(() => payables.id, { onDelete: 'cascade' })
    .notNull(),
  amount: numeric('amount').notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 50 }).default('pendente'),
  installmentNumber: integer('installment_number').default(1),
  totalInstallments: integer('total_installments').default(1),
});

export const payablePayments = pgTable('payable_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  payableId: uuid('payable_id').references(() => payables.id, { onDelete: 'cascade' }),
  payableInstallmentId: uuid('payable_installment_id').references(() => payableInstallments.id),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  amountPaid: numeric('amount_paid').notNull(),
  paymentDate: date('payment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const receivables = pgTable('receivables', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  cropSeasonId: uuid('crop_season_id')
    .references(() => cropSeasons.id)
    .notNull(),
  customerId: uuid('customer_id')
    .references(() => customers.id)
    .notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  customerName: varchar('customer_name', { length: 255 }).default('Cliente'),
  crop: varchar('crop', { length: 100 }).default('Soja'),
  description: varchar('description', { length: 255 }).notNull(),
  bagsQuantity: real('bags_quantity').default(0),
  unitPrice: real('unit_price').default(0),
  totalAmount: real('total_amount').default(0).notNull(),
  dueDate: varchar('due_date', { length: 20 }).notNull(),
  status: varchar('status', { length: 50 }).default('pendente').notNull(), // 'pendente' | 'pago' | 'vencido' | 'parcial'
  contractType: varchar('contract_type', { length: 50 }).default('Venda Spot').notNull(), // 'Venda Spot' | 'Barter Insumos' | 'Contrato Futuro' | 'Hedge'
  receivedDate: varchar('received_date', { length: 20 }),
  bankAccountId: uuid('bank_account_id').references(() => bankAccounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const receivableInstallments = pgTable('receivable_installments', {
  id: uuid('id').primaryKey().defaultRandom(),
  receivableId: uuid('receivable_id')
    .references(() => receivables.id, { onDelete: 'cascade' })
    .notNull(),
  amount: numeric('amount').notNull(),
  dueDate: date('due_date'),
  status: varchar('status', { length: 50 }).default('pendente'),
  installmentNumber: integer('installment_number').default(1),
  totalInstallments: integer('total_installments').default(1),
});

export const receivablePayments = pgTable('receivable_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  receivableId: uuid('receivable_id').references(() => receivables.id, { onDelete: 'cascade' }),
  receivableInstallmentId: uuid('receivable_installment_id').references(
    () => receivableInstallments.id
  ),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id)
    .notNull(),
  amountPaid: numeric('amount_paid').notNull(),
  paymentDate: date('payment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// Stock / Insumos
// ----------------------------------------------------

export const stockItems = pgTable('stock_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'Sementes' | 'Fertilizantes' | 'Defensivos' | 'Combustíveis'
  unit: varchar('unit', { length: 20 }).notNull(), // 'kg' | 'L' | 'sc' | 'ton'
  quantity: real('quantity').default(0).notNull(),
  minQuantity: real('min_quantity').default(0).notNull(),
  averageCost: real('average_cost').default(0).notNull(),
  lastSupplier: varchar('last_supplier', { length: 255 }).default('N/A'),
  expiryDate: varchar('expiry_date', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  stockItemId: uuid('stock_item_id')
    .references(() => stockItems.id, { onDelete: 'cascade' })
    .notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'entrada' | 'saida'
  quantity: real('quantity').notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  fieldId: uuid('field_id').references(() => fields.id),
  fieldName: varchar('field_name', { length: 255 }),
  machinery: varchar('machinery', { length: 255 }),
  operator: varchar('operator', { length: 255 }),
  documentNumber: varchar('document_number', { length: 100 }),
  totalCost: real('total_cost').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Legacy input tables for backwards-compatibility if referenced
export const inputProducts = pgTable('input_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});

export const inputStocks = pgTable('input_stocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  inputProductId: uuid('input_product_id')
    .references(() => inputProducts.id)
    .notNull(),
  quantity: numeric('quantity').notNull(),
});

export const inputMovements = pgTable('input_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  inputStockId: uuid('input_stock_id')
    .references(() => inputStocks.id)
    .notNull(),
  cropSeasonFieldId: uuid('crop_season_field_id').references(() => cropSeasonFields.id),
  quantity: numeric('quantity').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
});

// ----------------------------------------------------
// Machinery / Frota
// ----------------------------------------------------

export const machinery = pgTable('machinery', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  farmId: uuid('farm_id')
    .references(() => farms.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  plate: varchar('plate', { length: 50 }).default('AGRO-001'),
  hourCost: real('hour_cost').default(0).notNull(), // R$/hora
  status: varchar('status', { length: 50 }).default('Operacional').notNull(), // 'Operacional' | 'Manutenção' | 'Inativo'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// Banking Statements / Conciliação
// ----------------------------------------------------

export const bankStatements = pgTable('bank_statements', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id)
    .notNull(),
  bankAccountId: uuid('bank_account_id')
    .references(() => bankAccounts.id, { onDelete: 'cascade' })
    .notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: real('amount').notNull(), // positivo para crédito, negativo para débito
  matched: boolean('matched').default(false).notNull(),
  matchedTransactionId: varchar('matched_transaction_id', { length: 255 }),
  confidenceScore: integer('confidence_score').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ----------------------------------------------------
// Drizzle Relations
// ----------------------------------------------------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  farms: many(farms),
  cropSeasons: many(cropSeasons),
  categories: many(categories),
  suppliers: many(suppliers),
  customers: many(customers),
  bankAccounts: many(bankAccounts),
  payables: many(payables),
  receivables: many(receivables),
  stockItems: many(stockItems),
  stockMovements: many(stockMovements),
  machinery: many(machinery),
  bankStatements: many(bankStatements),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [farms.organizationId],
    references: [organizations.id],
  }),
  fields: many(fields),
  payables: many(payables),
  receivables: many(receivables),
  stockItems: many(stockItems),
  stockMovements: many(stockMovements),
  machinery: many(machinery),
}));

export const fieldsRelations = relations(fields, ({ one }) => ({
  farm: one(farms, {
    fields: [fields.farmId],
    references: [farms.id],
  }),
}));

export const payablesRelations = relations(payables, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [payables.organizationId],
    references: [organizations.id],
  }),
  farm: one(farms, {
    fields: [payables.farmId],
    references: [farms.id],
  }),
  cropSeason: one(cropSeasons, {
    fields: [payables.cropSeasonId],
    references: [cropSeasons.id],
  }),
  supplier: one(suppliers, {
    fields: [payables.supplierId],
    references: [suppliers.id],
  }),
  category: one(categories, {
    fields: [payables.categoryId],
    references: [categories.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [payables.bankAccountId],
    references: [bankAccounts.id],
  }),
  installments: many(payableInstallments),
  payments: many(payablePayments),
}));

export const receivablesRelations = relations(receivables, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [receivables.organizationId],
    references: [organizations.id],
  }),
  farm: one(farms, {
    fields: [receivables.farmId],
    references: [farms.id],
  }),
  cropSeason: one(cropSeasons, {
    fields: [receivables.cropSeasonId],
    references: [cropSeasons.id],
  }),
  customer: one(customers, {
    fields: [receivables.customerId],
    references: [customers.id],
  }),
  category: one(categories, {
    fields: [receivables.categoryId],
    references: [categories.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [receivables.bankAccountId],
    references: [bankAccounts.id],
  }),
  installments: many(receivableInstallments),
  payments: many(receivablePayments),
}));

export const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
  farm: one(farms, {
    fields: [stockItems.farmId],
    references: [farms.id],
  }),
  movements: many(stockMovements),
}));

export const machineryRelations = relations(machinery, ({ one }) => ({
  farm: one(farms, {
    fields: [machinery.farmId],
    references: [farms.id],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bankAccounts.organizationId],
    references: [organizations.id],
  }),
  statements: many(bankStatements),
}));
