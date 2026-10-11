# Milestone 1 Review & Adversarial Challenge Report

**Milestone**: M1 (Auth & User Provisioning)  
**Reviewer**: Reviewer 2 (`reviewer_m1_2`)  
**Roles**: Reviewer & Adversarial Critic  
**Date**: 2026-09-26T23:55:00Z  
**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**

---

## 1. Observation

Direct examination of the codebase, git working tree diffs, TypeScript typechecker, and Vitest test suite execution revealed the following verifiable facts:

### 1.1 Integrity Violation Audit
- **Source Code Integrity**: Inspected `src/app/(auth)/login/LoginScreen.tsx`, `src/actions/auth.ts`, `src/lib/loginIdentifier.ts`, and `src/db/create-user.ts`. There are **no hardcoded bypasses**, no dummy facade implementations, and no shortcuts faking authentication success for 'paraiba' or any other user. Authentication delegates directly to `authClient.signIn.username` / `authClient.signIn.email` using Better Auth's registered plugins.
- **Verification Integrity**: All 156 unit tests across 29 test files were executed via `npm test` (`npx vitest run --fileParallelism=false`) and passed cleanly without simulated or fabricated test reports. `npx tsc --noEmit` exited with code 0 (0 type errors).

### 1.2 Requirement R1: Authentication & User Profile Cleanup
- **Demo Persona Card Removal**:
  - `src/app/(auth)/login/LoginScreen.tsx`: Completely stripped of the persona selector cards ("Conhecer o sistema") and mock role picker shortcuts. Only real credential inputs are rendered.
  - `src/app/(auth)/login/login.module.css`: All obsolete CSS classes (`.personaGrid`, `.personaCard`, `.personaHeader`, `.personaBadge`, etc.) have been removed. Preserves responsive card layout and design tokens.
  - `src/app/(auth)/login/LoginScreen.test.tsx` line 36–42 verifies `queryByText(/perfis de demonstração|acessar como|acesso por perfil|Professor Paraíba/i)` is not in the document.
- **Dual Login (Username and Email)**:
  - `src/lib/loginIdentifier.ts` implements `normalizeLoginIdentifier(input: string)`:
    - Normalizes with `.trim().toLowerCase()`.
    - If input contains `@`, validates against Zod email schema (`z.string().email()`). Returns `{ type: 'email', value }` on success, or `{ type: 'invalid', message: 'Informe um e-mail válido ou um nome de usuário.' }` on failure.
    - If input does not contain `@`, validates length (3–30 chars) and regex `/^[a-z0-9._-]+$/`. Returns `{ type: 'username', value }` or descriptive failure message.
  - `LoginScreen.tsx` (lines 85–125): Dispatches dynamically to `authClient.signIn.email` or `authClient.signIn.username` based on identifier type.
  - Clear user feedback: displays `"Informe sua senha."`, `"Informe seu e-mail ou nome de usuário."`, or `"Usuário ou senha incorretos. Confira e tente de novo."` on 400/401 HTTP response.
- **Registration with Unique Username**:
  - `src/lib/validations/auth.schema.ts` (`registerSchema`): Enforces `username` between 3 and 30 characters, alphanumeric with '.', '-', '_', normalized via `.trim().toLowerCase()`.
  - `src/app/(auth)/register/page.tsx`: Collects `username` with real-time lowercase sanitization (`e.target.value.toLowerCase().replace(/\s/g, '')`), client-side validation, and passes `username` to both Better Auth (`authClient.signUp.email`) and the tenant creation action (`registerUserAction`).
  - Distinct collision messaging: explicitly differentiates between `"Este nome de usuário já está em uso. Escolha outro."` and `"Este e-mail já está cadastrado. Tente fazer login."` (lines 118–121).
  - `src/actions/auth.ts`: `registerUserAction` validates via `registerSchema`, queries existing user via `or(equals(u.email, email), equals(u.username, username))`, updates `username` and `displayUsername` on `schema.users`, and assigns the organization.

### 1.3 Requirement R2: User Provisioning ('paraiba')
- **Seed Data (`src/db/seed.ts`)**:
  - User `paraiba` is seeded in `SEED_USERS` (lines 51–57):
    - `id`: `'u0000000-0000-4000-8000-000000000005'`
    - `organizationId`: `DEFAULT_ORG_ID` (`'a0000000-0000-4000-8000-000000000001'`)
    - `name`: `'Professor Paraíba'`
    - `username`: `'paraiba'`
    - `email`: `'paraiba@farm-fin.com'`
    - `role`: `'Produtor'`
- **CLI Provisioning Script (`src/db/create-user.ts`)**:
  - Exposes modular `provisionUser(options: ProvisionUserOptions)`.
  - CLI parser defaults:
    - `username`: `'paraiba'`
    - `password`: `process.env.FARMFIN_CREATE_USER_PASSWORD || 'melhorprofessor'`
    - `name`: `'Professor Paraíba'`
    - `email`: `'paraiba@farm-fin.com'`
    - `role`: `'Produtor'`
  - Idempotent: checks for existing user by username/email, updates user attributes, and provisions role `'PROPRIETARIO'` in `schema.userRoles`.
  - Tested in `src/db/__tests__/create-user.test.ts` to ensure programmatic invocation enforces a secret password when credentials are omitted.

### 1.4 Type System & Configuration
- `src/lib/types.ts`: `User` interface includes `username?: string | null;` (line 8).
- `package.json`: Vitest test script configured with `--fileParallelism=false`, eliminating thread starvation on Windows environments.

