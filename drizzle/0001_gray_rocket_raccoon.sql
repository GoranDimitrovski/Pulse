--> data migration: outstanding reset tokens predate tenant_id and have no value to backfill
--> from that the NOT NULL add would accept. They are single-use and expire in an hour, so
--> dropping them just means anyone mid-reset requests a new link.
DELETE FROM "password_reset_tokens";--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
