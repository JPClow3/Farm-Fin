import { z } from 'zod';

/**
 * Sanitizes document string removing formatting symbols
 */
export function cleanDocument(doc?: string | null): string {
  if (!doc) return '';
  return doc.replace(/[^\w]/gi, '').trim().toUpperCase();
}

/**
 * Validates basic CPF/CNPJ format and length
 */
export function isValidCpfCnpj(document: string): boolean {
  if (!document || document === 'N/A') return true;
  const digits = document.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 14;
}

/**
 * Validates Cadastro Ambiental Rural (CAR) format:
 * Example: UF-1234567-ABCD.1234.EFGH.5678 (2-letter state prefix followed by numeric IBGE code and hash)
 */
export function isValidCarNumber(car: string): boolean {
  if (!car || car === 'N/A') return true;
  // CAR should at least start with 2-letter state code or follow national SICAR format
  const trimmed = car.trim().toUpperCase();
  return trimmed.length >= 8;
}

/**
 * Validates CAEPF (Cadastro de Atividade Econômica da Pessoa Física) format (14 digits)
 */
export function isValidCaepf(caepf?: string | null): boolean {
  if (!caepf || caepf === 'N/A') return true;
  const digits = caepf.replace(/\D/g, '');
  return digits.length === 14;
}

/**
 * Validates NIRF / CAFIR (Número do Imóvel na Receita Federal) format (7 to 8 digits)
 */
export function isValidNirf(nirf?: string | null): boolean {
  if (!nirf || nirf === 'N/A') return true;
  const digits = nirf.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 10;
}

export const farmParticipantSchema = z.object({
  id: z.string().optional(),
  farmId: z.string().optional(),
  name: z.string().min(2, 'Nome do condômino/parceiro é obrigatório.'),
  document: z.string().min(11, 'CPF/CNPJ do participante é obrigatório.'),
  participationPercentage: z
    .number()
    .min(0, 'Percentual deve ser maior ou igual a 0%.')
    .max(100, 'Percentual deve ser menor ou igual a 100%.'),
  isDeclarant: z.boolean().default(false),
});

export const farmExploitationTypeSchema = z.enum([
  'individual',
  'condominio',
  'parceria',
  'arrendamento',
  'comodato',
  'outros',
]);

export const farmSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  name: z.string().min(2, 'O nome da fazenda deve ter pelo menos 2 caracteres.'),
  cnpjCpf: z.string().optional(),
  caepf: z.string().optional(),
  stateRegistration: z.string().optional(),
  nirf: z.string().optional(),
  sncr: z.string().optional(),
  address: z.string().optional(),
  location: z.string().default('Mato Grosso - MT'),
  totalArea: z.number().nonnegative('A área total deve ser maior ou igual a zero.'),
  carNumber: z.string().default('N/A'),
  active: z.boolean().default(true),
  exploitationType: farmExploitationTypeSchema.default('individual'),
  declarantPercentage: z.number().min(0).max(100).default(100),
  participants: z.array(farmParticipantSchema).optional(),
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
  variety: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coordinates: z.string().optional(),
  plantingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
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
  plantingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
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
