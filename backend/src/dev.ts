// Local development server — uses Node.js runtime with dotenv
import 'dotenv/config';
import { serve } from '@hono/node-server';
import { initDb } from './lib/db';
import { getLucia } from './lib/lucia';
import app from './index';

// Initialize DB & Lucia with process.env for local dev
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

initDb(DATABASE_URL);
getLucia(DATABASE_URL, false);

// Inject env bindings into every request for local dev (simulates CF Workers env)
const originalFetch = app.fetch.bind(app);
const devFetch: typeof app.fetch = (req, env, ctx) => {
  const devEnv = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-minimum-32-chars-long-for-jwt',
    SUPERADMIN_JWT_SECRET: process.env.SUPERADMIN_JWT_SECRET || 'superadmin-dev-secret-key-32-chars',
    R2_BUCKET: null as any, // R2 binding not available in local dev — use wrangler dev for R2
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || 'https://storage.nilai.online',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ...env,
  };
  return originalFetch(req, devEnv, ctx);
};

const port = parseInt(process.env.PORT || '5000', 10);

console.log(`🚀 LMS Backend (dev) starting on port ${port}...`);

serve({
  fetch: devFetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
