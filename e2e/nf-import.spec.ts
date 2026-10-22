import { test, expect } from '@playwright/test';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import { hashPassword } from 'better-auth/crypto';

const databaseUrl = process.env.FARMFIN_E2E_DATABASE_URL;

test.describe('NF: revisão e gravação em banco isolado', () => {
  test.skip(!databaseUrl, 'Requer FARMFIN_E2E_DATABASE_URL apontando para um banco isolado.');
  let pool: Pool;
  test.beforeAll(() => {
    if (databaseUrl?.includes('ep-frosty-scene-acz4585p'))
      throw new Error('Banco de produção recusado');
    pool = new Pool({ connectionString: databaseUrl, max: 1 });
  });
  test.afterAll(async () => {
    await pool?.end();
  });

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`${viewport.name}: OCR, correção, PDF, catálogo, cadastro conjunto e lançamento`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.setTimeout(180000);
      if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname))
        throw new Error('Este teste só grava em ambiente local isolado');
      const org = randomUUID(),
        user = randomUUID(),
        suffix = user.slice(0, 8);
      const username = `nf.ux.${suffix}`,
        password = randomBytes(24).toString('hex');
      const company = `Empresa X ${suffix}`;
      const product = `Parafuso sextavado M10 para manutenção do equipamento agrícola ${suffix}`;
      const note = {
        fornecedor: { razaoSocial: company, cnpj: '123' },
        faturado: { nomeCompleto: 'Produtor de teste', cpf: '123' },
        numeroNotaFiscal: `UX-${suffix}`,
        dataEmissao: '2026-10-22',
        descricaoProdutos: [product, `Porca ${suffix}`],
        quantidadeParcelas: 1,
        parcelas: [{ numero: 1, dataVencimento: '2026-11-22', valor: 100 }],
        dataVencimento: '2026-11-22',
        valorTotal: 100,
        tipoDespesa: 'MANUTENÇÃO E OPERAÇÃO',
        classificacaoDespesa: ['MANUTENÇÃO E OPERAÇÃO'],
      };
      await pool.query('INSERT INTO organizations (id,name) VALUES ($1,$2)', [
        org,
        `NF UX ${suffix}`,
      ]);
      await pool.query(
        'INSERT INTO users (id,organization_id,name,email,username,display_username,email_verified,role) VALUES ($1,$2,$3,$4,$5,$5,true,$6)',
        [user, org, 'NF UX QA', `${username}@example.invalid`, username, 'Produtor']
      );
      await pool.query(
        'INSERT INTO accounts (id,user_id,account_id,provider_id,password) VALUES ($1,$2,$3,$4,$5)',
        [randomUUID(), user, user, 'credential', await hashPassword(password)]
      );
      await pool.query('INSERT INTO user_roles (user_id,organization_id,role) VALUES ($1,$2,$3)', [
        user,
        org,
        'PROPRIETARIO',
      ]);
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/login');
      await page.getByLabel('E-mail ou usuário').fill(username);
      await page.getByLabel('Senha', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Entrar', exact: true }).click();
      await expect(page).not.toHaveURL(/\/login/);
      await page.goto('/atividades/processador-nf');

      // Real authentication and persistence; controlled OCR makes every state repeatable.
      let extractions = 0;
      await page.route('**/api/ai/extrair-nf', async (route) => {
        extractions++;
        await route.fulfill({ json: { success: true, data: note } });
      });
      const upload = async () => {
        await page.getByLabel('Selecionar PDF da nota fiscal').setInputFiles({
          name: 'exemplo-danfe.pdf',
          mimeType: 'application/pdf',
          buffer: readFileSync('public/exemplo-danfe.pdf'),
        });
        await page.getByRole('button', { name: 'Extrair dados da nota', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Confira os dados da nota' })).toBeVisible();
      };
      await upload();
      await expect(page.getByText('3 cadastro(s) para resolver', { exact: true })).toBeVisible();
      const supplierDocument = page.getByLabel('CPF/CNPJ do fornecedor', { exact: true });
      await expect(supplierDocument).toHaveAttribute('aria-invalid', 'true');
      await page
        .getByRole('link', { name: 'Informe um CPF/CNPJ válido para o fornecedor.' })
        .first()
        .click();
      await expect(supplierDocument).toBeFocused();
      await expect(supplierDocument).toHaveAccessibleDescription(
        'Informe um CPF/CNPJ válido para o fornecedor.'
      );
      await supplierDocument.fill('11.222.333/0001-81');
      await page.getByLabel('CPF/CNPJ do destinatário', { exact: true }).fill('529.982.247-25');
      await page.getByRole('button', { name: 'Consultar cadastros', exact: true }).click();
      await expect(page.getByText('3 cadastro(s) para resolver', { exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Ver PDF', exact: true }).click();
      const pdf = page.getByRole('dialog', { name: 'PDF original da nota' });
      await expect(pdf).toBeVisible();
      const pdfPage = pdf.getByRole('img', { name: 'Página 1 do PDF original', exact: true });
      await expect(pdfPage).toHaveAttribute('data-rendered', 'true');
      expect(
        await pdfPage.evaluate((element: HTMLCanvasElement) => {
          const pixels = element
            .getContext('2d')!
            .getImageData(0, 0, element.width, element.height).data;
          for (let i = 0; i < pixels.length; i += 4)
            if (pixels[i] < 200 && pixels[i + 1] < 200 && pixels[i + 2] < 200) return true;
          return false;
        })
      ).toBe(true);
      await pdf.getByText('Texto da página', { exact: true }).click();
      await expect(pdf.getByText(/AUTO POSTO/, { exact: false }).last()).toBeVisible();
      await pdf.getByText('Texto da página', { exact: true }).click();
      const originalWidth = await pdfPage.evaluate((element: HTMLCanvasElement) => element.width);
      await pdf.getByRole('button', { name: 'Ampliar PDF', exact: true }).click();
      await expect
        .poll(() => pdfPage.evaluate((element: HTMLCanvasElement) => element.width))
        .toBeGreaterThan(originalWidth);
      await pdf.getByRole('button', { name: 'Reduzir PDF', exact: true }).click();
      await expect(pdfPage).toHaveAttribute('data-rendered', 'true');
      await page.screenshot({ path: testInfo.outputPath('pdf-preview.png') });
      await page.keyboard.press('Escape');
      await expect(pdf).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Ver PDF', exact: true })).toBeFocused();

      await page.getByRole('button', { name: 'Trocar nota', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Descartar esta nota?' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar conferência' }).click();
      await expect(supplierDocument).toHaveValue('11.222.333/0001-81');
      await page.getByRole('link', { name: 'Abrir catálogo de produtos', exact: true }).click();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await expect(page.getByText('Nenhum registro encontrado.', { exact: true })).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({ path: testInfo.outputPath('empty-catalog.png'), fullPage: true });
      await page.getByRole('link', { name: 'Ler nota fiscal', exact: true }).click();
      await expect(supplierDocument).toHaveValue('11.222.333/0001-81');
      await expect(page.getByLabel('Produto 1', { exact: true })).toHaveValue(product);
      await expect(page.getByText('3 cadastro(s) para resolver', { exact: true })).toBeVisible();
      expect(extractions).toBe(1);
      await expect(
        page.getByRole('checkbox', { name: 'Conferi os dados com o PDF' })
      ).not.toBeChecked();

      await page.getByRole('checkbox', { name: 'Conferi os dados com o PDF' }).check();
      await page.getByRole('button', { name: 'Cadastrar empresa e produtos', exact: true }).click();
      await expect(
        page.getByText('Empresa e produtos já cadastrados', { exact: true })
      ).toBeVisible();
      const counts = await pool.query(
        'SELECT (SELECT count(*) FROM pessoas WHERE organization_id=$1) AS pessoas,(SELECT count(*) FROM produtos WHERE organization_id=$1) AS produtos,(SELECT count(*) FROM movimento_contas WHERE organization_id=$1) AS movimentos',
        [org]
      );
      expect(counts.rows[0]).toEqual({ pessoas: '1', produtos: '2', movimentos: '0' });
      await page.screenshot({ path: testInfo.outputPath('registered.png'), fullPage: true });
      await page.getByRole('button', { name: 'Lançar conta a pagar', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Nota lançada com sucesso' })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('success.png'), fullPage: true });
      const launched = await pool.query(
        'SELECT m.id,(SELECT count(*) FROM movimento_produto p WHERE p.movimento_id=m.id) AS produtos FROM movimento_contas m WHERE m.organization_id=$1',
        [org]
      );
      expect(launched.rows).toHaveLength(1);
      expect(launched.rows[0].produtos).toBe('2');
      await page.getByRole('link', { name: 'Ver conta a pagar', exact: true }).click();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await expect(
        page.getByRole('row').filter({ hasText: new RegExp(company, 'i') })
      ).toBeVisible();
      await page.goBack();
      await expect(page.getByRole('heading', { name: 'Nota lançada com sucesso' })).toBeVisible();
      await page.getByRole('button', { name: 'Ler outra nota', exact: true }).click();
      note.fornecedor.cnpj = '11.222.333/0001-81';
      note.faturado.cpf = '529.982.247-25';
      await upload();
      await expect(page.getByText(/Esta nota já foi lançada/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Lançar conta a pagar' })).toHaveCount(0);
      await page.getByRole('link', { name: 'Abrir catálogo de produtos', exact: true }).click();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await expect(page.getByRole('cell').filter({ hasText: product.toUpperCase() })).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({ path: testInfo.outputPath('catalog.png'), fullPage: true });

      await page.getByRole('button', { name: 'Notificações e Alertas', exact: true }).press('Tab');
      const accountMenu = page.getByRole('button', { name: 'Menu da conta', exact: true });
      await expect(accountMenu).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('button', { name: 'Sair (Encerrar Sessão)' })).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Configurações & RBAC' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(accountMenu).toBeFocused();
      await expect(accountMenu).toHaveAttribute('aria-expanded', 'false');
      expect(errors).toEqual([]);
    });
  }
});
