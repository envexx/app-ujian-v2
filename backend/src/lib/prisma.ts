import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('🔌 Connecting to Neon database with Drizzle...');

// Create Neon SQL client
const sql = neon(DATABASE_URL);

// Create Drizzle instance
export const db = drizzle(sql);

// Export for compatibility (will be replaced with Drizzle queries)
export default db;
