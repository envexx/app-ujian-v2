-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GURU', 'SISWA');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "profilePhoto" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tingkat" TEXT NOT NULL,
    "waliKelasId" TEXT,
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mata_pelajaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "jamPerMinggu" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nip" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noTelp" TEXT,
    "alamat" TEXT,
    "jenisKelamin" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3),
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guru_mapel" (
    "id" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,

    CONSTRAINT "guru_mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siswa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nisn" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "jenisKelamin" TEXT NOT NULL,
    "tanggalLahir" TIMESTAMP(3) NOT NULL,
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT,
    "namaWali" TEXT NOT NULL,
    "noTelpWali" TEXT NOT NULL,
    "foto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kartu_pelajar" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggalTerbit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalKadaluarsa" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kartu_pelajar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "hari" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "ruangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materi" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelas" TEXT[],
    "tipe" TEXT NOT NULL,
    "fileUrl" TEXT,
    "ukuran" TEXT,
    "tanggalUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tugas" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "instruksi" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelas" TEXT[],
    "deadline" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tugas_submission" (
    "id" TEXT NOT NULL,
    "tugasId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "catatan" TEXT,
    "nilai" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tugas_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "kelas" TEXT[],
    "tanggal" TIMESTAMP(3) NOT NULL,
    "waktuMulai" TEXT NOT NULL,
    "durasi" INTEGER NOT NULL,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "showScore" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal_pilihan_ganda" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsiA" TEXT NOT NULL,
    "opsiB" TEXT NOT NULL,
    "opsiC" TEXT NOT NULL,
    "opsiD" TEXT NOT NULL,
    "jawabanBenar" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_pilihan_ganda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soal_essay" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "kunciJawaban" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soal_essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_submission" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "nilai" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ujian_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_pilihan_ganda" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jawaban_pilihan_ganda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_essay" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "nilai" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jawaban_essay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nilai" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "guruId" TEXT NOT NULL,
    "tugas" INTEGER,
    "uts" INTEGER,
    "uas" INTEGER,
    "nilaiAkhir" INTEGER,
    "semester" TEXT NOT NULL,
    "tahunAjaran" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nilai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_nama_key" ON "kelas"("nama");

-- CreateIndex
CREATE INDEX "kelas_nama_idx" ON "kelas"("nama");

-- CreateIndex
CREATE INDEX "kelas_tingkat_idx" ON "kelas"("tingkat");

-- CreateIndex
CREATE INDEX "kelas_tahunAjaran_idx" ON "kelas"("tahunAjaran");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_nama_key" ON "mata_pelajaran"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "mata_pelajaran_kode_key" ON "mata_pelajaran"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "guru_userId_key" ON "guru"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_nip_key" ON "guru"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "guru_email_key" ON "guru"("email");

-- CreateIndex
CREATE INDEX "guru_nip_idx" ON "guru"("nip");

-- CreateIndex
CREATE INDEX "guru_email_idx" ON "guru"("email");

-- CreateIndex
CREATE INDEX "guru_userId_idx" ON "guru"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "guru_mapel_guruId_mapelId_key" ON "guru_mapel"("guruId", "mapelId");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_userId_key" ON "siswa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nisn_key" ON "siswa"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_nis_key" ON "siswa"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "siswa_email_key" ON "siswa"("email");

-- CreateIndex
CREATE INDEX "siswa_nisn_idx" ON "siswa"("nisn");

-- CreateIndex
CREATE INDEX "siswa_nis_idx" ON "siswa"("nis");

-- CreateIndex
CREATE INDEX "siswa_kelasId_idx" ON "siswa"("kelasId");

-- CreateIndex
CREATE INDEX "siswa_email_idx" ON "siswa"("email");

-- CreateIndex
CREATE INDEX "siswa_userId_idx" ON "siswa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kartu_pelajar_siswaId_key" ON "kartu_pelajar"("siswaId");

-- CreateIndex
CREATE INDEX "presensi_siswaId_idx" ON "presensi"("siswaId");

-- CreateIndex
CREATE INDEX "presensi_tanggal_idx" ON "presensi"("tanggal");

