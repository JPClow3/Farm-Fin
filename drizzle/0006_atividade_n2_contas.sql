CREATE TABLE "classificacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"descricao" varchar(150) NOT NULL,
	"status" varchar(10) DEFAULT 'ATIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimento_classificacao" (
	"movimento_id" integer NOT NULL,
	"classificacao_id" integer NOT NULL,
	CONSTRAINT "movimento_classificacao_movimento_id_classificacao_id_pk" PRIMARY KEY("movimento_id","classificacao_id")
);
--> statement-breakpoint
CREATE TABLE "movimento_contas" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"numero_nota_fiscal" varchar(50),
	"data_emissao" date,
	"descricao" text,
	"valor_total" numeric(14, 2) NOT NULL,
	"pessoa_id" integer NOT NULL,
	"faturado_id" integer,
	"status" varchar(10) DEFAULT 'ATIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parcela_contas" (
	"id" serial PRIMARY KEY NOT NULL,
	"movimento_id" integer NOT NULL,
	"identificacao" varchar(20) NOT NULL,
	"numero_parcela" integer DEFAULT 1 NOT NULL,
	"data_vencimento" date NOT NULL,
	"valor_parcela" numeric(14, 2) NOT NULL,
	"status" varchar(10) DEFAULT 'ATIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pessoas" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"razao_social" varchar(255) NOT NULL,
	"fantasia" varchar(255),
	"documento" varchar(14),
	"status" varchar(10) DEFAULT 'ATIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_classificacao" ADD CONSTRAINT "movimento_classificacao_movimento_id_movimento_contas_id_fk" FOREIGN KEY ("movimento_id") REFERENCES "public"."movimento_contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_classificacao" ADD CONSTRAINT "movimento_classificacao_classificacao_id_classificacao_id_fk" FOREIGN KEY ("classificacao_id") REFERENCES "public"."classificacao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_contas" ADD CONSTRAINT "movimento_contas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_contas" ADD CONSTRAINT "movimento_contas_pessoa_id_pessoas_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "public"."pessoas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_contas" ADD CONSTRAINT "movimento_contas_faturado_id_pessoas_id_fk" FOREIGN KEY ("faturado_id") REFERENCES "public"."pessoas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parcela_contas" ADD CONSTRAINT "parcela_contas_movimento_id_movimento_contas_id_fk" FOREIGN KEY ("movimento_id") REFERENCES "public"."movimento_contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pessoas" ADD CONSTRAINT "pessoas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "classificacao_org_tipo_descricao_uq" ON "classificacao" USING btree ("organization_id","tipo","descricao");--> statement-breakpoint
CREATE UNIQUE INDEX "pessoas_org_tipo_documento_uq" ON "pessoas" USING btree ("organization_id","tipo","documento") WHERE "pessoas"."documento" is not null;