import { authClient } from './auth-client';

export async function ensureRegistrationAccount(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const current = await authClient.getSession();
  if (current.data?.user.email?.toLowerCase() === input.email.toLowerCase()) {
    // Confirm the password the form presents as the account credential.
    return await authClient.signIn.email({ email: input.email, password: input.password });
  }
  return await authClient.signUp.email(input);
}
