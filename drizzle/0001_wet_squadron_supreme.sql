ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PATIENT';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false;