# Project: Farm-Fin

## Architecture
- **Framework**: Next.js 15.5 (App Router, Server Actions, Route Handlers) + React 19 + TypeScript.
- **Styling**: Pure CSS Design Tokens and Clay-morphism architecture (`src/styles/tokens.css`, `src/styles/components.css`, `src/app/globals.css`). No Tailwind CSS.
- **Database & ORM**: PostgreSQL via Neon, Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`).
- **Authentication**: Better Auth v1.6.27 (`username` plugin, `magicLink`, `twoFactor`) + fallback server-signed HMAC-SHA256 demo session (`farmfin_session` cookie).
- **Unit Testing**: Vitest (`vitest.config.ts`, `@testing-library/react`, `jsdom`).
- **E2E Testing**: Playwright (`@playwright/test`, `playwright.config.ts`, `e2e/`).
- **Load Testing**: Autocannon Node-based benchmark runner (`scripts/stress-test.ts`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Remove Demo Persona Cards | Remove persona cards ("Conhecer o sistema") grid, demo handlers, and CSS from `LoginScreen.tsx` and `login.module.css` | M1 | ORIGINAL_REQUEST §R1 |
| F2 | Dual Username / Email Login | Cleanly accept username or email address with input normalization (`.trim().toLowerCase()`), pre-submit validation, and clear feedback | M1 | ORIGINAL_REQUEST §R1 |
| F3 | Registration with Username Definition | Update `registerSchema` in `auth.schema.ts`, `registerUserAction` in `actions/auth.ts`, and `register/page.tsx` UI with unique username input and collision checking | M1 | ORIGINAL_REQUEST §R1 |
| F4 | User Provisioning ('paraiba') | Seed user `paraiba` (password `melhorprofessor`, role `Produtor`, email `paraiba@farm-fin.com`) into `SEED_USERS` in `src/db/seed.ts` and `src/db/create-user.ts` with dual login | M1 | ORIGINAL_REQUEST §R2 |
| F5 | Design System Tokens & Undefined Variables Fix | Define the 13 missing CSS custom properties in `src/styles/tokens.css` (`--border-color`, `--bg-surface`, `--border-subtle`, `--shadow-clay-card`, semantic numeric colors) | M2 | Survey Explorer 3 & ORIGINAL_REQUEST §R4 |
| F6 | Registration Page Clay-morphism Alignment | Refactor `src/app/(auth)/register/page.tsx` to use design system tokens and Clay components (`ClayCard`, `ClayInput`, `ClayButton`), eliminating inline styles | M2 | Survey Explorer 3 & ORIGINAL_REQUEST §R4 |
| F7 | Interactive Feedback & Error Boundaries | Standardize `EmptyState`, `ErrorState`, `SkeletonTable`, and field-level `ClayInput.error` validation feedback across key financial views | M2 | ORIGINAL_REQUEST §R4 |
| F8 | Mobile Responsiveness & Layout Refinements | Fix header overflow and ensure safra selection is accessible for mobile viewports | M2 | ORIGINAL_REQUEST §R4 |
| F9 | Test Environment & Script Resolution | Fix `package.json` test scripts (`npm test`) and resolve Vitest configuration / warnings so `npm test` runs with 100% pass rate | M3 | ORIGINAL_REQUEST §R3 |
| F10 | Business Module Unit Test Expansion | Expand Vitest unit tests covering RBAC permissions (`src/lib/permissions.ts`), banking actions (`src/actions/banking.ts`), and session/auth username handling | M3 | ORIGINAL_REQUEST §R3 |
| F11 | Automated Playwright E2E Suite | Install `@playwright/test`, create `playwright.config.ts`, and implement specs for authentication (email and username login for 'paraiba'), navigation, and rendering | M4 | ORIGINAL_REQUEST §R3 |
| F12 | Autocannon Stress Testing Suite | Install `autocannon`, create benchmark runner script `scripts/stress-test.ts` targeting auth, session, and SSR routes, logging latency and throughput | M4 | ORIGINAL_REQUEST §R3 |
| F13 | 100% E2E Verification & Adversarial Hardening | Execute full E2E test suite against implementation, verify all acceptance criteria, perform adversarial hardening and forensic integrity audit | M5 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Auth & User Provisioning | F1, F2, F3, F4 | none | DONE (Verified: 199 tests passed, tsc 0, build 17/17, CLEAN audit) |
| M2 | UI/UX Refinement & Polish | F5, F6, F7, F8 | M1 | DONE (Verified: 0 undefined tokens, Clay registration, feedback states, mobile safra, build 17/17) |
| M3 | Unit Test Suite Expansion | F9, F10 | M1 | DONE (Verified: 35/35 test suites, 485/485 tests passed, 100% pass rate) |
| M4 | E2E & Stress Test Suite | F11, F12 | none (independent test track) | DONE (Verified: 14/14 Playwright E2E tests passed, Autocannon up to 432 req/s, TEST_READY.md published) |
| M5 | Final Acceptance & Adversarial Hardening | F13 | M1, M2, M3, M4 | READY |

## Interface Contracts

### Auth Credentials Contract (M1 - COMPLETED)
- Input: `identifier` (string, min 3 chars, email format or alphanumeric username `/^[a-zA-Z0-9._-]+$/`).
- Normalization: `identifier.trim().toLowerCase()`.
- Dispatch:
  - If `identifier.includes('@')`: `authClient.signIn.email({ email: identifier, password })`.
  - Else: `authClient.signIn.username({ username: identifier, password })`.
- Feedback:
  - If 401/400: "Usuário ou senha incorretos. Confira e tente de novo."
  - Empty or invalid format: inline field error on input.

### Registration Schema Contract (M1 - COMPLETED)
- `registerSchema`:
  - `name`: string, min 2 chars.
  - `username`: string, min 3, max 30, regex `/^[a-zA-Z0-9._-]+$/`, transformed via `.toLowerCase()`.
  - `email`: string, valid email, transformed via `.toLowerCase()`.
  - `password`: string, min 6 chars.
  - `organizationName`: string, min 2 chars.
  - `role`: enum `['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador']`.

### Provisioned User Contract (M1 - COMPLETED)
- Username: `paraiba`
- Display Username: `paraiba`
- Email: `paraiba@farm-fin.com`
- Password: `melhorprofessor`
- Role: `Produtor` (Proprietário)
- Organization: `Fazenda Santa Fé`

### Design System Tokens Contract (M2 - COMPLETED)
- All 13 missing custom properties defined in `src/styles/tokens.css`.
- 0 undefined CSS variables across all source files.
- Registration aligned to Clay components and tokens (0 raw hex colors).
- Mobile safra accessible via drawer selector.

### E2E Testing Contract (M4 - COMPLETED)
- Test Command: `npx playwright test` (or `npm run test:e2e`)
- 4 spec files: `e2e/auth.spec.ts`, `e2e/navigation.spec.ts`, `e2e/core-pages.spec.ts`, `e2e/login.e2e.ts`.
- 14 tests passing, exit code 0.

### Stress Testing Contract (M4 - COMPLETED)
- Test Command: `npm run test:stress`
- 5 scenarios benchmarked:
  - `GET /login`: 8.0 req/s
  - `POST /api/auth/sign-in/username`: 2.6 req/s
  - `GET /api/auth/get-session`: 4.2 req/s
  - `GET /`: 212.0 req/s (p50: 22ms)
  - `GET /contas-a-pagar`: 432.0 req/s (p50: 20ms)
- 0 crashes, 0 fatal 5xx errors.

## Code Layout
- `src/app/(auth)/login/LoginScreen.tsx`: Login credentials form & mode switcher.
- `src/app/(auth)/login/login.module.css`: Login screen styles.
- `src/app/(auth)/register/page.tsx`: Registration page with Clay components.
- `src/lib/validations/auth.schema.ts`: Auth schemas (Zod).
- `src/actions/auth.ts`: Server action for user registration.
- `src/actions/__tests__/auth.test.ts`: Auth unit test suite.
- `src/db/schema.ts`: Database schema.
- `src/db/seed.ts`: Seed users and initial data.
- `src/db/create-user.ts`: User provisioning CLI script.
- `src/lib/types.ts`: TypeScript definitions.
- `src/styles/tokens.css`: Design tokens and CSS custom properties.
- `src/lib/permissions.ts`: RBAC permission matrix.
- `src/lib/__tests__/permissions.test.ts`: Permissions unit tests.
- `src/actions/banking.ts` & `src/actions/__tests__/banking.test.ts`: Banking actions and tests.
- `playwright.config.ts` & `e2e/`: E2E test configuration and specs.
- `scripts/stress-test.ts`: Autocannon stress testing runner.
- `TEST_READY.md`: Test readiness and execution attestation.
