import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureRegistrationAccount } from '../registration-account';

const mocks = vi.hoisted(() => ({ session: vi.fn(), signup: vi.fn() }));
vi.mock('../auth-client', () => ({
  authClient: { getSession: mocks.session, signUp: { email: mocks.signup } },
}));
const input = {
  email: 'owner@example.com',
  username: 'farm-owner',
  name: 'Owner',
  password: 'fixture-only-password',
};

describe('registration account recovery', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ data: null });
    mocks.signup.mockResolvedValue({ error: null });
  });
  it('resumes tenant initialization for the matching authenticated account', async () => {
    mocks.session.mockResolvedValue({ data: { user: { email: 'OWNER@example.com' } } });
    expect(await ensureRegistrationAccount(input)).toEqual({ error: null });
    expect(mocks.signup).not.toHaveBeenCalled();
  });
  it('does not reuse a different authenticated account', async () => {
    mocks.session.mockResolvedValue({ data: { user: { email: 'other@example.com' } } });
    await ensureRegistrationAccount(input);
    expect(mocks.signup).toHaveBeenCalledWith(input);
  });
  it('creates a new account when there is no session', async () => {
    await ensureRegistrationAccount(input);
    expect(mocks.signup).toHaveBeenCalledWith(input);
  });
  it('returns provider errors instead of treating an unauthenticated duplicate as recovery', async () => {
    const error = { status: 422, message: 'already exists' };
    mocks.signup.mockResolvedValue({ error });
    expect(await ensureRegistrationAccount(input)).toEqual({ error });
  });
});
