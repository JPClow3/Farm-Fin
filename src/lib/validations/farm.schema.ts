import { z } from 'zod';

export const farmSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  name: z.string().min(2, 'O nome da fazenda deve ter pelo menos 2 caracteres.'),
  location: z.string().default('Mato Grosso - MT'),
  totalArea: z.number().nonnegative('A área total deve ser maior ou igual a zero.'),
  carNumber: z.string().default('N/A'),
  active: z.boolean().default(true),
});

export const createFarmSchema = farmSchema.omit({ id: true });
export const updateFarmSchema = farmSchema.partial().extend({
  id: z.string().min(1, 'ID é obrigatório para atualização.'),
});

export const fieldSchema = z.object({
  id: z.string().optional(),
  farmId: z.string().min(1, 'ID da fazenda é obrigatório.'),
  name: z.string().min(2, 'O nome do talhão deve ter pelo menos 2 caracteres.'),
  area: z.number().positive('A área do talhão deve ser maior que zero.'),
  soilType: z.string().default('Latossolo Vermelho'),
  currentCrop: z.string().default('Soja'),
});

export const createFieldSchema = fieldSchema.omit({ id: true });
export const updateFieldSchema = fieldSchema.partial().extend({
  id: z.string().min(1, 'ID é obrigatório para atualização.'),
});

export const cropSeasonSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  name: z.string().min(2, 'O nome da safra deve ter pelo menos 2 caracteres.'),
  startDate: z.string().min(4, 'Data de início inválida.'),
  endDate: z.string().min(4, 'Data de término inválida.'),
  isCurrent: z.boolean().default(true),
});

export const createCropSeasonSchema = cropSeasonSchema.omit({ id: true });

export const supplierSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  name: z.string().min(2, 'O nome do fornecedor é obrigatório.'),
  category: z.string().default('Insumos Agrícolas'),
  document: z.string().default('N/A'),
  contact: z.string().default('N/A'),
});

export const createSupplierSchema = supplierSchema.omit({ id: true });

export const customerSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  name: z.string().min(2, 'O nome do cliente é obrigatório.'),
  segment: z.string().default('Trading / Exportação'),
  document: z.string().default('N/A'),
  contact: z.string().default('N/A'),
});

export const createCustomerSchema = customerSchema.omit({ id: true });

export type FarmInput = z.infer<typeof farmSchema>;
export type CreateFarmInput = z.infer<typeof createFarmSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type CropSeasonInput = z.infer<typeof cropSeasonSchema>;
export type CreateCropSeasonInput = z.infer<typeof createCropSeasonSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
