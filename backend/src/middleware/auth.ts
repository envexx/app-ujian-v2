import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { lucia } from '../lib/lucia';
import { sql } from '../lib/db';

interface UserPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA' | 'SUPERADMIN';
  schoolId: string;
}

// Extend Hono context with user data
declare module 'hono' {
  interface ContextVariableMap {
    user: UserPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const sessionId = getCookie(c, lucia.sessionCookieName);

  if (!sessionId) {
    return c.json({ error: 'Unauthorized', message: 'Session tidak ditemukan' }, 401);
  }

  try {
    const { session, user: luciaUser } = await lucia.validateSession(sessionId);

    if (!session || !luciaUser) {
      return c.json({ error: 'Unauthorized', message: 'Session tidak valid atau expired' }, 401);
    }

    // Get full user data
    const users = await sql`SELECT id, email, role, "schoolId", "isActive" FROM users WHERE id = ${luciaUser.id} LIMIT 1`;
    const user = users[0];

    if (!user || !user.isActive) {
      return c.json({ error: 'Unauthorized', message: 'Akun tidak aktif' }, 401);
    }

    c.set('user', {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Unauthorized', message: 'Session tidak valid' }, 401);
  }
}

// Role-based middleware
export function requireRole(...roles: UserPayload['role'][]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'User tidak ditemukan' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ 
        error: 'Forbidden', 
        message: `Akses ditolak. Role yang dibutuhkan: ${roles.join(', ')}` 
      }, 403);
    }

    await next();
  };
}

// Tenant isolation middleware - ensures user can only access their school's data
export async function tenantMiddleware(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // SUPERADMIN can access all schools
  if (user.role === 'SUPERADMIN') {
    await next();
    return;
  }

  // Other roles must have schoolId
  if (!user.schoolId) {
    return c.json({ error: 'Forbidden', message: 'School ID tidak ditemukan' }, 403);
  }

  await next();
}
