import { describe, expect, it } from 'vitest';
import { provisionUser } from '../create-user';

describe('provisionUser', () => {
  it('requires a secret password and never falls back to a built-in credential', async () => {
    const previous = process.env.FARMFIN_CREATE_USER_PASSWORD;
    delete process.env.FARMFIN_CREATE_USER_PASSWORD;
    try {
      await expect(provisionUser({ username: 'paraiba' })).rejects.toThrow(
        'Defina FARMFIN_CREATE_USER_PASSWORD para criar o usuário.'
      );
    } finally {
      if (previous === undefined) delete process.env.FARMFIN_CREATE_USER_PASSWORD;
      else process.env.FARMFIN_CREATE_USER_PASSWORD = previous;
    }
  });
});
