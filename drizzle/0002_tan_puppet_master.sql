ALTER TABLE "audit_logs" ADD COLUMN "user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "entity_type" varchar(100);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "entity_id" uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "overdraft_limit" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD COLUMN "matched_transaction_ids" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD CONSTRAINT "crop_seasons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD CONSTRAINT "crop_seasons_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery" ADD CONSTRAINT "machinery_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payables" ADD CONSTRAINT "payables_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;