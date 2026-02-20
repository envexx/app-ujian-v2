-- CreateTable
CREATE TABLE "info_masuk" (
    "id" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMasuk" TEXT NOT NULL,
    "jamPulang" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_masuk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "info_masuk_hari_key" ON "info_masuk"("hari");

-- CreateIndex
CREATE INDEX "info_masuk_hari_idx" ON "info_masuk"("hari");

-- AlterTable
-- Add tipe column with default value
ALTER TABLE "presensi" ADD COLUMN "tipe" TEXT DEFAULT 'masuk';

-- Update existing records to have 'masuk' as default
UPDATE "presensi" SET "tipe" = 'masuk' WHERE "tipe" IS NULL;

-- Make tipe NOT NULL
ALTER TABLE "presensi" ALTER COLUMN "tipe" SET NOT NULL;

-- CreateIndex
CREATE INDEX "presensi_tipe_idx" ON "presensi"("tipe");

-- Drop existing unique constraint
DROP INDEX IF EXISTS "presensi_siswaId_tanggal_key";

-- Create new unique constraint with tipe
CREATE UNIQUE INDEX "presensi_siswaId_tanggal_tipe_key" ON "presensi"("siswaId", "tanggal", "tipe");

