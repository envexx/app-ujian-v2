import * as jose from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA' | 'SUPERADMIN';
  schoolId?: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-minimum-32-chars-long-for-jwt'
);

const JWT_ISSUER = 'lms-backend';
const JWT_AUDIENCE = 'lms-frontend';
const JWT_EXPIRATION = '8h';

export async function signJWT(payload: JWTPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function refreshJWT(token: string): Promise<string | null> {
  const payload = await verifyJWT(token);
  if (!payload) return null;
  return signJWT(payload);
}
