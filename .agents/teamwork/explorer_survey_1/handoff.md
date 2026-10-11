# Phase 0 Codebase Survey: Authentication, Registration, User Provisioning & Database Seeding

**Author**: Explorer Subagent  
**Date**: 2026-09-26  
**Target Project**: Farm-Fin (`h:/Code/Pessoais/Farm-Fin`)  
**Scope**: Authentication & Profile Cleanup (R1), User Provisioning 'paraiba' (R2), Auth Architecture & Test Environment Baseline (R3)

---

## Executive Summary
Farm-Fin uses **Better Auth v1.6.27** (with Drizzle ORM PostgreSQL adapter and `username` plugin) alongside a custom HMAC-SHA256 demo session system. While the database schema and Better Auth configuration already support usernames, the UI and registration workflows have not surfaced username creation or enforced username validation, and the login screen still features demo persona selector buttons that bypass credential verification. Provisioning user `paraiba` (password: `melhorprofessor`, role: `Produtor`) requires updating `SEED_USERS` in `src/db/seed.ts`, adding default arguments and idempotency to `src/db/create-user.ts`, updating the registration schema/action/UI, and adjusting `package.json` test scripts for clean Windows execution where all 26 test suites (137 tests) currently pass.

---

## 1. Observation

### 1.1 Login Screen & Demo Persona Selector Cards
* **File**: `src/app/(auth)/login/LoginScreen.tsx`
  * **Imports**:
    * Line 25: `import { SEED_USERS } from '@/db/seed';`
    * Lines 8-12: `Tractor`, `FileSpreadsheet`, `Wallet`, `UserCheck` imported from `lucide-react`.
  * **Demo Persona Artifacts**:
    * Lines 33–39: `ROLE_LABELS: Record<UserRoleType, string>` mapping `Produtor` to `'Proprietário'`, `Gestor` to `'Gestor da fazenda'`, etc.
    * Lines 41–47: `ROLE_ICONS: Record<UserRoleType, React.ReactNode>` mapping roles to Lucide icons.
    * Lines 199–220: Handler function `handleDemoLogin(role: UserRoleType, personaEmail: string)` making a `POST` request to `/api/session/demo` with `{ role, email: personaEmail }` and saving to `localStorage.setItem('farmfin_active_user', ...)`.
    * Lines 477–498: JSX rendering the divider `<div className={styles.divider}>Conhecer o sistema</div>`, container `<div className={styles.personaGrid}>`, mapping over `SEED_USERS`, and helper text `<p className={styles.demoHint}>`.
* **File**: `src/app/(auth)/login/login.module.css`
  * Lines 262–333: CSS classes `.personaGrid`, `.persona`, `.persona:hover:not(:disabled)`, `.persona:disabled`, `.personaIcon`, `.personaText`, `.personaName`, `.personaRole`, `.demoHint`.

### 1.2 Credential Submission & Dual Login Handling
* **File**: `src/app/(auth)/login/LoginScreen.tsx`
  * **State**:
    * Line 74: `const [email, setEmail] = useState('');` (used as identifier for both username and email).
    * Line 75: `const [password, setPassword] = useState('');`.
  * **Submission Logic** (lines 101–130):
    ```tsx
    const handlePasswordLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage('');
      setPending('password');
      try {
        // O mesmo campo aceita e-mail ou nome de usuário
        const identifier = email.trim();
        const res = identifier.includes('@')
          ? await authClient.signIn.email({ email: identifier, password })
          : await authClient.signIn.username({ username: identifier, password });
        if (res.error) {
          setErrorMessage(
            res.error.status === 401 || res.error.status === 400
              ? 'Usuário ou senha incorretos. Confira e tente de novo.'
              : 'Não foi possível entrar agora. Tente novamente em instantes.'
          );
          return;
        }
        if (res.data && 'twoFactorRedirect' in res.data && res.data.twoFactorRedirect) {
          switchMode('twoFactor');
          return;
        }
        if (res.data && 'user' in res.data) saveActiveUser(res.data.user);
        finishLogin();
      } catch {
        setErrorMessage('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      } finally {
        setPending(null);
      }
    };
    ```
  * **Input Field** (lines 362–378):
    ```tsx
    <div className={styles.field}>
      <label htmlFor="login-email" className="input-label">
        {mode === 'magicLink' ? 'E-mail' : 'E-mail ou usuário'}
      </label>
      <input
        id="login-email"
        type={mode === 'magicLink' ? 'email' : 'text'}
        className="input"
        placeholder={mode === 'magicLink' ? 'seu.nome@fazenda.com.br' : 'seu.nome@fazenda.com.br ou usuário'}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>
    ```
  * **Observed Deficiencies**:
    1. Case sensitivity: If the user inputs `Paraiba` with capital 'P', `username` lookup fails against stored `paraiba` unless normalized with `.toLowerCase()`.
    2. Missing pre-submit format validation and granular error messaging for empty or malformed inputs.
    3. State naming and input IDs are legacy (`email`, `login-email`, `setEmail`) instead of generic identifier names (`identifier`, `login-identifier`).

