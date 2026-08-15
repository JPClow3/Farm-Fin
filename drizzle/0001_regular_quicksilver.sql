CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"document" varchar(50),
	"phone" varchar(50),
	"role" varchar(100) NOT NULL,
	"type" varchar(50) DEFAULT 'CLT' NOT NULL,
	"remuneration" real DEFAULT 0 NOT NULL,
	"additional_costs" real DEFAULT 0 NOT NULL,
	"hour_cost" real DEFAULT 0 NOT NULL,
	"admission_date" varchar(20),
	"status" varchar(50) DEFAULT 'Ativo' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "include_in_lcdpr" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "crop_season_fields" ADD COLUMN "variety" varchar(100);--> statement-breakpoint
ALTER TABLE "crop_season_fields" ADD COLUMN "planting_date" date;--> statement-breakpoint
ALTER TABLE "crop_season_fields" ADD COLUMN "expected_harvest_date" date;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD COLUMN "planting_date" date;--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD COLUMN "expected_harvest_date" date;--> statement-breakpoint
ALTER TABLE "crops" ADD COLUMN "variety" varchar(100);--> statement-breakpoint
ALTER TABLE "crops" ADD COLUMN "cycle_days" integer;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "cnpj_cpf" varchar(30);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "caepf" varchar(30);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "state_registration" varchar(50);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "nirf" varchar(50);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "sncr" varchar(50);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "address" varchar(255);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "exploitation_type" varchar(50) DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "declarant_percentage" real DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "participants_json" text;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "variety" varchar(100);--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "coordinates" varchar(255);--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "planting_date" date;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "expected_harvest_date" date;--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "brand" varchar(100);--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "model" varchar(100);--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "chassis" varchar(100);--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "machinery" ADD COLUMN "fuel_consumption" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "linked_receivable_id" uuid;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "is_barter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "barter_status" varchar(50) DEFAULT 'nenhum';--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "approval_status" varchar(50) DEFAULT 'aprovado' NOT NULL;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "approved_by" varchar(255);--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "approved_at" varchar(30);--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "recurrence_pattern" varchar(50) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "recurring_group_id" uuid;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "include_in_lcdpr" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "document_type" varchar(50) DEFAULT 'Nota Fiscal';--> statement-breakpoint
ALTER TABLE "payables" ADD COLUMN "document_number" varchar(100);--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "commodity_unit" varchar(20) DEFAULT 'sc' NOT NULL;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "quantity" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "linked_payable_id" uuid;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "barter_status" varchar(50) DEFAULT 'nenhum';--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "barter_exchange_rate" real;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "hedge_type" varchar(50) DEFAULT 'Nenhum';--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "price_fixing_status" varchar(50) DEFAULT 'fixado';--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "reference_index" varchar(100);--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "target_price" real;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "basis" real;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "strike_price" real;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "recurrence_pattern" varchar(50) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "recurring_group_id" uuid;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "include_in_lcdpr" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "document_type" varchar(50) DEFAULT 'Nota Fiscal / Recibo';--> statement-breakpoint
ALTER TABLE "receivables" ADD COLUMN "document_number" varchar(100);--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "batch_number" varchar(100);--> statement-breakpoint
ALTER TABLE "stock_items" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "batch_number" varchar(100);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;