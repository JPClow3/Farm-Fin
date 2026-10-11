import { expect, test } from '@playwright/test';

test('login screen has no demo profiles and supports a username identifier', async ({ page }) => {
  await page.goto('/login?from=%2Flogin');

  const identifier = page.getByLabel('E-mail ou usuário');
  await expect(identifier).toBeVisible();
  await expect(
    page.getByText(
      /perfis de demonstração|acessar como|acesso por perfil|Professor Paraíba|Seu Antônio Carvalho|Gestor da fazenda|Financeiro|Contador rural|Operador de campo/i
    )
  ).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Google' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Microsoft' })).toHaveCount(0);

  let submittedBody: Record<string, unknown> | undefined;
  await page.route('**/api/auth/sign-in/username', async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'e2e-user', username: 'paraiba' }, token: 'e2e-token' }),
    });
  });

  await identifier.fill('  Paraiba ');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect
    .poll(() => submittedBody)
    .toEqual({ username: 'paraiba', password: 'test-only-password' });
});

test('malformed username is explained before a request is sent', async ({ page }) => {
  await page.goto('/login');
  let authRequestSeen = false;
  await page.route('**/api/auth/**', async (route) => {
    authRequestSeen = true;
    await route.abort();
  });

  await page.getByLabel('E-mail ou usuário').fill('ab');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Nome de usuário deve ter entre 3 e 30 caracteres' })
  ).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Nome de usuário deve ter entre 3 e 30 caracteres' })
  ).toHaveAttribute('aria-live', 'polite');
  expect(authRequestSeen).toBe(false);
});

test('submits a normalized email and surfaces invalid-credential errors', async ({ page }) => {
  await page.goto('/login?from=%2Fcontas-a-pagar');

  let submittedBody: Record<string, unknown> | undefined;
  await page.route('**/api/auth/sign-in/email', async (route) => {
    submittedBody = route.request().postDataJSON();
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { status: 401, statusText: 'Unauthorized', message: 'Invalid credentials' },
      }),
    });
  });

  await page.getByLabel('E-mail ou usuário').fill(' Maria@Example.com ');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect
    .poll(() => submittedBody)
    .toEqual({
      email: 'maria@example.com',
      password: 'test-only-password',
    });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Usuário ou senha incorretos' })
  ).toBeVisible();
  await expect(page).toHaveURL(/\/login\?from=%2Fcontas-a-pagar$/);
});

test('shows a connection error when username authentication is unavailable', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/api/auth/sign-in/username', (route) => route.abort('failed'));

  await page.getByLabel('E-mail ou usuário').fill('paraiba');
  await page.getByLabel('Senha', { exact: true }).fill('test-only-password');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Sem conexão com o servidor' })
  ).toBeVisible();
});

test('keeps login controls accessible and usable at a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/login');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();

  const identifier = page.getByLabel('E-mail ou usuário');
  const password = page.getByLabel('Senha', { exact: true });
  await expect(identifier).toHaveAttribute('autocomplete', 'username');
  await expect(identifier).toHaveAttribute('aria-describedby', 'login-identifier-hint');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');

  await password.fill('test-only-password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(password).toHaveAttribute('type', 'password');

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
});
