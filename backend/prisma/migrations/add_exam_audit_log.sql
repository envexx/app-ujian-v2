-- Add audit logging for exam activities
-- This helps track all exam-related actions for debugging and monitoring

CREATE TABLE IF NOT EXISTS "exam_audit_log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ujianId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "submissionId" TEXT,
    "action" TEXT NOT NULL,
    "questionId" TEXT,
    "questionType" TEXT,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "exam_audit_log_ujianId_idx" ON "exam_audit_log"("ujianId");
CREATE INDEX IF NOT EXISTS "exam_audit_log_siswaId_idx" ON "exam_audit_log"("siswaId");
CREATE INDEX IF NOT EXISTS "exam_audit_log_submissionId_idx" ON "exam_audit_log"("submissionId");
CREATE INDEX IF NOT EXISTS "exam_audit_log_action_idx" ON "exam_audit_log"("action");
CREATE INDEX IF NOT EXISTS "exam_audit_log_status_idx" ON "exam_audit_log"("status");
CREATE INDEX IF NOT EXISTS "exam_audit_log_createdAt_idx" ON "exam_audit_log"("createdAt");

-- Add foreign key constraints
ALTER TABLE "exam_audit_log" 
ADD CONSTRAINT "exam_audit_log_ujianId_fkey" 
FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "exam_audit_log" 
ADD CONSTRAINT "exam_audit_log_siswaId_fkey" 
FOREIGN KEY ("siswaId") REFERENCES "siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
