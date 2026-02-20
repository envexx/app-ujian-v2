import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { corsMiddleware } from './middleware/cors';
import { initDb } from './lib/db';
import { getLucia } from './lib/lucia';
import routes from './routes';
import type { HonoEnv } from './env';

const app = new Hono<HonoEnv>();

// Initialize DB & Lucia from env bindings on every request
app.use('*', async (c, next) => {
  const env = c.env;
  if (env?.DATABASE_URL) {
    initDb(env.DATABASE_URL);
    getLucia(env.DATABASE_URL, env.NODE_ENV === 'production');
  }
  await next();
});

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', corsMiddleware);

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'LMS Backend API',
    version: '1.0.0',
    status: 'healthy',
    runtime: 'Cloudflare Workers',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.route('/api', routes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', message: 'Route tidak ditemukan' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  const isDev = c.env?.NODE_ENV === 'development';
  return c.json(
    {
      error: 'Internal Server Error',
      message: isDev ? err.message : 'Terjadi kesalahan server',
    },
    500
  );
});

// Export for Cloudflare Workers
export default app;
