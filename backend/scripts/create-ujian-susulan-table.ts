import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function createUjianSusulanTable() {
  console.log('🔧 Creating ujian_susulan table...');

  try {
    await sql`
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
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_ujian_susulan_ujian ON ujian_susulan("ujianId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ujian_susulan_siswa ON ujian_susulan("siswaId")`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ujian_susulan_school ON ujian_susulan("schoolId")`;

    console.log('✅ ujian_susulan table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createUjianSusulanTable();
