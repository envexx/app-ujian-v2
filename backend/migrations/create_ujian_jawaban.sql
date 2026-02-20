-- Create ujian_jawaban table for storing student answers
CREATE TABLE IF NOT EXISTS ujian_jawaban (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "submissionId" TEXT NOT NULL REFERENCES ujian_submission(id) ON DELETE CASCADE,
  "soalId" TEXT NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  jawaban JSONB,
  nilai INTEGER,
  feedback TEXT,
  "isCorrect" BOOLEAN,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("submissionId", "soalId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ujian_jawaban_submission ON ujian_jawaban("submissionId");
CREATE INDEX IF NOT EXISTS idx_ujian_jawaban_soal ON ujian_jawaban("soalId");