### 1.3 Registration Workflows & Validation
* **File**: `src/lib/validations/auth.schema.ts`
  * Lines 3–12:
    ```ts
    export const registerSchema = z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      email: z.string().email('E-mail inválido'),
      password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      organizationName: z
        .string()
        .min(2, 'Nome da fazenda/empresa é obrigatório')
        .default('Fazenda Santa Fé'),
      role: z.enum(['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador']).default('Produtor'),
    });
    ```
  * **Deficiency**: Schema completely lacks a `username` field.
* **File**: `src/actions/auth.ts`
  * Line 42: `const { name, email, role, organizationName } = validated.data;`
  * Lines 57–67:
    ```ts
    const [newUser] = await db
      .insert(schema.users)
      .values({
        name,
        email,
        role,
        organizationId: orgId,
        emailVerified: true,
      })
      .returning();
    ```
  * **Deficiency**: Does NOT insert `username` or `displayUsername` into `schema.users`. Does NOT check for unique username collisions prior to insert.
* **File**: `src/app/(auth)/register/page.tsx`
  * Lines 28–34: State hooks define `name`, `email`, `password`, `confirmPassword`, `organizationName`, `role`. No `username` state exists.
  * Line 91: `const authRes = await authClient.signUp.email({ email, password, name });` — does not pass `username`.
  * Lines 109–115: `registerUserAction({ name, email, password, organizationName, role })` — does not pass `username`.
  * Lines 247–587: Form inputs do not contain an input field for username.
* **File**: `src/actions/__tests__/auth.test.ts`
  * Lines 7–13 & lines 36–42: Unit tests instantiate `validData` and `input` without `username`. Updating `registerSchema` to require `username` will break these tests unless updated.

### 1.4 Database Schema, Migrations, Seed & CLI Provisioning
* **File**: `src/db/schema.ts`
  * Lines 28–42:
    ```ts
    export const users = pgTable('users', {
      id: uuid('id').primaryKey().defaultRandom(),
      organizationId: uuid('organization_id').references(() => organizations.id),
      name: varchar('name', { length: 255 }).notNull(),
      email: varchar('email', { length: 255 }).notNull().unique(),
      username: varchar('username', { length: 100 }).unique(),
      displayUsername: varchar('display_username', { length: 100 }),
      emailVerified: boolean('email_verified').default(false),
      image: text('image'),
      role: varchar('role', { length: 50 }).default('Produtor').notNull(),
      twoFactorEnabled: boolean('two_factor_enabled').default(false),
      createdAt: timestamp('created_at').defaultNow().notNull(),
      updatedAt: timestamp('updated_at').defaultNow().notNull(),
    });
    ```
  * Lines 95–105: Table `userRoles` maps `userId`, `organizationId`, and `role: varchar('role', { length: 50 })` ('PROPRIETARIO', 'ADMIN', 'GESTOR', 'FINANCEIRO', 'CONTADOR', 'OPERADOR').
* **Migration**: `drizzle/0005_username_login.sql`
  * Lines 1–3:
    ```sql
    ALTER TABLE "users" ADD COLUMN "username" varchar(100);--> statement-breakpoint
    ALTER TABLE "users" ADD COLUMN "display_username" varchar(100);--> statement-breakpoint
    ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
    ```
  * Confirms the database already has the unique constraint on `username`.
* **File**: `src/db/seed.ts`
  * Lines 21–50: `SEED_USERS` contains four users:
    1. `antonio@fazendasantafe.com.br` (`Produtor`)
    2. `marina@fazendasantafe.com.br` (`Gestor`)
    3. `carlos.contador@agrocontabil.com.br` (`Contador`)
    4. `juliana.financeiro@fazendasantafe.com.br` (`Financeiro`)
  * `SEED_USERS` does NOT include `paraiba`.
  * `src/lib/types.ts` (lines 3–10): `User` interface does not declare `username?: string | null`.
