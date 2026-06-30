-- AlterTable
ALTER TABLE "MediaFile" ADD COLUMN IF NOT EXISTS "data" BYTEA;
UPDATE "MediaFile" SET "data" = '\x'::bytea WHERE "data" IS NULL;
ALTER TABLE "MediaFile" ALTER COLUMN "data" SET NOT NULL;
