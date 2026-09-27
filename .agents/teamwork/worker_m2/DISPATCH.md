## 2026-09-27T04:45:09Z

You are a Worker subagent executing Milestone 2 (UI/UX Refinement & Polish - R4) for Farm-Fin.
Your assigned working directory is:
h:/Code/Pessoais/Farm-Fin/.agents/teamwork/worker_m2

Authoritative user requirements:
h:/Code/Pessoais/Farm-Fin/.agents/teamwork/ORIGINAL_REQUEST.md

Project scope & architecture:
h:/Code/Pessoais/Farm-Fin/.agents/teamwork/orchestrator_1/PROJECT.md

UI/UX Explorer handoff report with line numbers, tokens, and component findings:
h:/Code/Pessoais/Farm-Fin/.agents/teamwork/explorer_survey_3/handoff.md

Challenger 1 handoff report (Defect D1 details):
h:/Code/Pessoais/Farm-Fin/.agents/teamwork/challenger_m1_1_gen2/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership (Exclusive to this milestone):
- `src/styles/tokens.css`
- `src/app/(auth)/register/page.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/app/contas-a-pagar/page.tsx`
- `src/app/contas-a-receber/page.tsx`
- `src/app/conciliacao/page.tsx`
- `src/app/cadastros/page.tsx`
- `src/components/charts/CrossSeasonChart.tsx`
- `src/lib/validations/auth.schema.ts`
- `src/actions/auth.ts`
- `src/actions/__tests__/auth.adversarial.test.ts` (if updating D1 test)

Milestone 2 Objectives:
1. Token & CSS Consolidation (Feature F5):
   - Define the 13 missing CSS custom properties in `src/styles/tokens.css`:
     * `--border-color: rgba(212, 201, 186, 0.5);`
     * `--border-subtle: rgba(212, 201, 186, 0.4);`
     * `--bg-surface: #ffffff;`
     * `--shadow-clay-card: var(--clay-shadow-md);`
     * Semantic numeric variables:
       `--color-success-500: var(--color-success);`, `--color-success-600: #4a8d2f;`, `--color-success-700: var(--color-success-dark);`
       `--color-danger-500: var(--color-danger);`, `--color-danger-600: #bc3e28;`, `--color-danger-700: var(--color-danger-dark);`
       `--color-warning-500: var(--color-warning);`, `--color-warning-600: #cf930e;`, `--color-warning-700: var(--color-warning-dark);`
       `--color-info-500: var(--color-info);`
2. Registration UI Clay-morphism Alignment (Feature F6):
   - Refactor `src/app/(auth)/register/page.tsx` to use design system tokens and Clay components (`ClayCard`, `ClayInput`, `ClayButton`).
   - Eliminate hardcoded raw hex colors (`#ffffff`, `#EAF3ED`, `#2A7A4C`, etc.).
   - Preserve all username registration logic, validations, and collision feedback from Milestone 1.
3. Interactive Feedback & Error Boundaries (Feature F7):
   - Standardize `EmptyState` in `contas-a-pagar`, `contas-a-receber`, and `conciliacao` when item lists are empty.
   - Standardize `ErrorState` with retry callbacks where fetch/mutation errors occur.
   - Use `ClayInput.error` for field-level error feedback on required forms.
   - In `CrossSeasonChart.tsx`, ensure tooltip rendering utilizes the defined `--bg-surface` and `--shadow-clay-card` tokens.
4. Mobile Responsiveness & Layout Refinements (Feature F8):
   - In `Header.tsx` and `Sidebar.tsx`, ensure safra selection is accessible on mobile screens (e.g. mobile drawer has a safra selector dropdown).
   - Fix header flex wrapping to maintain layout stability on intermediate tablet viewports.
5. Apply Defect D1 Remediation:
   - In `src/lib/validations/auth.schema.ts`, ensure `email: z.string().trim().toLowerCase().email(...)`.
   - In `src/actions/auth.ts`, ensure `existingUser.email.toLowerCase() !== email.toLowerCase()`.
6. Remove stray file `console.log(123)` from repository root if present.
7. Verification:
   - Run `npm test` (all tests must pass).
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npm run lint` (0 errors).
   - Run `npm run build` (production build must succeed).
8. Reporting:
   - Write comprehensive handoff report to `h:/Code/Pessoais/Farm-Fin/.agents/teamwork/worker_m2/handoff.md`.
   - Notify orchestrator via send_message when complete.
