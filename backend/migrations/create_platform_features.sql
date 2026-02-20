-- Platform Notifications (managed by superadmin)
CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul VARCHAR(255) NOT NULL,
  pesan TEXT NOT NULL,
  tipe VARCHAR(20) NOT NULL DEFAULT 'info', -- info, warning, update, maintenance, promo
  "targetRole" TEXT[] DEFAULT ARRAY['ALL'],
  "targetSchoolIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Track which users have read which platform notifications
CREATE TABLE IF NOT EXISTS notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "notificationId" UUID NOT NULL REFERENCES platform_notifications(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL,
  "readAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("notificationId", "userId")
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT false,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- SMTP / Resend configuration (managed by superadmin)
CREATE TABLE IF NOT EXISTS smtp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host VARCHAR(255) DEFAULT 'api.resend.com',
  port INTEGER DEFAULT 443,
  secure BOOLEAN DEFAULT true,
  "user" VARCHAR(255) DEFAULT 'resend',
  pass TEXT DEFAULT '',
  "fromName" VARCHAR(255) DEFAULT 'E-Learning Platform',
  "fromEmail" VARCHAR(255) DEFAULT 'noreply@nilai.online',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_notif_published ON platform_notifications("isPublished", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notif_reads_user ON notification_reads("userId");
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email);
