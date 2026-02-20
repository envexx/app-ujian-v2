import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_omGrv5nDJ6WX@ep-red-morning-a1la767n-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function runMigration(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  const sqlContent = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`Running migration: ${filename}`);
  
  // Remove comments and split by semicolon
  const cleanedSql = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  try {
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await sql(statement);
    }
    console.log(`Migration ${filename} completed successfully!`);
  } catch (error) {
    console.error(`Migration ${filename} failed:`, error.message);
    throw error;
  }
}

// Run the migration
const migrationFile = process.argv[2] || 'create_bank_soal.sql';
runMigration(migrationFile)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