* **File**: `src/db/create-user.ts`
  * CLI script using `auth.api.signUpEmail`:
    ```ts
    const username = values.username.trim().toLowerCase();
    const result = await auth.api.signUpEmail({
      body: {
        email: values.email || `${username}@usuarios.farm-fin.com`,
        password: values.password,
        name: values.name || username,
        username,
        role: values.role,
        organizationId: SEED_ORGANIZATION.id,
      },
    });
    ```
  * Requires explicit CLI arguments (`--username` and `--password`). Does not default to `paraiba` / `melhorprofessor`. Fails if the user already exists rather than updating/idempotently confirming.

### 1.5 Auth Architecture, Sessions, JWT & Cookies
* **Framework**: **Better Auth v1.6.27** (`better-auth`) with `@/db` PostgreSQL Drizzle adapter. Not NextAuth or Auth.js.
* **Server Plugin Pipeline** (`src/lib/auth.ts`):
  * `magicLink()`: 5-minute token expiry.
  * `twoFactor()`: TOTP issuer `'Farm-Fin'`.
  * `username()`: Built-in Better Auth username plugin.
  * `session.cookieCache`: 5-minute cache.
* **Client Plugin Pipeline** (`src/lib/auth-client.ts`):
  * `magicLinkClient()`
  * `twoFactorClient()`
  * `usernameClient()`: Adds `signIn.username({ username, password })` and accepts `username` in `signUp.email`.
* **Dual Session System** (`src/lib/session.ts` & `src/lib/demoSession.ts`):
  1. **Better Auth Session**: Resolved via `auth.api.getSession({ headers })`. Cookies checked: `better-auth.session_token`, `__Secure-better-auth.session_token`, `neon_auth.session_token`, `__Secure-neon_auth.session_token`.
  2. **Server-Signed Demo Session**: Stored in httpOnly cookie `farmfin_session`. HMAC-SHA256 signed using `BETTER_AUTH_SECRET` (or dev fallback). Verified via Web Crypto API in edge/node runtimes.
* **Middleware** (`src/middleware.ts`):
  * Checks cookie presence (`hasSession = hasBetterAuthCookie || hasDemoSession`).
  * Unauthenticated requests to protected paths redirect to `/login?from=<pathname>`.
  * Logged-in demo sessions navigating to `/login` or `/register` redirect to `/`.

### 1.6 Test Suite Execution & Diagnostics
* Command `npm test`:
  * Output: `'vitest' não é reconhecido como um comando interno ou externo, um programa operável ou um arquivo em lotes.`
  * Cause: `node_modules/.bin` does not contain the `vitest.cmd` shim on Windows.
* Command `npx vitest run`:
  * Exit Code: `0`
  * Output:
    * `Test Files: 26 passed (26)`
    * `Tests: 137 passed (137)`
    * Total test duration: ~100s.
  * All existing business logic tests (aging, DRE, LCDPR, finance alerts, recurrence approval, stock alerts, reconciliations, session signing, schemas) are passing cleanly.

---

## 2. Logic Chain

