import { z } from 'zod';

export const employeeTypeSchema = z.enum(['CLT', 'PJ', 'Diarista', 'Temporário']);
export const employeeStatusSchema = z.enum(['Ativo', 'Férias', 'Afastado', 'Desligado']);

export const employeeSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  farmId: z.string().min(1, 'Fazenda é obrigatória.'),
  name: z.string().min(2, 'Nome do colaborador é obrigatório.'),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.string().min(2, 'Cargo/Função é obrigatório.'),
  type: employeeTypeSchema.default('CLT'),
  remuneration: z.number().nonnegative('Remuneração não pode ser negativa.').default(0),
  additionalCosts: z.number().nonnegative('Custos adicionais não podem ser negativos.').default(0),
  hourCost: z.number().nonnegative('Custo/Hora não pode ser negativo.').default(0),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de admissão deve estar no formato YYYY-MM-DD.')
    .optional()
    .nullable(),
  status: employeeStatusSchema.default('Ativo'),
  notes: z.string().optional().nullable(),
});

export const createEmployeeSchema = employeeSchema.omit({ id: true });
export const updateEmployeeSchema = employeeSchema.partial().required({ id: true });

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
