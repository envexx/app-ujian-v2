-- CreateTable
CREATE TABLE "soal" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "poin" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_soal" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" JSONB NOT NULL,
    "nilai" INTEGER,
    "feedback" TEXT,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jawaban_soal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "soal_ujianId_idx" ON "soal"("ujianId");

-- CreateIndex
CREATE INDEX "soal_urutan_idx" ON "soal"("urutan");

-- CreateIndex
CREATE INDEX "soal_tipe_idx" ON "soal"("tipe");

-- CreateIndex
CREATE INDEX "jawaban_soal_submissionId_idx" ON "jawaban_soal"("submissionId");

-- CreateIndex
CREATE INDEX "jawaban_soal_soalId_idx" ON "jawaban_soal"("soalId");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_soal_submissionId_soalId_key" ON "jawaban_soal"("submissionId", "soalId");

-- CreateIndex
CREATE INDEX "ujian_submission_ujianId_idx" ON "ujian_submission"("ujianId");

-- CreateIndex
CREATE INDEX "ujian_submission_siswaId_idx" ON "ujian_submission"("siswaId");

-- CreateIndex
CREATE INDEX "ujian_submission_status_idx" ON "ujian_submission"("status");

-- AddForeignKey
ALTER TABLE "soal" ADD CONSTRAINT "soal_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_soal" ADD CONSTRAINT "jawaban_soal_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ujian_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_soal" ADD CONSTRAINT "jawaban_soal_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