```
[Observation 1.1: Persona Cards]
  ├── Demo cards bypass credentials via POST /api/session/demo
  └── R1 Acceptance Criteria: Login screen displays ONLY credential inputs
        ⟹ Remove persona markup, icons, handlers, and styles from LoginScreen.tsx & login.module.css

[Observation 1.2: Dual Login in LoginScreen.tsx]
  ├── authClient.signIn.username exists via usernameClient() plugin
  ├── Current code splits by '@': identifier.includes('@') ? signIn.email : signIn.username
  └── Potential bug: Case-sensitive username input (e.g. 'Paraiba') vs stored lowercase 'paraiba'
        ⟹ Normalize identifier: identifier.trim().toLowerCase()
        ⟹ Add pre-flight validation (empty checks, username format warnings)
        ⟹ Refactor state names from `email` to `identifier` for clarity

[Observation 1.3: Registration Flow & Schemas]
  ├── registerSchema lacks `username` definition
  ├── register/page.tsx form has no username input
  ├── registerUserAction does not persist `username` to schema.users
  └── R1/R2 Requirement: Support defining unique username on sign-up
        ⟹ Add `username` to registerSchema (min 3, max 30, regex /^[a-zA-Z0-9._-]+$/)
        ⟹ Update RegisterInput interface & register/page.tsx UI
        ⟹ Pass username to both authClient.signUp.email & registerUserAction
        ⟹ Add uniqueness validation check against schema.users
        ⟹ Update actions/__tests__/auth.test.ts to supply `username`

[Observation 1.4: Database Seeding & User Provisioning]
  ├── schema.users already has unique `username` and `display_username` columns
  ├── SEED_USERS in src/db/seed.ts does not include 'paraiba'
  ├── src/db/create-user.ts requires CLI parameters and is not idempotent
  └── R2 Requirement: Seed 'paraiba' (password: melhorprofessor, role: Produtor) for dual login
        ⟹ Update src/lib/types.ts User interface to include `username?: string | null`
        ⟹ Add 'paraiba' to SEED_USERS in src/db/seed.ts (email: 'paraiba@farm-fin.com', role: 'Produtor')
        ⟹ Update src/db/create-user.ts with defaults ('paraiba' / 'melhorprofessor') & idempotency
        ⟹ Provision 'paraiba' in database with Better Auth hashed credential in `accounts` table

[Observation 1.6: Test Suite Setup]
  ├── `npm test` fails because Windows npm expects node_modules/.bin/vitest.cmd
  └── `npx vitest run` succeeds with 26/26 files passed (137/137 tests)
        ⟹ Update package.json "test": "npx vitest run" or fix npm binary links
        ⟹ Expand unit tests for auth action username handling & login normalization
```

### Risk Analysis & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Breaking Existing Tests** (`actions/__tests__/auth.test.ts`) | High (test regression) | When adding `username` to `registerSchema`, immediately update `auth.test.ts` fixtures (`validData` and `input`) to include valid `username` strings. |
| **Case Sensitivity Mismatch** | Medium (login failure) | Always `.trim().toLowerCase()` usernames both on registration/seeding and during login. Store `displayUsername` for presentation if desired. |
| **Missing DB in Test Runtimes** | Medium (network/connection error) | Server actions already implement graceful fallback when PostgreSQL is unreachable (`ECONNREFUSED`). Maintain this resilience while returning proper errors on real unique constraint conflicts. |
| **Better Auth User Conflict Error Parsing** | Medium (vague UI error) | In `register/page.tsx`, check both `authRes.error.message` and status code (422 / conflict) for username vs email duplication to provide specific feedback ("Nome de usuário já em uso" vs "E-mail já cadastrado"). |
| **Demo Session Remaining in Cookies** | Low (auth confusion) | Ensure `handlePasswordLogin` clears any stale `farmfin_session` cookie if present, preventing mixed session states. |

---

## 3. Caveats

1. **Local Live Database Connection**:
   - The repository is set up with open DB connections via `src/db/index.ts` connecting to Neon/Postgres. During testing without a live PostgreSQL instance, Drizzle throws `ECONNREFUSED` which is caught by optimistic/mock fallback blocks in Server Actions.
   - For real end-to-end credential verification against Better Auth, a running database instance or Docker Postgres container / Neon DB URL is required so Better Auth can read/write the `users` and `accounts` tables.
2. **Next.js Dynamic Header Scope Warning**:
   - During unit tests in Vitest, calling server actions directly produces harmless stderr warnings: `Error: 'headers' was called outside a request scope`. This is caught cleanly by `src/lib/session.ts` line 96 without failing the tests.
3. **Playwright E2E & Stress Testing (R3)**:
   - Playwright and Autocannon dependencies are not yet installed in `package.json`. These belong to Phase 1 & 2 test expansion tasks.

---

## 4. Conclusion & Recommended Implementation Steps

The Farm-Fin codebase is architecturally well-prepared for dual username/email authentication because Better Auth's `username` plugin is already configured server-side and client-side, and the database schema has the required `username` unique column.

### Recommended Implementation Roadmap