---

## 2. Logic Chain

1. **R1 Fulfillment**:
   - The deletion of the demo persona selector cards from `LoginScreen.tsx` and related styles from `login.module.css` eliminates unauthorized mock profile shortcuts.
   - The integration of `normalizeLoginIdentifier` guarantees deterministic separation between email and username inputs before dispatching to Better Auth API methods.
   - The addition of the `username` field in `registerSchema`, `RegisterForm`, and `registerUserAction` enforces unique username registration across both authentication provider and database tables.

2. **R2 Fulfillment**:
   - The inclusion of user `paraiba` in `SEED_USERS` guarantees that mock/demo session fallbacks recognize the user with role `Produtor`.
   - The default CLI configuration in `create-user.ts` enables automated provisioning of `paraiba` (`melhorprofessor`, `Produtor`, `PROPRIETARIO`).
   - Because the user row stores both `username: 'paraiba'` and `email: 'paraiba@farm-fin.com'`, the unified login screen allows logging in via either identifier.

3. **Adversarial Robustness**:
   - Stress-testing input variations (leading/trailing whitespace, uppercase characters, mixed casing) proves that normalization occurs before database queries and auth client calls.
   - Malformed inputs (empty fields, short passwords, invalid regex characters) are caught prior to network dispatch and accompanied by accessible error messages.

---

## 3. Adversarial Challenges & Findings

### Challenge 1: Identifier Collisions & Parsing Boundaries (Passed)
- **Attack Scenario**: Entering an identifier such as `paraiba@farm` (looks like an email but has an incomplete domain) or `user with spaces`.
- **Observed Behavior**: `normalizeLoginIdentifier` detects `@` and tests `z.string().email()`. Because `paraiba@farm` fails email syntax, it is marked `invalid` with the error `"Informe um e-mail válido ou um nome de usuário."`, preventing malformed payloads from hitting Better Auth. Unacceptable username characters are rejected with a clear constraint alert.

### Challenge 2: Case-Insensitive Matching in Database (Passed)
- **Attack Scenario**: User registers as `Paraiba` and attempts to log in as `paraiba` or `PARAIBA`.
- **Observed Behavior**: Both registration schema (`registerSchema`) and login handler (`normalizeLoginIdentifier`) call `.toLowerCase()`. All usernames are persisted in lowercase, preventing case-sensitive collation mismatch bugs in PostgreSQL.

### Challenge 3: Registration Two-Phase Atomicity (Acceptable / Non-blocking)
- **Attack Scenario**: Better Auth user creation succeeds, but subsequent `registerUserAction` fails (e.g. database disconnect).
- **Blast Radius**: The user account exists in Better Auth, but the tenant organization/farm association was not completed.
- **Observed Mitigation**: If the user tries to register again, Better Auth reports `already exists`, and the UI indicates the user is already registered. If the user then logs in, `session.ts` provides fallback to `DEFAULT_ORG_ID`.
- **Recommendation**: In a future enhancement milestone, consider introducing a background reconciliation job or atomic saga for orphaned Better Auth users.

### Minor Finding: Untracked Stray File
- **Location**: `console.log(123)` in project root.
- **Impact**: Zero runtime effect; an empty stray file created during previous terminal commands.
- **Suggestion**: Remove before final release commit.

---

## 4. Caveats

- **Live Database Provisioning**: Running `npm run db:create-user` requires a reachable PostgreSQL server (Neon). In local development environments without an active connection, the script fails safely with `ECONNREFUSED` without corrupting state.
- **Clay-morphism Migration**: As defined in `PROJECT.md`, the registration page (`register/page.tsx`) currently uses inline styles with design tokens; migration to full `ClayCard` / `ClayInput` classes is scheduled for Milestone 2 (`M2`).

---

## 5. Conclusion

Worker M1 Generation 2 has fulfilled all requirements for Milestone 1:
1. Demo persona cards have been cleanly removed from `LoginScreen.tsx`.
2. Dual login (username and email) is fully implemented with validation and feedback.
3. Registration supports unique username collection and collision handling.
4. User `paraiba` is provisioned across `seed.ts` and `create-user.ts`.
5. TypeScript type checking (`npx tsc --noEmit`) passes with 0 errors.
6. Vitest test suite (`npm test`) passes 100% (29 files, 156 tests).
7. Zero integrity violations detected.

**Final Verdict**: **APPROVE** (Milestone 1 is ready for merge and M2 hand-off).

---

## 6. Verification Method

To independently reproduce and verify this review:

1. **Run TypeScript Compilation**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Exit code 0, 0 errors.

2. **Run Vitest Test Suite**:
   ```bash
   npm test
   ```
   *Expected*: 29 test files passed, 156 tests passed, exit code 0.

3. **Verify Auth Unit Tests Directly**:
   ```bash
   npx vitest run src/actions/__tests__/auth.test.ts src/app/\(auth\)/login/LoginScreen.test.tsx src/lib/__tests__/loginIdentifier.test.ts src/db/__tests__/create-user.test.ts
   ```
   *Expected*: 4 test files passed, 23 tests passed.

4. **Verify User Provisioning Code**:
   - Inspect `src/db/seed.ts` lines 50–58 for user `paraiba`.
   - Inspect `src/db/create-user.ts` lines 154–165 for default `username: 'paraiba'`, `password: 'melhorprofessor'`.
