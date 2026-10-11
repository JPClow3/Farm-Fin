# Farm-Fin Project Orchestration Plan

## Overview
Comprehensive plan to fulfill all requirements in `ORIGINAL_REQUEST.md`:
- R1: Auth & User Profile Cleanup (remove demo cards, username/email login, registration with username)
- R2: User Provisioning: 'paraiba' (melhorprofessor, Produtor role, seed scripts, dual login)
- R3: Test Suite Expansion (Vitest unit tests 100% pass, business logic coverage, Playwright E2E, Autocannon stress testing)
- R4: UI/UX Refinement & Polish (clay-morphism consistency, responsive layouts, feedback states, error boundaries)

## Phases & Milestones

### Phase 0: Survey & Scope Mapping
- **Action**: Spawn 3 parallel Explorers:
  - Explorer 1: Auth, Registration, Session, DB Schema, User Provisioning (`seed.ts`, `create-user.ts`)
  - Explorer 2: Test environment, Vitest setup, current test status, Playwright E2E setup, stress testing setup
  - Explorer 3: UI/UX architecture, Tailwind/clay-morphism styling, responsive layout, loading/error states
- **Output**: Synthesize into `PROJECT.md` with full Feature Inventory, Architecture, Code Layout, and Interface Contracts.

### Phase 1: Dual-Track Implementation & Testing
- **Track A (Implementation)**:
  - **Milestone 1**: Auth & User Provisioning (R1 & R2)
    - Loop: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate
  - **Milestone 2**: UI/UX Refinement & Polish (R4)
    - Loop: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate
  - **Milestone 3**: Unit Test Fixes & Module Expansion (R3.1, R3.2)
    - Loop: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate
- **Track B (E2E & Stress Testing)**:
  - **Milestone 4**: Automated E2E & Stress Testing (R3.3, R3.4)
    - Playwright E2E suite covering auth (email + username), dashboard navigation, core page rendering.
    - Autocannon stress test script with load benchmarking and reporting.
    - Loop: Explorer / Test Writer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor -> Gate
    - Output: `TEST_READY.md`

### Phase 2: Final Integration, E2E Acceptance & Adversarial Hardening
- Run full Vitest unit test suite (100% pass required).
- Run full Playwright E2E test suite (100% pass required).
- Run stress test benchmarking and record throughput/latency metrics.
- Adversarial hardening (Challengers + Worker + Reviewer).
- Final Forensic Audit verification.
- Victory claim and completion report to parent Sentinel.