-- CreateIndex
CREATE INDEX "presensi_status_idx" ON "presensi"("status");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_siswaId_tanggal_key" ON "presensi"("siswaId", "tanggal");

-- CreateIndex
CREATE INDEX "tugas_guruId_idx" ON "tugas"("guruId");

-- CreateIndex
CREATE INDEX "tugas_mapelId_idx" ON "tugas"("mapelId");

-- CreateIndex
CREATE INDEX "tugas_status_idx" ON "tugas"("status");

-- CreateIndex
CREATE INDEX "tugas_deadline_idx" ON "tugas"("deadline");

-- CreateIndex
CREATE INDEX "tugas_submission_tugasId_idx" ON "tugas_submission"("tugasId");

-- CreateIndex
CREATE INDEX "tugas_submission_siswaId_idx" ON "tugas_submission"("siswaId");

-- CreateIndex
CREATE INDEX "tugas_submission_submittedAt_idx" ON "tugas_submission"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tugas_submission_tugasId_siswaId_key" ON "tugas_submission"("tugasId", "siswaId");

-- CreateIndex
CREATE INDEX "ujian_guruId_idx" ON "ujian"("guruId");

-- CreateIndex
CREATE INDEX "ujian_mapelId_idx" ON "ujian"("mapelId");

-- CreateIndex
CREATE INDEX "ujian_status_idx" ON "ujian"("status");

-- CreateIndex
CREATE INDEX "ujian_tanggal_idx" ON "ujian"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "ujian_submission_ujianId_siswaId_key" ON "ujian_submission"("ujianId", "siswaId");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_pilihan_ganda_submissionId_soalId_key" ON "jawaban_pilihan_ganda"("submissionId", "soalId");

-- CreateIndex
CREATE UNIQUE INDEX "jawaban_essay_submissionId_soalId_key" ON "jawaban_essay"("submissionId", "soalId");

-- CreateIndex
CREATE INDEX "nilai_siswaId_idx" ON "nilai"("siswaId");

-- CreateIndex
CREATE INDEX "nilai_mapelId_idx" ON "nilai"("mapelId");

-- CreateIndex
CREATE INDEX "nilai_semester_idx" ON "nilai"("semester");

-- CreateIndex
CREATE INDEX "nilai_tahunAjaran_idx" ON "nilai"("tahunAjaran");

-- CreateIndex
CREATE UNIQUE INDEX "nilai_siswaId_mapelId_semester_tahunAjaran_key" ON "nilai"("siswaId", "mapelId", "semester", "tahunAjaran");

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_waliKelasId_fkey" FOREIGN KEY ("waliKelasId") REFERENCES "guru"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru" ADD CONSTRAINT "guru_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru_mapel" ADD CONSTRAINT "guru_mapel_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guru_mapel" ADD CONSTRAINT "guru_mapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siswa" ADD CONSTRAINT "siswa_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kartu_pelajar" ADD CONSTRAINT "kartu_pelajar_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materi" ADD CONSTRAINT "materi_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas" ADD CONSTRAINT "tugas_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_submission" ADD CONSTRAINT "tugas_submission_tugasId_fkey" FOREIGN KEY ("tugasId") REFERENCES "tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_submission" ADD CONSTRAINT "tugas_submission_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal_pilihan_ganda" ADD CONSTRAINT "soal_pilihan_ganda_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soal_essay" ADD CONSTRAINT "soal_essay_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_submission" ADD CONSTRAINT "ujian_submission_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_submission" ADD CONSTRAINT "ujian_submission_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_pilihan_ganda" ADD CONSTRAINT "jawaban_pilihan_ganda_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ujian_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_pilihan_ganda" ADD CONSTRAINT "jawaban_pilihan_ganda_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "soal_pilihan_ganda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_essay" ADD CONSTRAINT "jawaban_essay_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ujian_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_essay" ADD CONSTRAINT "jawaban_essay_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "soal_essay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nilai" ADD CONSTRAINT "nilai_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "guru"("id") ON DELETE CASCADE ON UPDATE CASCADE;
