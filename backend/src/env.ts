// Cloudflare Workers Environment Bindings
export interface Env {
  // Database
  DATABASE_URL: string;

  // JWT
  JWT_SECRET: string;
  SUPERADMIN_JWT_SECRET: string;

  // Cloudflare R2 Binding
  R2_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;

  // Resend (email)
  RESEND_API_KEY: string;

  // App config
  FRONTEND_URL: string;
  NODE_ENV: string;
}

// Hono app type with env bindings
export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user: {
      userId: string;
      email: string;
      role: 'ADMIN' | 'GURU' | 'SISWA' | 'SUPERADMIN';
      schoolId: string;
    };
    superadmin: {
      id: string;
      email: string;
      nama: string;
      role: string;
    };
  };
};
