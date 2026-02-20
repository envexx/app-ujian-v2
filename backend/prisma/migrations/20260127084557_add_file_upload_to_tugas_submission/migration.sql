-- AlterTable
ALTER TABLE "tugas_submission" ADD COLUMN     "fileUpload" TEXT,
ALTER COLUMN "fileUrl" DROP NOT NULL;
