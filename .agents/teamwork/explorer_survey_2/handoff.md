# Handoff Report: Test Suite Status, Vitest Environment, Playwright E2E, and Stress Testing

**Agent**: `explorer_survey_2`  
**Milestone**: Phase 0 Codebase Survey  
**Working Directory**: `h:/Code/Pessoais/Farm-Fin/.agents/teamwork/explorer_survey_2`  
**Scope**: Vitest environment & unit test status, business module test coverage & gap analysis, Playwright E2E testing setup, and Autocannon/Node stress testing setup.

---

## 1. Observation

### 1.1 Package & Configuration Inspection
- In `package.json`:
  - Lines 46, 57-58:
    ```json
    "vitest": "^4.1.10",
    ...
    "scripts": {
      "test": "vitest run",
      "test:watch": "vitest",
      ...
    }
    ```
  - Vitest, `@testing-library/react` (16.3.2), `@testing-library/jest-dom` (7.0.1), `jsdom` (30.0.1), and `@vitejs/plugin-react` (6.0.5) are declared in `devDependencies`.
  - `@playwright/test` and `autocannon` are **NOT** present in `dependencies` or `devDependencies`.
  - There are no scripts defined for E2E or stress testing.

- In `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
  ```
- In `vitest.setup.ts`:
  ```ts
  import '@testing-library/jest-dom';
  ```

### 1.2 Initial Execution & Verbatim Error Output
- Running `npm test` before environment resolution produced the following verbatim failure:
  ```text
  > farm-fin@1.0.0 test
  > vitest run

  'vitest' não é reconhecido como um comando interno
  ou externo, um programa operável ou um arquivo em lotes.
  ```
- Running `npx vitest run` directly resulted in unresolved import errors:
  ```text
  vitest.config.ts (1:294) [UNRESOLVED_IMPORT] Could not resolve 'vitest/config' in vitest.config.ts
  vitest.config.ts (2:18) [UNRESOLVED_IMPORT] Could not resolve '@vitejs/plugin-react' in vitest.config.ts

  failed to load config from H:\Code\Pessoais\Farm-Fin\vitest.config.ts

  ⎯⎯⎯⎯⎯⎯⎯ Startup Error ⎯⎯⎯⎯⎯⎯⎯⎯
  Error: Cannot find module 'vitest/config'
  Require stack:
  - H:\Code\Pessoais\Farm-Fin\vitest.config.ts
  - C:\Users\lives\AppData\Local\npm-cache\_npx\69c381f8ad94b576\node_modules\vite\dist\node\chunks\node.js
  ```
- Running `npm ls --depth=0` confirmed that dependencies were missing or unlinked:
  - Missing: `vitest@^4.1.10`, `@vitejs/plugin-react@^6.0.5`, `@testing-library/react@^16.3.2`, `better-auth@^1.6.27`, `drizzle-orm@^0.45.2`, `drizzle-kit@^0.31.10`, `react@^19.0.0`, `react-dom@^19.0.0`, `typescript@^5.9.3`, `tsx@^4.23.12`.

### 1.3 Vitest Suite Execution After Dependency Resolution (`npm install`)
- Running `npm test` after installing packages produced:
  ```text
  (!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
    - ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1). Use a `.mjs` extension or set `"type": "module"` in the closest package.json
  Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.

   RUN  v4.1.10 H:/Code/Pessoais/Farm-Fin

   Test Files  26 passed (26)
        Tests  137 passed (137)
     Start at  15:45:08
     Duration  83.05s (transform 18.82s, setup 150.17s, import 471.72s, tests 3.69s, environment 218.56s)
  ```
- Stderr observations during test execution:
  - Several Server Action tests logged DB connection failure warnings:
    `[updateMachinery] DB update fallback: DrizzleQueryError: Failed query: ... cause: ECONNREFUSED`
  - Several tests logged:
    `[getVerifiedSession] Better Auth session lookup failed: Error: headers was called outside a request scope.`
  - The tests passed because server actions (`src/actions/*`) are implemented with graceful try/catch fallbacks returning optimistic mock data when running in offline/testing environments without a live PostgreSQL database.

