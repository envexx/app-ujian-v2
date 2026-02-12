/*
  Warnings:

  - You are about to drop the `jawaban_essay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jawaban_pilihan_ganda` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `soal_essay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `soal_pilihan_ganda` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "jawaban_essay" DROP CONSTRAINT "jawaban_essay_soalId_fkey";

-- DropForeignKey
ALTER TABLE "jawaban_essay" DROP CONSTRAINT "jawaban_essay_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "jawaban_pilihan_ganda" DROP CONSTRAINT "jawaban_pilihan_ganda_soalId_fkey";

-- DropForeignKey
ALTER TABLE "jawaban_pilihan_ganda" DROP CONSTRAINT "jawaban_pilihan_ganda_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "soal_essay" DROP CONSTRAINT "soal_essay_ujianId_fkey";

-- DropForeignKey
ALTER TABLE "soal_pilihan_ganda" DROP CONSTRAINT "soal_pilihan_ganda_ujianId_fkey";

-- DropTable
DROP TABLE "jawaban_essay";

-- DropTable
DROP TABLE "jawaban_pilihan_ganda";

-- DropTable
DROP TABLE "soal_essay";

-- DropTable
DROP TABLE "soal_pilihan_ganda";
