import { z } from 'zod';

export const payableStatusSchema = z.enum(['pendente', 'pago', 'vencido', 'parcial']);
export const recurrencePatternSchema = z.enum([
  'none',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannual',
  'yearly',
]);
export const approvalStatusSchema = z.enum(['pendente', 'aprovado', 'rejeitado']);
export const commodityUnitSchema = z.enum(['sc', 'ton', 'kg', '@']);
export const barterStatusSchema = z.enum(['nenhum', 'aberto', 'vinculado', 'liquidado']);
export const hedgeTypeSchema = z.enum([
  'Nenhum',
  'Futuro B3',
  'Futuro CME',
  'Opcao Venda (Put)',
  'Opcao Compra (Call)',
  'NDF Cambial',
  'CPR Financeira',
  'Termo Físico',
]);
export const priceFixingStatusSchema = z.enum(['fixado', 'a_fixar']);

export const categorySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  parentId: z.string().optional(),
  name: z.string().min(2, 'Nome da categoria é obrigatório.'),
  type: z.enum(['despesa', 'receita']).default('despesa'),
  includeInLcdpr: z.boolean().default(true),
});

export const createCategorySchema = categorySchema.omit({ id: true });

export const payableSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  cropSeasonId: z.string().min(1, 'Safra é obrigatória.'),
  fieldId: z.string().optional(),
  supplierId: z.string().min(1, 'Fornecedor é obrigatório.'),
  supplierName: z.string().default('Fornecedor'),
  category: z.string().default('Insumos > Fertilizantes'),
  description: z.string().min(2, 'Descrição é obrigatória.'),
  amount: z.number().positive('O valor deve ser maior que zero.'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD.'),
  status: payableStatusSchema.default('pendente'),
  installments: z.string().default('1/1'),
  hasAttachment: z.boolean().default(false),
  attachmentUrl: z.string().url().optional().or(z.literal('')),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  paidAmount: z.number().nonnegative().optional(),
  bankAccountId: z.string().optional(),
  linkedReceivableId: z.string().optional(),
  isBarter: z.boolean().default(false).optional(),
  barterStatus: barterStatusSchema.default('nenhum').optional(),
  requiresApproval: z.boolean().default(false).optional(),
  approvalStatus: approvalStatusSchema.default('aprovado').optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  recurrencePattern: recurrencePatternSchema.default('none').optional(),
  recurringGroupId: z.string().optional(),
  includeInLcdpr: z.boolean().default(true).optional(),
  documentType: z.string().default('Nota Fiscal').optional(),
  documentNumber: z.string().optional(),
});

export const createPayableSchema = payableSchema.omit({ id: true });

export const payPayableInputSchema = z.object({
  id: z.string().min(1, 'ID do lançamento é obrigatório.'),
  bankAccountId: z.string().min(1, 'Conta bancária é obrigatória.'),
  paidAmount: z.number().positive('Valor pago deve ser maior que zero.'),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do pagamento deve estar no formato YYYY-MM-DD.'),
});

export const receivableContractTypeSchema = z.enum([
  'Venda Spot',
  'Barter Insumos',
  'Contrato Futuro',
  'Hedge',
]);

export const receivableSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  cropSeasonId: z.string().min(1, 'Safra é obrigatória.'),
  customerId: z.string().min(1, 'Cliente é obrigatório.'),
  customerName: z.string().default('Cliente'),
  crop: z.string().default('Soja'),
  description: z.string().min(2, 'Descrição é obrigatória.'),
  commodityUnit: commodityUnitSchema.default('sc').optional(),
  quantity: z.number().nonnegative().default(0).optional(),
  bagsQuantity: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
  totalAmount: z.number().positive('O valor total deve ser maior que zero.'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD.'),
  status: payableStatusSchema.default('pendente'),
  contractType: receivableContractTypeSchema.default('Venda Spot'),
  linkedPayableId: z.string().optional(),
  barterStatus: barterStatusSchema.default('nenhum').optional(),
  barterExchangeRate: z.number().optional(),
  hedgeType: hedgeTypeSchema.default('Nenhum').optional(),
  priceFixingStatus: priceFixingStatusSchema.default('fixado').optional(),
  referenceIndex: z.string().optional(),
  targetPrice: z.number().optional(),
  basis: z.number().optional(),
  strikePrice: z.number().optional(),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bankAccountId: z.string().optional(),
  recurrencePattern: recurrencePatternSchema.default('none').optional(),
  recurringGroupId: z.string().optional(),
  includeInLcdpr: z.boolean().default(true).optional(),
  documentType: z.string().default('Nota Fiscal / Recibo').optional(),
  documentNumber: z.string().optional(),
});

export const createReceivableSchema = receivableSchema.omit({ id: true });

export const approvePayableSchema = z.object({
  id: z.string().min(1, 'ID do lançamento é obrigatório.'),
  approverName: z.string().optional(),
});

export const rejectPayableSchema = z.object({
  id: z.string().min(1, 'ID do lançamento é obrigatório.'),
  reason: z.string().min(3, 'Justificativa da rejeição é obrigatória.'),
  approverName: z.string().optional(),
});

export const receiveReceivableInputSchema = z.object({
  id: z.string().min(1, 'ID do recebimento é obrigatório.'),
  bankAccountId: z.string().min(1, 'Conta bancária é obrigatória.'),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de recebimento deve estar no formato YYYY-MM-DD.'),
  amount: z.number().positive('Valor recebido deve ser maior que zero.'),
});

export const fixPriceReceivableSchema = z.object({
  id: z.string().min(1, 'ID do recebimento é obrigatório.'),
  unitPrice: z.number().positive('Preço unitário fixado deve ser maior que zero.'),
  fixingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const settleBarterContractSchema = z.object({
  receivableId: z.string().min(1, 'ID do recebimento é obrigatório.'),
  payableId: z.string().optional(),
  settlementDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
});

export const bankAccountSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  bankName: z.string().min(2, 'Nome do banco é obrigatório.'),
  agency: z.string().min(1, 'Agência é obrigatória.'),
  accountNumber: z.string().min(1, 'Número da conta é obrigatório.'),
  balance: z.number().default(0),
  type: z.enum(['Corrente', 'Poupança', 'Crédito Rural']).default('Corrente'),
  pixKey: z.string().optional(),
});

export const createBankAccountSchema = bankAccountSchema.omit({ id: true });

export const matchStatementSchema = z.object({
  statementId: z.string().min(1, 'ID do extrato é obrigatório.'),
  transactionIds: z
    .array(z.string().min(1))
    .min(1, 'Selecione ao menos uma transação para conciliar.'),
});

export type PayableInput = z.infer<typeof payableSchema>;
export type CreatePayableInput = z.infer<typeof createPayableSchema>;
export type ApprovePayableInput = z.infer<typeof approvePayableSchema>;
export type RejectPayableInput = z.infer<typeof rejectPayableSchema>;
export type PayPayableInput = z.infer<typeof payPayableInputSchema>;
export type ReceivableInput = z.infer<typeof receivableSchema>;
export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type ReceiveReceivableInput = z.infer<typeof receiveReceivableInputSchema>;
export type FixPriceReceivableInput = z.infer<typeof fixPriceReceivableSchema>;
export type SettleBarterContractInput = z.infer<typeof settleBarterContractSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type MatchStatementInput = z.infer<typeof matchStatementSchema>;
