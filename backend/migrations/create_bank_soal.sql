-- Migration: Create bank_soal table
-- Bank soal untuk menyimpan soal-soal yang bisa digunakan ulang

CREATE TABLE IF NOT EXISTS bank_soal (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "guruId" TEXT NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  "mapelId" TEXT NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('PILIHAN_GANDA', 'ESSAY', 'ISIAN_SINGKAT', 'BENAR_SALAH', 'PENCOCOKAN')),
  pertanyaan TEXT NOT NULL,
  data JSONB,
  poin INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bank_soal_school ON bank_soal("schoolId");
CREATE INDEX IF NOT EXISTS idx_bank_soal_guru ON bank_soal("guruId");
CREATE INDEX IF NOT EXISTS idx_bank_soal_mapel ON bank_soal("mapelId");
CREATE INDEX IF NOT EXISTS idx_bank_soal_tipe ON bank_soal(tipe);
CREATE INDEX IF NOT EXISTS idx_bank_soal_tags ON bank_soal USING GIN(tags);
