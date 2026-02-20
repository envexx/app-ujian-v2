import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Lazy-initialized SQL client (edge-compatible: no top-level process.env)
let _sql: NeonQueryFunction<false, false> | null = null;
let _lastUrl: string | null = null;

/**
 * Initialize the Neon SQL client with a database URL.
 * Call this once per request (via middleware) before any route uses `sql`.
 */
export function initDb(databaseUrl: string): void {
  if (databaseUrl !== _lastUrl) {
    _sql = neon(databaseUrl);
    _lastUrl = databaseUrl;
  }
}

/**
 * Tagged template SQL client — backward-compatible with all existing routes.
 * Throws if initDb() hasn't been called yet.
 */
export const sql: NeonQueryFunction<false, false> = new Proxy((() => {}) as any, {
  apply(_target, _thisArg, args) {
    if (!_sql) throw new Error('Database not initialized. Call initDb(DATABASE_URL) first.');
    return (_sql as any)(...args);
  },
  get(_target, prop) {
    if (!_sql) throw new Error('Database not initialized. Call initDb(DATABASE_URL) first.');
    return (_sql as any)[prop];
  },
});

/**
 * Get current time in Asia/Jakarta timezone.
 * Use this instead of NOW() when comparing with user-facing timestamps.
 * Neon DB runs in UTC, but all times in this app are Indonesia (WIB/UTC+7).
 */
export function nowJakarta(): string {
  return `NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'`;
}

// Jakarta UTC offset in hours
export const JAKARTA_OFFSET_HOURS = 7;

/**
 * Convert a JS Date to Jakarta time ISO string (for storing in DB).
 * Since DB columns are TIMESTAMP without timezone, we store Jakarta local time directly.
 */
export function toJakartaISO(date: Date = new Date()): string {
  const jakartaTime = new Date(date.getTime() + JAKARTA_OFFSET_HOURS * 60 * 60 * 1000);
  return jakartaTime.toISOString().replace('Z', '');
}

/**
 * Get current Jakarta time as Date object
 */
export function getJakartaNow(): Date {
  return new Date(Date.now() + JAKARTA_OFFSET_HOURS * 60 * 60 * 1000);
}

// Helper to run queries
export async function query<T = any>(queryString: string, params: any[] = []): Promise<T[]> {
  if (!_sql) throw new Error('Database not initialized. Call initDb(DATABASE_URL) first.');
  try {
    const result = await _sql(queryString, params);
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
