import { test, expect } from '@playwright/test';

test.describe('Navigation & Responsive Viewport Suite (e2e/navigation.spec.ts)', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ context, page }) => {
    // Inject authenticated session cookie for middleware access
    await context.addCookies([
      {
        name: 'better-auth.session_token',
        value: 'e2e-authenticated-token',
        url: 'http://localhost:3000',
      },
      {
        name: 'better-auth.session_token',
        value: 'e2e-authenticated-token',
        url: 'http://127.0.0.1:3000',
      },
    ]);

    // Handle Better Auth session calls
    await page.route('**/api/auth/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/get-session') || url.includes('/session')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'u0000000-0000-4000-8000-000000000005',
              name: 'Professor Paraíba',
              email: 'paraiba@farm-fin.com',
              username: 'paraiba',
              role: 'Produtor',
            },
            session: {
              id: 'sess-paraiba',
              userId: 'u0000000-0000-4000-8000-000000000005',
              token: 'e2e-authenticated-token',
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('1. Authenticated desktop navigation across core financial and operational modules', async ({ page }) => {
    // Navigate to root dashboard
    await page.goto('/');
    await expect(page).toHaveURL(/\//);

    // 1. Contas a Pagar
    await page.goto('/contas-a-pagar');
    await expect(page).toHaveURL(/\/contas-a-pagar/);
    await expect(page.locator('h1.page-title')).toContainText(/Contas a Pagar/i, { timeout: 30000 });

    // 2. Contas a Receber
    await page.goto('/contas-a-receber');
    await expect(page).toHaveURL(/\/contas-a-receber/);
    await expect(page.locator('h1.page-title')).toContainText(/Contas a Receber/i, { timeout: 30000 });

    // 3. Fluxo de Caixa
    await page.goto('/fluxo-de-caixa');
    await expect(page).toHaveURL(/\/fluxo-de-caixa/);
    await expect(page.locator('h1.page-title')).toContainText(/Fluxo de Caixa/i, { timeout: 30000 });

    // 4. DRE Agrícola
    await page.goto('/dre');
    await expect(page).toHaveURL(/\/dre/);
    await expect(page.locator('h1.page-title')).toContainText(/DRE/i, { timeout: 30000 });

    // 5. Cadastros
    await page.goto('/cadastros');
    await expect(page).toHaveURL(/\/cadastros/);
    await expect(page.locator('h1.page-title')).toContainText(/Cadastros/i, { timeout: 30000 });
  });

  test('2. Mobile viewport navigation: bottom bar items and mobile drawer', async ({ page }) => {
    // Set mobile viewport (standard modern smartphone size: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Bottom Navigation Bar must be visible on mobile
    const bottomNav = page.locator('nav.bottom-nav');
    await expect(bottomNav).toBeVisible({ timeout: 15000 });

    // Navigate to "A Pagar" via bottom nav
    const payablesLink = bottomNav.getByRole('link', { name: /A Pagar/i });
    await expect(payablesLink).toBeVisible();
    await payablesLink.click();
    await expect(page).toHaveURL(/\/contas-a-pagar/);
    await expect(page.locator('h1.page-title')).toContainText(/Contas a Pagar/i, { timeout: 30000 });

    // Navigate to "A Receber" via bottom nav
    const receivablesLink = bottomNav.getByRole('link', { name: /A Receber/i });
    await expect(receivablesLink).toBeVisible();
    await receivablesLink.click();
    await expect(page).toHaveURL(/\/contas-a-receber/);
    await expect(page.locator('h1.page-title')).toContainText(/Contas a Receber/i, { timeout: 30000 });

    // Navigate to "Fluxo" via bottom nav
    const cashFlowLink = bottomNav.getByRole('link', { name: /Fluxo/i });
    await expect(cashFlowLink).toBeVisible();
    await cashFlowLink.click();
    await expect(page).toHaveURL(/\/fluxo-de-caixa/);
    await expect(page.locator('h1.page-title')).toContainText(/Fluxo de Caixa/i, { timeout: 30000 });

    // Test mobile drawer toggle: open menu
    const menuButton = bottomNav.getByRole('button', { name: /Menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Sidebar drawer must open with 'open' class
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toHaveClass(/open/);

    // Test mobile drawer close: trigger close on drawer button
    const closeDrawerBtn = page.getByRole('button', { name: 'Fechar Menu Lateral' });
    await expect(closeDrawerBtn).toBeVisible();
    await closeDrawerBtn.dispatchEvent('click');

    // Sidebar drawer must no longer have 'open' class
    await expect(sidebar).not.toHaveClass(/open/);
  });
});
