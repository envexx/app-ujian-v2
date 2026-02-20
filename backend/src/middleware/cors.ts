import { cors } from 'hono/cors';
import type { Context, Next } from 'hono';

/**
 * CORS middleware that reads FRONTEND_URL from env bindings (edge-compatible).
 * Falls back to localhost:3000 for dev.
 */
export const corsMiddleware = async (c: Context, next: Next) => {
  const frontendUrl = c.env?.FRONTEND_URL || 'http://localhost:3000';
  const nodeEnv = c.env?.NODE_ENV || 'development';

  const handler = cors({
    origin: (origin) => {
      if (origin === frontendUrl) return origin;

      // Allow localhost in development
      if (nodeEnv === 'development') {
        if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
          return origin;
        }
      }

      // Allow Cloudflare Pages domains
      if (origin?.endsWith('.pages.dev')) return origin;

      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    credentials: true,
    maxAge: 86400,
  });

  return handler(c, next);
};