### 1.4 Business Module Inventory & Test Mapping

| Category | Existing Test Files | Modules / Functions Covered | Uncovered Areas (Gaps) |
|---|---|---|---|
| **Financial Calculations** | `src/actions/__tests__/finance.test.ts`<br>`src/actions/__tests__/dre.test.ts`<br>`src/actions/__tests__/costs.test.ts`<br>`src/actions/__tests__/conciliacao.test.ts`<br>`src/actions/__tests__/lcdpr.test.ts`<br>`src/actions/__tests__/season-comparison.test.ts`<br>`src/lib/__tests__/agingUtils.test.ts` | Payables/Receivables CRUD, Barter contracts, Hedge contracts & price fixing, Ton-to-bag conversions, Cash flow reports (monthly/weekly/daily/annual), DRE (season, talhão, monthly breakdown, EBITDA, Net Profit), Agronomic costs, LCDPR ledger formatting, Season comparison metrics, Aging calculation. | `src/actions/banking.ts` (bank account transfers, balance calculations) has **no tests**.<br>Export calculation utils (`src/lib/exportDREExcel.ts`, `src/lib/exportExcel.ts`, `src/lib/exportKardexExcel.ts`, `src/lib/exportDREPdf.ts`) have **no unit tests**.<br>Zero/negative boundary division handling. |
| **Alerts & Thresholds** | `src/lib/__tests__/financeAlerts.test.ts`<br>`src/lib/__tests__/stockAlerts.test.ts`<br>`src/components/dashboard/__tests__/ExecutiveAlertsPanel.test.tsx` | Due date alert classification (`vencido`, `hoje`, `ate_3_dias`, `ate_7_dias`), due date summary aggregation, stock tiers (`zerado`, `critico`, `minimo`, `atencao`), expiration alerts (`vencendo_30d/60d/90d`), suggested reorder math, UI component rendering. | `src/actions/machinery.ts` maintenance alerts have no dedicated tests.<br>Alert notification dispatch retry/failure paths in `sendDueDateAlertsNotificationAction`. |
| **Permissions (RBAC)** | **None** | No dedicated test suite exists for permissions. | **Major Gap**: `src/lib/permissions.ts` (defines 5 roles: `Produtor`, `Gestor`, `Financeiro`, `Contador`, `Operador` and 12 modules: `dashboard`, `cadastros`, `contas-a-pagar`, `contas-a-receber`, `fluxo-de-caixa`, `conciliacao`, `estoque`, `custos`, `dre`, `lcdpr`, `configuracoes`, `processador-nf`) has **0 tests**.<br>`src/lib/permissionGuard.ts` (`requireModuleAccess`) has **0 tests**.<br>`src/lib/useModuleGuard.ts` has **0 tests**. |
| **Session Handling & Auth** | `src/actions/__tests__/auth.test.ts`<br>`src/lib/__tests__/demoSession.test.ts`<br>`src/app/api/session/demo/__tests__/route.test.ts` | Registration schema parsing, optimistic user/tenant creation, demo session token signing/verifying/tampering, demo route handler. | No tests for username-based authentication (`authClient.signIn.username` / `auth.api.signInUsername`).<br>No tests for `src/lib/session.ts` (`getCurrentSession`, `getVerifiedSession`, `resolveBetterAuthSession`).<br>No test asserting rejection of demo cards on login screen. |

### 1.5 E2E & Playwright Findings
- Searching for `playwright` (`find_by_name`) returned **0 results**.
- No `playwright.config.ts` exists.
- In `src/app/(auth)/login/LoginScreen.tsx`:
  - Lines 477-498 contain the demo persona cards grid (`<div className={styles.personaGrid}>...</div>`), which must be removed per R1.
  - Lines 107-110 already include username vs email switching:
    ```ts
    const identifier = email.trim();
    const res = identifier.includes('@')
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier, password });
    ```
- In `src/app/(auth)/register/page.tsx`:
  - Does **not** yet have an input field for `username` (only name, email, organization, role, password).
  - `src/lib/validations/auth.schema.ts` does **not** include `username` in `registerSchema`.
