import { neon } from '@neondatabase/serverless';

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

console.log('🔌 Connecting to Neon database...');

// Create Neon SQL client - this is a simple SQL query function
export const sql = neon(DATABASE_URL);

// Helper to run queries
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await sql(queryString, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper for single row
export async function queryOne<T = any>(queryString: string, params: any[] = []): Promise<T | null> {
  const results = await query<T>(queryString, params);
  return results[0] || null;
}

export default sql;
