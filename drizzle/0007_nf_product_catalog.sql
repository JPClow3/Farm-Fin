CREATE TABLE "movimento_produto" (
	"movimento_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	CONSTRAINT "movimento_produto_movimento_id_produto_id_pk" PRIMARY KEY("movimento_id","produto_id")
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"descricao" varchar(500) NOT NULL,
	"status" varchar(10) DEFAULT 'ATIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimento_produto" ADD CONSTRAINT "movimento_produto_movimento_id_movimento_contas_id_fk" FOREIGN KEY ("movimento_id") REFERENCES "public"."movimento_contas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimento_produto" ADD CONSTRAINT "movimento_produto_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "produtos_org_descricao_uq" ON "produtos" USING btree ("organization_id","descricao");