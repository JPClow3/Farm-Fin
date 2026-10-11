# E2E Test Infra: Farm-Fin

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation internal design.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinations + Real-World Workload Testing.

## Feature Inventory Mapping
| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Real-World) |
|---|---------|--------|:----------------:|:-----------------:|:--------------:|:-------------------:|
| F1 | Remove Demo Cards | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | Dual Login (Email/Username) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F3 | Registration with Username | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F4 | User Provisioning ('paraiba') | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F7 | UI/UX & Feedback States | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Framework: Playwright (`@playwright/test`)
- Execution command: `npx playwright test`
- Pass/Fail semantics: Exit code 0, all tests pass.
- Stress testing: `autocannon` runner (`scripts/stress-test.ts`) reporting throughput, p50, p95, p99 latency.

## Real-World Application Scenarios (Tier 4)
1. Complete onboarding flow: Register new producer with username -> verify redirect -> log out -> log in with newly created username -> verify dashboard.
2. Dual login verification: Log in as 'paraiba' using username -> inspect profile and permissions -> log out -> log in using 'paraiba@farm-fin.com' -> inspect profile.
3. Mobile viewport flow: Simulate iPhone/Android viewport -> verify absence of demo cards on login -> authenticate -> navigate via bottom navigation -> open mobile drawer -> verify responsive layout.
4. Resilience under load: Concurrent login and session requests under 20+ concurrent connections without application crash.
