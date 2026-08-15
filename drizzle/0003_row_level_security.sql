-- Row-Level Security (RLS) - defense-in-depth multi-tenant isolation
-- ---------------------------------------------------------------------------
-- STATUS: inert by default, safe to run against production today.
--
-- This migration enables RLS and adds a per-organization policy on every
-- table that has a direct `organization_id` column, keyed off the Postgres
-- session GUC `app.current_org_id`:
--
--   USING (organization_id = current_setting('app.current_org_id', true)::uuid)
--
-- WHY IT IS SAFE TO RUN AS-IS: Postgres RLS does not apply to the table owner
-- unless `FORCE ROW LEVEL SECURITY` is also set, and this migration
-- deliberately does NOT set FORCE. The app currently connects to Neon as the
-- table-owning role via `@neondatabase/serverless`'s HTTP driver
-- (see src/db/index.ts), which has no session/transaction support
-- (`drizzle-orm/neon-http` throws "No transactions support in neon-http
-- driver"). Without transaction support there is no way for the app to set
-- `app.current_org_id` per request, so a FORCE'd policy would evaluate
-- `current_setting(...)` as NULL on every query and silently return zero
-- rows for everyone - a self-inflicted outage. Until that's wired up, these
-- policies stay dormant and every query keeps working exactly as before.
--
-- TO FULLY ACTIVATE THIS DEFENSE LAYER (follow-up work, not done here):
--   1. Create a dedicated, least-privileged Postgres role for the app that is
--      NOT the owner of these tables (e.g. `farmfin_app`), and grant it
--      SELECT/INSERT/UPDATE/DELETE explicitly.
--   2. Switch src/db/index.ts from `drizzle-orm/neon-http` to
--      `drizzle-orm/neon-serverless` (Pool-based, WebSocket) so the driver
--      supports real transactions - or adopt Neon RLS / "Neon Authorize"
--      (JWT-based `authToken` passed to `neon()`) so Postgres can read the
--      tenant claim straight from the request's JWT instead of a session GUC.
--   3. Have every server action run its queries inside a transaction that
--      starts with `SET LOCAL app.current_org_id = '<orgId>'` (or rely on the
--      JWT claim if using Neon RLS), using the app role from step 1.
--   4. Only then add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` for each
--      table below.
--
-- NOT COVERED HERE: child tables reached only through a parent's foreign key
-- (fields, crop_season_fields, payable_installments, payable_payments,
-- receivable_installments, receivable_payments, input_stocks, input_movements,
-- crops) don't carry their own organization_id column. Add subquery-based
-- policies for those (e.g. `farm_id IN (SELECT id FROM farms WHERE
-- organization_id = current_setting(...))`) as part of the same follow-up.

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "farms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crop_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receivables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "machinery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bank_statements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "input_products" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY "tenant_isolation" ON "users"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "user_roles"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "audit_logs"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "farms"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "crop_seasons"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "categories"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "suppliers"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "customers"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "bank_accounts"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "payables"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "receivables"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "stock_items"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "stock_movements"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "machinery"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "employees"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "bank_statements"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "input_products"
  USING ("organization_id" = current_setting('app.current_org_id', true)::uuid);
