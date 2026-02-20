import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set in .env');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const migrationFile = process.argv[2] || 'migrations/create_platform_features.sql';
const filePath = resolve(process.cwd(), migrationFile);

console.log(`📄 Running migration: ${migrationFile}`);

const migrationSQL = readFileSync(filePath, 'utf-8');

// Split by semicolons and run each statement
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

(async () => {
  try {
    for (const stmt of statements) {
      console.log(`  ▶ ${stmt.substring(0, 60)}...`);
      await sql(stmt);
    }
    console.log(`✅ Migration completed successfully! (${statements.length} statements)`);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
})();
