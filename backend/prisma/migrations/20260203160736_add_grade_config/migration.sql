/*
  Warnings:

  - You are about to drop the `nilai` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "nilai" DROP CONSTRAINT "nilai_guruId_fkey";

-- DropForeignKey
ALTER TABLE "nilai" DROP CONSTRAINT "nilai_mapelId_fkey";

-- DropForeignKey
ALTER TABLE "nilai" DROP CONSTRAINT "nilai_siswaId_fkey";

-- DropTable
DROP TABLE "nilai";

-- CreateTable
CREATE TABLE "grade_config" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "namaPG" TEXT NOT NULL DEFAULT 'Pilihan Ganda',
    "bobotPG" INTEGER NOT NULL DEFAULT 50,
    "activePG" BOOLEAN NOT NULL DEFAULT true,
    "namaEssay" TEXT NOT NULL DEFAULT 'Essay',
    "bobotEssay" INTEGER NOT NULL DEFAULT 50,
    "activeEssay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grade_config_guruId_key" ON "grade_config"("guruId");

-- CreateIndex
CREATE INDEX "grade_config_guruId_idx" ON "grade_config"("guruId");

-- AddForeignKey
ALTER TABLE "grade_config" ADD CONSTRAINT "grade_config_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;