- In `src/db/schema.ts`:
  - Lines 34-35 already define `username: varchar('username', { length: 100 }).unique()` and `displayUsername: varchar('display_username', { length: 100 })`.
- In `src/lib/auth.ts`:
  - Line 96 already registers the `username()` plugin in Better Auth.
- In `src/lib/auth-client.ts`:
  - Line 13 already registers the `usernameClient()` plugin.

### 1.6 Stress Testing Findings
- Searching for `autocannon` or stress scripts returned **0 results**.
- No `scripts/` directory exists in the project root.
- In `src/app/api/`:
  - `src/app/api/auth/[...all]/route.ts` exposes all Better Auth endpoints (`/api/auth/sign-in/username`, `/api/auth/sign-in/email`, `/api/auth/session`, `/api/auth/get-session`).
  - `src/app/api/session/demo/route.ts` exposes `POST /api/session/demo` with HMAC signing.
  - `src/app/api/ai/extrair-nf/route.ts` contains session verification, permission guard, and fixed-window rate limiting (`src/lib/rateLimit.ts` via in-memory KV or Cloudflare KV).

---

## 2. Logic Chain

1. **Test Environment Execution**:
   - Because `node_modules` was missing vital packages (`vitest`, `@vitejs/plugin-react`, etc.), `npm test` threw `'vitest' não é reconhecido...` and `npx vitest` failed with `MODULE_NOT_FOUND` for `vitest/config`.
   - Running `npm install` restored the required binaries and dependencies.
   - Vitest subsequently executed 26 test files and 137 tests with a 100% pass rate.
   - However, the execution duration was 83 seconds for 137 tests due to global `jsdom` initialization in `vitest.config.ts`, even for pure backend actions and logic tests.

2. **Unit Test Coverage Gaps**:
   - Core financial calculation actions (`finance.ts`, `dre.ts`, `costs.ts`, `conciliacao.ts`, `lcdpr.ts`, `season-comparison.ts`) and alerts (`financeAlerts.ts`, `stockAlerts.ts`) are well-covered for standard positive scenarios.
   - However, `src/lib/permissions.ts` defines the central authorization foundation of Farm-Fin (5 roles × 12 modules, `canViewModule`, `canManageModule`, `hasPermission`), yet has zero test files.
   - `src/actions/banking.ts` has zero tests.
   - Username authentication has zero unit tests.

3. **Playwright E2E Needs**:
   - Neither Playwright nor its test runner is installed.
   - To fulfill R3 and acceptance criteria, Playwright must be installed (`@playwright/test`), configured (`playwright.config.ts` running against `next dev`), and provided with 3 critical spec files:
     - `e2e/auth.spec.ts`: Login with email, login with username (`paraiba` / `melhorprofessor`), verify demo persona cards are absent, register with username.
     - `e2e/navigation.spec.ts`: Sidebar navigation across all 10 core modules, mobile viewport toggle.
     - `e2e/core-pages.spec.ts`: Rendering of KPI cards, tables, and financial reports without JavaScript errors or layout breakdowns.

4. **Stress Testing Needs**:
   - Neither Autocannon nor an automated stress runner exists.
   - A standalone Node/TypeScript runner (e.g. `scripts/stress-test.ts` or `scripts/stress-test.mjs`) using `autocannon` can benchmark:
     - Auth endpoints (`/api/auth/sign-in/username`, `/api/auth/get-session`)
     - Core SSR page routes (`/`, `/login`, `/contas-a-pagar`, `/dre`)
     - Rate-limited AI endpoint (`/api/ai/extrair-nf` to verify 429 response handling without service crash)
   - Metrics to track: Latency (avg, p50, p95, p99), Throughput (req/sec), and HTTP error rates under 10, 50, and 100 concurrent connections.

---

## 3. Caveats

