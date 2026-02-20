-- Create ujian_susulan table for makeup exam access
CREATE TABLE IF NOT EXISTS ujian_susulan (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "ujianId" TEXT NOT NULL REFERENCES ujian(id) ON DELETE CASCADE,
  "siswaId" TEXT NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  "schoolId" TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  "grantedBy" TEXT REFERENCES users(id),
  "durasiMenit" INTEGER NOT NULL DEFAULT 60,
  "expiresAt" TIMESTAMP NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ujian_susulan_ujian ON ujian_susulan("ujianId");
CREATE INDEX IF NOT EXISTS idx_ujian_susulan_siswa ON ujian_susulan("siswaId");
CREATE INDEX IF NOT EXISTS idx_ujian_susulan_school ON ujian_susulan("schoolId");
