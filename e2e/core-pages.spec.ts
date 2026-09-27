import { test, expect } from '@playwright/test';

test.describe('Core Financial Pages & Component Rendering Suite (e2e/core-pages.spec.ts)', () => {
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

  test('1. Rendering of KPI cards on Dashboard and Contas a Pagar', async ({ page }) => {
    // 1. Dashboard KPIs
    await page.goto('/');

    // Check presence of KPI summary cards
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 15000 });
    const kpiCount = await kpiCards.count();
    expect(kpiCount).toBeGreaterThanOrEqual(3);

    // 2. Contas a Pagar KPIs
    await page.goto('/contas-a-pagar');
    await expect(page.getByRole('heading', { level: 1, name: /Contas a Pagar/i })).toBeVisible({ timeout: 15000 });

    // Verify individual financial indicators using distinct KPI card labels
    await expect(page.locator('.kpi-card__label', { hasText: 'Total a Pagar (Aberto)' })).toBeVisible();
    await expect(page.locator('.kpi-card__label', { hasText: 'Contas Vencidas' })).toBeVisible();
    await expect(page.locator('.kpi-card__label', { hasText: 'Vencem Hoje' })).toBeVisible();
    await expect(page.locator('.kpi-card__label', { hasText: 'Total Pago no Mês' })).toBeVisible();
  });

  test('2. Table rendering without layout clipping or horizontal breakdown', async ({ page }) => {
    await page.goto('/contas-a-pagar');
    await expect(page.getByRole('heading', { level: 1, name: /Contas a Pagar/i })).toBeVisible({ timeout: 15000 });

    // Verify ClayTable / table container
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify table headers
    const headerRow = table.locator('thead tr');
    await expect(headerRow).toBeVisible();
    await expect(headerRow.getByText('Descrição')).toBeVisible();
    await expect(headerRow.getByText('Fornecedor')).toBeVisible();
    await expect(headerRow.getByText('Vencimento')).toBeVisible();
    await expect(headerRow.getByText('Valor', { exact: true })).toBeVisible();

    // Verify table rows are rendered
    const tableRows = table.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible();
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);

    // Check table bounding box to ensure no zero-width or clipped dimensions
    const box = await table.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(300);
      expect(box.height).toBeGreaterThan(100);
    }
  });

  test('3. Interactive filter dropdowns, search input, and status pills', async ({ page }) => {
    await page.goto('/contas-a-pagar');
    await expect(page.getByRole('heading', { level: 1, name: /Contas a Pagar/i })).toBeVisible({ timeout: 15000 });

    // 1. Status Filter Pills
    const allPill = page.locator('.filter-pill', { hasText: 'Todas as Contas' });
    const pendingPill = page.locator('.filter-pill', { hasText: 'Pendentes' });
    const overduePill = page.locator('.filter-pill', { hasText: 'Vencidas' });

    await expect(allPill).toBeVisible();
    await expect(pendingPill).toBeVisible();
    await expect(overduePill).toBeVisible();

    // Click "Pendentes" and verify active state
    await pendingPill.click();
    await expect(pendingPill).toHaveClass(/active/);

    // Click "Todas as Contas" and verify active state returns
    await allPill.click();
    await expect(allPill).toHaveClass(/active/);

    // 2. Search Input interaction
    const searchInput = page.getByPlaceholder(/Buscar conta ou fornecedor/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Fertilizante');
    await expect(searchInput).toHaveValue('Fertilizante');
    await searchInput.clear();

    // 3. Supplier Filter Dropdown interaction
    const supplierSelect = page.locator('select').first();
    if (await supplierSelect.isVisible()) {
      const options = await supplierSelect.locator('option').allTextContents();
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toContain('Todos os Fornecedores');
    }
  });
});