#### Step 1: Login Screen Cleanup & Hardening (`src/app/(auth)/login/LoginScreen.tsx` & `login.module.css`)
1. Remove `SEED_USERS` import, `ROLE_LABELS`, `ROLE_ICONS`, unused Lucide icons (`Tractor`, `FileSpreadsheet`, `Wallet`, `UserCheck`).
2. Remove `handleDemoLogin` and the entire JSX section `<div className={styles.personaGrid}>...</div>`.
3. In `handlePasswordLogin`, normalize identifier with `identifier.trim().toLowerCase()`.
4. Rename state `email` to `identifier` (with placeholder `"seu.nome@fazenda.com.br ou usuário"`).
5. Add explicit validation feedback for empty identifier, empty password, or invalid username formatting before submission.
6. Clean up unused CSS rules in `src/app/(auth)/login/login.module.css`.

#### Step 2: Registration Workflow (`auth.schema.ts`, `actions/auth.ts`, `register/page.tsx`)
1. In `src/lib/validations/auth.schema.ts`:
   - Add `username: z.string().min(3, 'Nome de usuário deve ter no mínimo 3 caracteres').max(30).regex(/^[a-zA-Z0-9._-]+$/, 'Apenas letras, números, pontos, hífens e sublinhados').transform(v => v.trim().toLowerCase())`.
2. In `src/actions/auth.ts`:
   - Accept `username` in `registerUserAction`.
   - Perform uniqueness verification against `schema.users` (checking both `email` and `username`).
   - Insert `username` and `displayUsername` into `schema.users`.
3. In `src/app/(auth)/register/page.tsx`:
   - Add `username` state and input field with user icon and real-time guidance.
   - Pass `username` to `authClient.signUp.email({ email, password, name, username })` and `registerUserAction`.
   - Handle duplicate username error messages from Better Auth and Server Actions.
4. In `src/actions/__tests__/auth.test.ts`:
   - Update `validData` and `input` objects to include `username`. Add unit test cases for invalid username rejection.

#### Step 3: User Provisioning ('paraiba') & Seeding (`src/db/seed.ts`, `src/db/create-user.ts`, `src/lib/types.ts`)
1. In `src/lib/types.ts`:
   - Add `username?: string | null` to `interface User`.
2. In `src/db/seed.ts`:
   - Add `paraiba` to `SEED_USERS`:
     ```ts
     {
       id: 'u0000000-0000-4000-8000-000000000000',
       organizationId: DEFAULT_ORG_ID,
       name: 'Professor Paraíba',
       username: 'paraiba',
       email: 'paraiba@farm-fin.com',
       role: 'Produtor',
     }
     ```
3. In `src/db/create-user.ts`:
   - Default CLI options: username `'paraiba'`, password `'melhorprofessor'`, name `'Professor Paraíba'`, email `'paraiba@farm-fin.com'`, role `'Produtor'`.
   - Add idempotency check: if user already exists, update record/password or report existing status without crashing.
   - Also insert `userRoles` record with role `'PROPRIETARIO'`.
   - Export helper function `provisionDefaultUser()` for test and script execution.

#### Step 4: Test Environment & Script Fixes (`package.json`)
1. In `package.json`:
   - Change `"test": "vitest run"` to `"test": "npx vitest run"` (or run `npm rebuild` / reinstall binaries) so `npm test` works out of the box on Windows.
2. Add `"db:seed": "tsx src/db/create-user.ts"` to `scripts` in `package.json`.

---

## 5. Verification Method

### 5.1 Unit Tests Verification
Run Vitest to verify schemas, actions, and calculations:
```bash
npx vitest run
```
*Expected Result*: All 26 test suites pass, 100% pass rate.

### 5.2 Specific Auth Action Tests
Run only the auth test suite:
```bash
npx vitest run src/actions/__tests__/auth.test.ts
```
*Expected Result*: Validates `registerSchema` with valid username, rejects invalid username, executes `registerUserAction`, and fetches session.

### 5.3 Provisioning Verification
Run the user creation script:
```bash
npm run db:create-user
```
*Expected Result*: Logs creation/confirmation of user `paraiba` with role `Produtor`.

### 5.4 Dual Login Invalidation Conditions
The implementation will be considered INVALID if:
1. The login page still displays the demo persona cards or "Conhecer o sistema" button grid.
2. Logging in with username `paraiba` (or `Paraiba`) and password `melhorprofessor` fails.
3. Logging in with email `paraiba@farm-fin.com` and password `melhorprofessor` fails.
4. Registration allows submitting duplicate usernames or rejects valid usernames with alphanumeric characters.
5. `npm test` fails with unrecognized command or failing test assertions.
