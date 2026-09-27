# Original User Request

## 2026-09-26T18:37:44Z

Farm-Fin: Refactor authentication to remove demo profile cards and support username-based login/registration, provision user 'paraiba' (password: melhorprofessor), expand test coverage (Vitest unit tests, Playwright E2E tests, Autocannon/Node stress tests), and polish UI/UX consistency across the application.

Working directory: h:/Code/Pessoais/Farm-Fin
Integrity mode: development

## Requirements

### R1. Authentication & User Profile Cleanup
- Remove the demo persona cards ("Conhecer o sistema") from the login page (`src/app/(auth)/login/LoginScreen.tsx`).
- Ensure the login form cleanly accepts username as well as email address with proper validation and user feedback.
- Update registration (`src/app/(auth)/register/page.tsx` and related validation schema / server action) to support defining a unique username during sign up.

### R2. User Provisioning: 'paraiba'
- Create and persist user with username `paraiba`, password `melhorprofessor`, role `Produtor` (Proprietário), seeded in the database and seed scripts (`src/db/seed.ts` and `src/db/create-user.ts`).
- Ensure the user can log in via both username `paraiba` and corresponding email.

### R3. Test Suite Expansion (Unit, E2E, Stress)
- Resolve test environment setup so all unit tests run and pass cleanly via Vitest (`npm test`).
- Expand unit test coverage across business modules: financial calculations, alerts, permissions, and session handling.
- Implement an automated Playwright End-to-End (E2E) test suite covering authentication (email and username login), dashboard navigation, and core page rendering.
- Implement an Autocannon / Node-based stress test script benchmarking concurrent load against API endpoints, authentication, and session handling.

### R4. UI/UX Refinement & Polish
- Polish visual design: spacing, typography, clay-morphism component consistency, and mobile responsiveness.
- Improve interactive feedback: loading states, error boundaries, form validation tooltips, and empty states across key views.

## Acceptance Criteria

### Authentication & Users
- [ ] Login screen displays only credential inputs without demo persona selector cards.
- [ ] User can log in with username `paraiba` and password `melhorprofessor`.
- [ ] Username input is fully supported and validated in login and registration workflows.

### Testing & Verification
- [ ] `npm test` executes Vitest unit tests with 100% pass rate and enhanced coverage.
- [ ] Playwright E2E test suite executes and passes for critical user flows.
- [ ] Stress testing script executes concurrent loads and reports latency/throughput metrics.

### UI/UX
- [ ] Layouts render cleanly across mobile and desktop without visual glitches, overflow, or clipping.
- [ ] Consistent feedback states (loading skeletons, spinners, contextual alerts) are displayed throughout.
