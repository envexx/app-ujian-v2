-- CreateTable
CREATE TABLE "sekolah_info" (
    "id" TEXT NOT NULL,
    "namaSekolah" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "namaKepsek" TEXT NOT NULL,
    "nipKepsek" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sekolah_info_pkey" PRIMARY KEY ("id")
);
