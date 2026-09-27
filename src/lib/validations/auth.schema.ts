import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(30, 'Nome de usuário deve ter no máximo 30 caracteres')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Nome de usuário pode conter apenas letras, números, pontos, hífens e sublinhados'
    ),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  organizationName: z
    .string()
    .min(2, 'Nome da fazenda/empresa é obrigatório')
    .default('Fazenda Santa Fé'),
  role: z.enum(['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador']).default('Produtor'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