- **No Live PostgreSQL in Test Runner**: Vitest runs without an active Postgres instance. Tests pass because server actions catch connection errors (`ECONNREFUSED`) and return mock/optimistic fallback structures. A live database test or integration test against Neon Local / Docker Postgres is not configured in unit tests.
- **Node.js Environment Speed**: Test suite duration is currently ~83s because `vitest.config.ts` uses `environment: 'jsdom'` globally. Using `// @vitest-environment node` on backend tests or separating workspaces can reduce run time to <15s.
- **Playwright Browser Binaries**: Installing Playwright in CI or local environments requires downloading the Chromium browser binary (`npx playwright install chromium`).

---

## 4. Conclusion & Recommended Action Plan

### 4.1 Vitest & Unit Test Enhancements
1. **Fix Vite Config Warning**: Rename `vitest.config.ts` to `vitest.config.mts` or configure Vitest explicitly to avoid the CJS/ESM deprecation warning.
2. **Implement Missing Permissions Unit Test Suite (`src/lib/__tests__/permissions.test.ts`)**:
   - Test all 5 roles (`Produtor`, `Gestor`, `Financeiro`, `Contador`, `Operador`) across all 12 modules for `view` and `manage`.
   - Test `PermissionError` class formatting and throwing.
   - Test server-side guard `src/lib/permissionGuard.ts` and client hook `src/lib/useModuleGuard.ts`.
3. **Implement Session & Username Unit Tests**:
   - `src/lib/__tests__/session.test.ts`: test `getCurrentSession`, `getVerifiedSession`, and role propagation.
   - `src/lib/validations/__tests__/auth.schema.test.ts`: validate updated `registerSchema` with `username` validation (alphanumeric, min 3, max 30 chars).
4. **Implement Banking Unit Tests (`src/actions/__tests__/banking.test.ts`)**:
   - Test bank account creation, balance calculation, and statement reconciliation.

### 4.2 Playwright E2E Setup
1. **Install Dependencies**:
   `npm install -D @playwright/test`
   `npx playwright install chromium`
2. **Create `playwright.config.ts`**:
   - Configure baseURL `http://localhost:3000`.
   - Configure `webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true }`.
   - Desktop and Mobile Viewport projects.
3. **Create E2E Test Suite in `e2e/`**:
   - `e2e/auth.spec.ts`: Verify credential login, username login (`paraiba`), invalid credential error feedback, absence of demo cards.
   - `e2e/navigation.spec.ts`: Authenticated navigation through sidebar modules.
   - `e2e/dashboard.spec.ts`: KPI cards, balance display, responsive layout.
4. **Add Script to `package.json`**:
   `"test:e2e": "playwright test"`

### 4.3 Autocannon Stress Testing Setup
1. **Install Dependency**:
   `npm install -D autocannon`
2. **Create `scripts/stress-test.ts` (or `.mjs`)**:
   - Benchmark 1: `GET /login` (HTML rendering throughput).
   - Benchmark 2: `POST /api/auth/sign-in/username` (Authentication throughput & latency).
   - Benchmark 3: `GET /api/auth/get-session` (Session cache & verification latency).
   - Benchmark 4: `GET /` & `GET /contas-a-pagar` (SSR page delivery under load).
   - Benchmark 5: `POST /api/ai/extrair-nf` (Rate limit burst resilience).
3. **Add Script to `package.json`**:
   `"test:stress": "tsx scripts/stress-test.ts"`

---

## 5. Verification Method

To independently verify the findings in this report:

1. **Verify Unit Test Suite Execution**:
   ```pwsh
   npm test
   ```
   *Expected outcome*: 26 test files executed, 137 passing tests. Observe stderr output regarding `ECONNREFUSED` and `headers()` scope warnings.

2. **Verify Absences of Playwright and Autocannon**:
   ```pwsh
   npm ls @playwright/test autocannon
   ```
   *Expected outcome*: `(empty)` - neither package is installed.

3. **Verify Absence of Permissions Unit Tests**:
   ```pwsh
   Test-Path src/lib/__tests__/permissions.test.ts
   Test-Path src/lib/__tests__/permissionGuard.test.ts
   ```
   *Expected outcome*: `False`.

4. **Verify Demo Cards on Login Screen**:
   Inspect `src/app/(auth)/login/LoginScreen.tsx` lines 477–498 to confirm the demo persona grid is still present.
