import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('📄 Running platform features migration...\n');

  // 1. Platform Notifications
  console.log('  ▶ Creating platform_notifications table...');
  await sql`
    CREATE TABLE IF NOT EXISTS platform_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      judul VARCHAR(255) NOT NULL,
      pesan TEXT NOT NULL,
      tipe VARCHAR(20) NOT NULL DEFAULT 'info',
      "targetRole" TEXT[] DEFAULT ARRAY['ALL'],
      "targetSchoolIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
      priority VARCHAR(10) DEFAULT 'normal',
      "isPublished" BOOLEAN DEFAULT false,
      "publishedAt" TIMESTAMPTZ,
      "expiresAt" TIMESTAMPTZ,
      "createdBy" UUID,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // 2. Notification Reads
  console.log('  ▶ Creating notification_reads table...');
  await sql`
    CREATE TABLE IF NOT EXISTS notification_reads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "notificationId" UUID NOT NULL REFERENCES platform_notifications(id) ON DELETE CASCADE,
      "userId" UUID NOT NULL,
      "readAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE("notificationId", "userId")
    )
  `;

  // 3. Password Reset Tokens
  console.log('  ▶ Creating password_reset_tokens table...');
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      used BOOLEAN DEFAULT false,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // 4. SMTP Config
  console.log('  ▶ Creating smtp_config table...');
  await sql`
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
    )
  `;

  // 5. Indexes
  console.log('  ▶ Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_platform_notif_published ON platform_notifications("isPublished", "publishedAt" DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notif_reads_user ON notification_reads("userId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset_tokens(token) WHERE used = false`;
  await sql`CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_tokens(email)`;

  console.log('\n✅ Migration completed successfully!');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
