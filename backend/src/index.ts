import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { corsMiddleware } from './middleware/cors';
import routes from './routes';

const app = new Hono();

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
  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan server',
    },
    500
  );
});

// Start server (for local development)
const port = parseInt(process.env.PORT || '5000', 10);

console.log(`🚀 LMS Backend starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);

// Export for AWS Lambda
export default app;
