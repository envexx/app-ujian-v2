-- Migration: Change ujian from tanggal + waktuMulai + durasi to startUjian + endUjian
-- Step 1: Add new columns as nullable first
ALTER TABLE "ujian" ADD COLUMN "startUjian" TIMESTAMP(3);
ALTER TABLE "ujian" ADD COLUMN "endUjian" TIMESTAMP(3);

-- Step 2: Migrate existing data
-- Convert tanggal + waktuMulai to startUjian
-- Convert tanggal + waktuMulai + durasi to endUjian
UPDATE "ujian" 
SET 
  "startUjian" = (
    -- Combine tanggal (date part) with waktuMulai (time part)
    -- tanggal is a date, waktuMulai is a string like "08:00"
    -- We'll parse waktuMulai and combine with tanggal
    "tanggal" + 
    (CAST(SPLIT_PART("waktuMulai", ':', 1) AS INTEGER) || ' hours')::INTERVAL +
    (CAST(SPLIT_PART("waktuMulai", ':', 2) AS INTEGER) || ' minutes')::INTERVAL
  ),
  "endUjian" = (
    -- startUjian + durasi minutes
    "tanggal" + 
    (CAST(SPLIT_PART("waktuMulai", ':', 1) AS INTEGER) || ' hours')::INTERVAL +
    (CAST(SPLIT_PART("waktuMulai", ':', 2) AS INTEGER) || ' minutes')::INTERVAL +
    ("durasi" || ' minutes')::INTERVAL
  )
WHERE "tanggal" IS NOT NULL AND "waktuMulai" IS NOT NULL AND "durasi" IS NOT NULL;

-- Step 3: Make columns NOT NULL (now that data is migrated)
ALTER TABLE "ujian" ALTER COLUMN "startUjian" SET NOT NULL;
ALTER TABLE "ujian" ALTER COLUMN "endUjian" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "ujian" DROP COLUMN "tanggal";
ALTER TABLE "ujian" DROP COLUMN "waktuMulai";
ALTER TABLE "ujian" DROP COLUMN "durasi";

-- Step 5: Add indexes for new columns
CREATE INDEX IF NOT EXISTS "ujian_startUjian_idx" ON "ujian"("startUjian");
CREATE INDEX IF NOT EXISTS "ujian_endUjian_idx" ON "ujian"("endUjian");


