import { z } from 'zod';

export type LoginIdentifier =
  | { type: 'email'; value: string }
  | { type: 'username'; value: string }
  | { type: 'invalid'; message: string };

export function normalizeLoginIdentifier(input: string): LoginIdentifier {
  const value = input.trim().toLowerCase();
  if (!value) return { type: 'invalid', message: 'Informe seu e-mail ou nome de usuário.' };
  if (value.includes('@')) {
    return z.string().email().safeParse(value).success
      ? { type: 'email', value }
      : { type: 'invalid', message: 'Informe um e-mail válido ou um nome de usuário.' };
  }
  if (value.length < 3 || value.length > 30 || !/^[a-z0-9._-]+$/.test(value)) {
    return {
      type: 'invalid',
      message:
        'Nome de usuário deve ter entre 3 e 30 caracteres e conter apenas letras, números, pontos, hífens ou sublinhados.',
    };
  }
  return { type: 'username', value };
}
