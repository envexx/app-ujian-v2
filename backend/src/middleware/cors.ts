import { cors } from 'hono/cors';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow requests from frontend URL
    if (origin === FRONTEND_URL) return origin;
    
    // Allow localhost in development
    if (process.env.NODE_ENV === 'development') {
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
