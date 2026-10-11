import { authClient } from './auth-client';

export async function ensureRegistrationAccount(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const current = await authClient.getSession();
  if (current.data?.user.email?.toLowerCase() === input.email.toLowerCase()) {
    return { error: null };
  }
  return await authClient.signUp.email(input);
}
