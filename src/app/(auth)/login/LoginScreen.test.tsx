import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginScreen } from './LoginScreen';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signInEmail: vi.fn(),
  signInUsername: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: mocks.signInEmail,
      username: mocks.signInUsername,
    },
  },
}));

const methods = { magicLink: false, google: false, microsoft: false };

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signInEmail.mockResolvedValue({ data: { user: { id: 'u1', email: 'maria@example.com' } } });
    mocks.signInUsername.mockResolvedValue({ data: { user: { id: 'u1', username: 'paraiba' } } });
  });

  it('does not render demo profile choices', () => {
    render(<LoginScreen methods={methods} />);
    expect(
      screen.queryByText(/perfis de demonstração|acessar como|acesso por perfil|Professor Paraíba/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('E-mail ou usuário')).toBeInTheDocument();
  });

  it('submits a normalized username through Better Auth username sign-in', async () => {
    const user = userEvent.setup();
    render(<LoginScreen methods={methods} />);
    await user.type(screen.getByLabelText('E-mail ou usuário'), ' Paraiba ');
    await user.type(screen.getByLabelText('Senha'), 'valid-password');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(mocks.signInUsername).toHaveBeenCalledWith({
      username: 'paraiba',
      password: 'valid-password',
    }));
    expect(mocks.signInEmail).not.toHaveBeenCalled();
    expect(mocks.push).toHaveBeenCalledWith('/');
  });

  it('submits an email identifier through Better Auth email sign-in', async () => {
    const user = userEvent.setup();
    render(<LoginScreen methods={methods} />);
    await user.type(screen.getByLabelText('E-mail ou usuário'), ' Maria@Example.com ');
    await user.type(screen.getByLabelText('Senha'), 'valid-password');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(mocks.signInEmail).toHaveBeenCalledWith({
      email: 'maria@example.com',
      password: 'valid-password',
    }));
    expect(mocks.signInUsername).not.toHaveBeenCalled();
  });

  it('shows an inline validation message for malformed usernames without calling auth', async () => {
    const user = userEvent.setup();
    render(<LoginScreen methods={methods} />);
    await user.type(screen.getByLabelText('E-mail ou usuário'), 'a b');
    await user.type(screen.getByLabelText('Senha'), 'valid-password');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nome de usuário deve ter entre 3 e 30 caracteres');
    expect(mocks.signInUsername).not.toHaveBeenCalled();
    expect(mocks.signInEmail).not.toHaveBeenCalled();
  });
});
