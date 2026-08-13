import { z } from 'zod';

export const payableStatusSchema = z.enum(['pendente', 'pago', 'vencido', 'parcial']);

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
  bagsQuantity: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative().default(0),
  totalAmount: z.number().positive('O valor total deve ser maior que zero.'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD.'),
  status: payableStatusSchema.default('pendente'),
  contractType: receivableContractTypeSchema.default('Venda Spot'),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bankAccountId: z.string().optional(),
});

export const createReceivableSchema = receivableSchema.omit({ id: true });

export const receiveReceivableInputSchema = z.object({
  id: z.string().min(1, 'ID do recebimento é obrigatório.'),
  bankAccountId: z.string().min(1, 'Conta bancária é obrigatória.'),
  receivedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de recebimento deve estar no formato YYYY-MM-DD.'),
  amount: z.number().positive('Valor recebido deve ser maior que zero.'),
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
  transactionId: z.string().min(1, 'ID da transação é obrigatório.'),
});

export type PayableInput = z.infer<typeof payableSchema>;
export type CreatePayableInput = z.infer<typeof createPayableSchema>;
export type PayPayableInput = z.infer<typeof payPayableInputSchema>;
export type ReceivableInput = z.infer<typeof receivableSchema>;
export type CreateReceivableInput = z.infer<typeof createReceivableSchema>;
export type ReceiveReceivableInput = z.infer<typeof receiveReceivableInputSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type MatchStatementInput = z.infer<typeof matchStatementSchema>;
