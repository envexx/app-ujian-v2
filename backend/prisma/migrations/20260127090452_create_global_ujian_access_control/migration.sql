/*
  Warnings:

  - You are about to drop the column `token` on the `ujian` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ujian" DROP COLUMN "token";

-- CreateTable
CREATE TABLE "ujian_access_control" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "currentToken" TEXT,
    "tokenGeneratedAt" TIMESTAMP(3),
    "tokenExpiresAt" TIMESTAMP(3),
    "generatedBy" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ujian_access_control_pkey" PRIMARY KEY ("id")
);
