import { z } from 'zod';

export const stockItemCategorySchema = z.enum([
  'Sementes',
  'Fertilizantes',
  'Defensivos',
  'Combustíveis',
]);
export const stockUnitSchema = z.enum(['kg', 'L', 'sc', 'ton']);

export const stockItemSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  name: z.string().min(2, 'Nome do item é obrigatório.'),
  category: stockItemCategorySchema,
  unit: stockUnitSchema,
  quantity: z.number().nonnegative('Quantidade não pode ser negativa.'),
  minQuantity: z.number().nonnegative('Quantidade mínima não pode ser negativa.'),
  averageCost: z.number().nonnegative('Custo médio não pode ser negativo.'),
  lastSupplier: z.string().default('N/A'),
  expiryDate: z.string().optional(),
});

export const createStockItemSchema = stockItemSchema.omit({ id: true });

export const stockMovementTypeSchema = z.enum(['entrada', 'saida']);

export const stockMovementSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  stockItemId: z.string().min(1, 'Item de estoque é obrigatório.'),
  itemName: z.string().min(1, 'Nome do item é obrigatório.'),
  type: stockMovementTypeSchema,
  quantity: z.number().positive('Quantidade movimentada deve ser maior que zero.'),
  unit: z.string().default('L'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD.'),
  fieldId: z.string().optional(),
  fieldName: z.string().optional(),
  machinery: z.string().optional(),
  operator: z.string().optional(),
  documentNumber: z.string().optional(),
  totalCost: z.number().nonnegative().default(0),
});

export const createStockMovementSchema = stockMovementSchema.omit({ id: true });

export const machineryStatusSchema = z.enum(['Operacional', 'Manutenção', 'Inativo']);

export const machinerySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  name: z.string().min(2, 'Nome do maquinário é obrigatório.'),
  type: z.string().min(2, 'Tipo de equipamento é obrigatório.'),
  plate: z.string().default('AGRO-001'),
  hourCost: z.number().nonnegative().default(0),
  status: machineryStatusSchema.default('Operacional'),
});

export const createMachinerySchema = machinerySchema.omit({ id: true });

export type StockItemInput = z.infer<typeof stockItemSchema>;
export type CreateStockItemInput = z.infer<typeof createStockItemSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type MachineryInput = z.infer<typeof machinerySchema>;
export type CreateMachineryInput = z.infer<typeof createMachinerySchema>;
