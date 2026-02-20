import * as jose from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA' | 'SUPERADMIN';
  schoolId?: string;
}

const JWT_ISSUER = 'lms-backend';
const JWT_AUDIENCE = 'lms-frontend';
const JWT_EXPIRATION = '8h';

// Cache encoded secrets to avoid re-encoding on every call
let _cachedSecret: Uint8Array | null = null;
let _cachedSecretRaw: string | null = null;

function getSecret(jwtSecret: string): Uint8Array {
  if (_cachedSecret && _cachedSecretRaw === jwtSecret) return _cachedSecret;
  _cachedSecret = new TextEncoder().encode(jwtSecret);
  _cachedSecretRaw = jwtSecret;
  return _cachedSecret;
}

export async function signJWT(payload: JWTPayload, jwtSecret: string): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecret(jwtSecret));
}

export async function verifyJWT(token: string, jwtSecret: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(jwtSecret), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function refreshJWT(token: string, jwtSecret: string): Promise<string | null> {
  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) return null;
  return signJWT(payload, jwtSecret);
}
