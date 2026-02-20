import { Lucia } from "lucia";
import { NeonHTTPAdapter } from "@lucia-auth/adapter-postgresql";
import { neon } from "@neondatabase/serverless";

let _lucia: Lucia | null = null;
let _lastDbUrl: string | null = null;

/**
 * Get or create Lucia instance (lazy init for edge runtime).
 * @param databaseUrl - DATABASE_URL from env bindings
 * @param isProduction - whether to set secure cookie
 */
export function getLucia(databaseUrl: string, isProduction = false): Lucia {
  if (_lucia && databaseUrl === _lastDbUrl) return _lucia;

  const sql = neon(databaseUrl);
  const adapter = new NeonHTTPAdapter(sql, {
    user: "users",
    session: "user_sessions",
  });

  _lucia = new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: isProduction,
      },
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        role: attributes.role,
        schoolId: attributes.schoolId,
        isActive: attributes.isActive,
      };
    },
  });

  _lastDbUrl = databaseUrl;
  return _lucia;
}

// Backward-compatible proxy — works after getLucia() is called at least once
export const lucia: Lucia = new Proxy({} as Lucia, {
  get(_target, prop) {
    if (!_lucia) throw new Error("Lucia not initialized. Call getLucia(DATABASE_URL) first.");
    return (_lucia as any)[prop];
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  role: "ADMIN" | "GURU" | "SISWA";
  schoolId: string;
  isActive: boolean;
}
