import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  organizationName: z
    .string()
    .min(2, 'Nome da fazenda/empresa é obrigatório')
    .default('Fazenda Santa Fé'),
  role: z.enum(['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador']).default('Produtor'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
