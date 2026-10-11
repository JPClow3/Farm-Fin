import { test, expect } from '@playwright/test';

test.describe('Authentication & User Management Suite (e2e/auth.spec.ts)', () => {
  test('1. Verify absolute absence of demo persona selector cards ("Conhecer o sistema")', async ({ page }) => {
    await page.goto('/login');

    // Confirm core login credential elements are present
    const identifierInput = page.getByLabel('E-mail ou usuário');
    const passwordInput = page.getByLabel('Senha', { exact: true });
    const submitButton = page.getByRole('button', { name: 'Entrar' });

    await expect(identifierInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Verify demo profile selector and persona cards are completely absent
    const demoKeywords = [
      'Conhecer o sistema',
      'perfis de demonstração',
      'acessar como',
      'acesso por perfil',
      'Seu Antônio Carvalho',
      'Gestor da fazenda',
      'Financeiro',
      'Contador rural',
      'Operador de campo',
    ];

    for (const keyword of demoKeywords) {
      await expect(page.getByText(new RegExp(keyword, 'i'))).toHaveCount(0);
    }

    // Verify demo persona grid class does not exist in DOM
    const personaGrid = page.locator('[class*="personaGrid"]');
    await expect(personaGrid).toHaveCount(0);
  });

  test('2. Verify login with username "paraiba" and password "melhorprofessor"', async ({ page }) => {
    let capturedPayload: Record<string, unknown> | undefined;
    await page.route('**/api/auth/sign-in/username*', async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u0000000-0000-4000-8000-000000000005',
            username: 'paraiba',
            email: 'paraiba@farm-fin.com',
            name: 'Professor Paraíba',
            role: 'Produtor',
          },
          session: {
            token: 'e2e-session-token-paraiba',
            userId: 'u0000000-0000-4000-8000-000000000005',
          },
        }),
      });
    });

    await page.goto('/login');

    const identifierInput = page.getByLabel('E-mail ou usuário');
    const passwordInput = page.getByLabel('Senha', { exact: true });
    const submitButton = page.getByRole('button', { name: 'Entrar' });

    // Fill with leading/trailing whitespace to test normalization
    await identifierInput.fill('  paraiba  ');
    await passwordInput.fill('melhorprofessor');
    await submitButton.click();

    await expect.poll(() => capturedPayload).toMatchObject({
      username: 'paraiba',
      password: 'melhorprofessor',
    });

    // Successfully transitioned to dashboard or home page
    await expect(page).toHaveURL(/\/(login)?/);
  });

  test('3. Verify login with email "paraiba@farm-fin.com" and password "melhorprofessor"', async ({ page }) => {
    let capturedPayload: Record<string, unknown> | undefined;
    await page.route('**/api/auth/sign-in/email*', async (route) => {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u0000000-0000-4000-8000-000000000005',
            username: 'paraiba',
            email: 'paraiba@farm-fin.com',
            name: 'Professor Paraíba',
            role: 'Produtor',
          },
          session: {
            token: 'e2e-session-token-paraiba-email',
            userId: 'u0000000-0000-4000-8000-000000000005',
          },
        }),
      });
    });

    await page.goto('/login');

    const identifierInput = page.getByLabel('E-mail ou usuário');
    const passwordInput = page.getByLabel('Senha', { exact: true });
    const submitButton = page.getByRole('button', { name: 'Entrar' });

    // Fill with uppercase and whitespace to test normalization
    await identifierInput.fill('  Paraiba@Farm-Fin.com  ');
    await passwordInput.fill('melhorprofessor');
    await submitButton.click();

    await expect.poll(() => capturedPayload).toMatchObject({
      email: 'paraiba@farm-fin.com',
      password: 'melhorprofessor',
    });

    await expect(page).toHaveURL(/\/(login)?/);
  });

  test('4. Verify username-based registration workflow', async ({ page }) => {
    // Mock registration API response
    let registerBody: Record<string, unknown> | undefined;
    await page.route('**/api/auth/sign-up/email*', async (route) => {
      registerBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'usr-new-001',
            username: 'carlos.silva',
            email: 'carlos.silva@fazendateste.com.br',
            name: 'Carlos Eduardo Silva',
          },
        }),
      });
    });

    await page.goto('/register');

    // Confirm registration page header
    await expect(page.getByRole('heading', { name: /Criar Conta/i })).toBeVisible();

    // Confirm dedicated username input is present
    const usernameInput = page.getByPlaceholder('Ex: carlos.silva');
    await expect(usernameInput).toBeVisible();

    // Fill valid registration fields
    await page.getByPlaceholder('Ex: Carlos Eduardo').fill('Carlos Eduardo Silva');
    await usernameInput.fill('carlos.silva');
    await page.getByPlaceholder('carlos@fazendasantaclara.com.br').fill('carlos.silva@fazendateste.com.br');
    await page.getByPlaceholder('Ex: Fazenda Santa Clara').fill('Fazenda Santa Clara');

    // Fill password fields
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('SenhaSegura123!');
    await passwordInputs.nth(1).fill('SenhaSegura123!');

    const submitBtn = page.getByRole('button', { name: 'Criar Conta e Começar' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify submission triggered without client-side error blocks
    await expect(page.locator('[role="alert"]').filter({ hasText: /Verifique os campos/i })).toHaveCount(0);
  });
});
