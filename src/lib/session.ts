import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  email?: string;
  role?: 'ADMIN' | 'GURU' | 'SISWA';
  isLoggedIn?: boolean;
}

// Validate SESSION_SECRET
if (!process.env.SESSION_SECRET) {
  console.error('⚠️  WARNING: SESSION_SECRET tidak dikonfigurasi di environment variable!');
  console.error('   Session security akan lemah. Pastikan untuk mengatur SESSION_SECRET di .env');
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || (() => {
    // Generate a random secret if not provided (for development only)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Using auto-generated SESSION_SECRET for development. Set SESSION_SECRET in .env for production!');
      return 'dev-secret-key-change-in-production-' + Math.random().toString(36).substring(2, 15);
    }
    throw new Error('SESSION_SECRET harus dikonfigurasi di environment variable untuk production!');
  })(),
  cookieName: 'e-learning-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(data: Omit<SessionData, 'isLoggedIn'>) {
  const session = await getSession();
  session.userId = data.userId;
  session.email = data.email;
  session.role = data.role;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
