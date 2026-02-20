/*
  Warnings:

  - You are about to drop the column `noTelp` on the `guru` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalLahir` on the `guru` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "guru" DROP COLUMN "noTelp",
DROP COLUMN "tanggalLahir";
