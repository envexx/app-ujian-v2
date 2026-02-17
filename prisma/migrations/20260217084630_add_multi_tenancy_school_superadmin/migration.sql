/*
  Warnings:

  - A unique constraint covering the columns `[schoolId,nipUsername]` on the table `guru` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,hari]` on the table `info_masuk` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,nama]` on the table `kelas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,nama]` on the table `mata_pelajaran` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,kode]` on the table `mata_pelajaran` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,nisn]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[schoolId,nis]` on the table `siswa` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `schoolId` to the `guru` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `info_masuk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `jadwal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `kelas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `mata_pelajaran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `materi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `sekolah_info` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `siswa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `tugas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `ujian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `ujian_access_control` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schoolId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "guru_nipUsername_key";

-- DropIndex
DROP INDEX "info_masuk_hari_key";

-- DropIndex
DROP INDEX "kelas_nama_key";

-- DropIndex
DROP INDEX "mata_pelajaran_kode_key";

-- DropIndex
DROP INDEX "mata_pelajaran_nama_key";

-- DropIndex
DROP INDEX "siswa_nis_key";

-- DropIndex
DROP INDEX "siswa_nisn_key";

-- AlterTable
ALTER TABLE "guru" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "info_masuk" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "jadwal" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "kelas" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "mata_pelajaran" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "materi" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sekolah_info" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "siswa" ADD COLUMN     "schoolId" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "tanggalLahir" DROP NOT NULL,
ALTER COLUMN "alamat" DROP NOT NULL,
ALTER COLUMN "namaWali" DROP NOT NULL,
ALTER COLUMN "noTelpWali" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tugas" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ujian" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ujian_access_control" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "schoolId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npsn" TEXT,
    "alamat" TEXT,
    "kota" TEXT,
    "provinsi" TEXT,
    "noTelp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "jenjang" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscription" TEXT NOT NULL DEFAULT 'trial',
    "maxSiswa" INTEGER NOT NULL DEFAULT 500,
    "maxGuru" INTEGER NOT NULL DEFAULT 50,
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "super_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_npsn_key" ON "schools"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "schools_email_key" ON "schools"("email");

-- CreateIndex
CREATE INDEX "schools_nama_idx" ON "schools"("nama");

-- CreateIndex
CREATE INDEX "schools_isActive_idx" ON "schools"("isActive");

-- CreateIndex
CREATE INDEX "schools_npsn_idx" ON "schools"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_email_idx" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "guru_schoolId_idx" ON "guru"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_schoolId_nipUsername_key" ON "guru"("schoolId", "nipUsername");

-- CreateIndex
CREATE INDEX "info_masuk_schoolId_idx" ON "info_masuk"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "info_masuk_schoolId_hari_key" ON "info_masuk"("schoolId", "hari");

-- CreateIndex
CREATE INDEX "jadwal_schoolId_idx" ON "jadwal"("schoolId");

-- CreateIndex
CREATE INDEX "kelas_schoolId_idx" ON "kelas"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_schoolId_nama_key" ON "kelas"("schoolId", "nama");

-- CreateIndex
CREATE INDEX "mata_pelajaran_schoolId_idx" ON "mata_pelajaran"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_schoolId_nama_key" ON "mata_pelajaran"("schoolId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_schoolId_kode_key" ON "mata_pelajaran"("schoolId", "kode");

-- CreateIndex
CREATE INDEX "materi_schoolId_idx" ON "materi"("schoolId");

-- CreateIndex
CREATE INDEX "sekolah_info_schoolId_idx" ON "sekolah_info"("schoolId");

-- CreateIndex
CREATE INDEX "siswa_schoolId_idx" ON "siswa"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_schoolId_nisn_key" ON "siswa"("schoolId", "nisn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_schoolId_nis_key" ON "siswa"("schoolId", "nis");

-- CreateIndex
CREATE INDEX "tugas_schoolId_idx" ON "tugas"("schoolId");

-- CreateIndex
CREATE INDEX "ujian_schoolId_idx" ON "ujian"("schoolId");

-- CreateIndex
CREATE INDEX "ujian_access_control_schoolId_idx" ON "ujian_access_control"("schoolId");

-- CreateIndex
CREATE INDEX "users_schoolId_idx" ON "users"("schoolId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sekolah_info" ADD CONSTRAINT "sekolah_info_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mata_pelajaran" ADD CONSTRAINT "mata_pelajaran_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_masuk" ADD CONSTRAINT "info_masuk_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_access_control" ADD CONSTRAINT "ujian_access_control_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
