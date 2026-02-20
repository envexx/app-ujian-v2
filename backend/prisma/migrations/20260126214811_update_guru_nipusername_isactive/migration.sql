/*
  Warnings:

  - You are about to drop the column `nip` on the `guru` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nipUsername]` on the table `guru` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nipUsername` to the `guru` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "guru_nip_idx";

-- DropIndex
DROP INDEX "guru_nip_key";

-- AlterTable - Add new column first
ALTER TABLE "guru" ADD COLUMN "nipUsername" TEXT;

-- Copy data from nip to nipUsername
UPDATE "guru" SET "nipUsername" = "nip";

-- Make nipUsername NOT NULL after data is copied
ALTER TABLE "guru" ALTER COLUMN "nipUsername" SET NOT NULL;

-- Add isActive column with default
ALTER TABLE "guru" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Drop old nip column
ALTER TABLE "guru" DROP COLUMN "nip";

-- CreateTable
CREATE TABLE "guru_kelas" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,

    CONSTRAINT "guru_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guru_kelas_guruId_kelasId_key" ON "guru_kelas"("guruId", "kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_nipUsername_key" ON "guru"("nipUsername");

-- CreateIndex
CREATE INDEX "guru_nipUsername_idx" ON "guru"("nipUsername");

-- AddForeignKey
ALTER TABLE "guru_kelas" ADD CONSTRAINT "guru_kelas_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru_kelas" ADD CONSTRAINT "guru_kelas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
