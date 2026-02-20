import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';
import { lucia } from '../lib/lucia';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { HonoEnv } from '../env';
import { sendPasswordResetEmail } from '../lib/email';

const auth = new Hono<HonoEnv>();

// Login schema
const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

// POST /auth/login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');

    console.log('🔐 Login attempt for:', email);

    // Find user by email with siswa and guru data
    const users = await sql`
      SELECT u.*, 
             s.id as siswa_id, s.nama as siswa_nama, s.nis, s."kelasId", s.foto as siswa_foto,
             g.id as guru_id, g.nama as guru_nama, g."nipUsername", g.foto as guru_foto
      FROM users u
      LEFT JOIN siswa s ON s."userId" = u.id
      LEFT JOIN guru g ON g."userId" = u.id
      WHERE u.email = ${email}
      LIMIT 1
    `;

    console.log('📊 Query result:', users.length, 'users found');

    const user = users[0];

    if (!user) {
      console.log('❌ User not found');
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    console.log('✅ User found:', user.email, 'role:', user.role, 'isActive:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      return c.json({ success: false, error: 'Akun Anda tidak aktif. Hubungi administrator.' }, 403);
    }

    // Verify password
    console.log('🔑 Checking password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    // Check if school is active (multi-tenancy)
    const schools = await sql`
      SELECT * FROM schools WHERE id = ${user.schoolId} LIMIT 1
    `;
    const school = schools[0];

    if (!school || !school.isActive) {
      return c.json({ 
        success: false, 
        error: 'Sekolah Anda sedang tidak aktif. Hubungi administrator platform.' 
      }, 403);
    }

    // Create Lucia session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set session cookie
    setCookie(c, sessionCookie.name, sessionCookie.value, {
      path: sessionCookie.attributes.path,
      maxAge: sessionCookie.attributes.maxAge,
      httpOnly: true,
      secure: c.env?.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Get profile data based on role
    let profileData = null;
    if (user.role === 'SISWA' && user.siswa_id) {
      profileData = {
        id: user.siswa_id,
        nama: user.siswa_nama,
        nis: user.nis,
        kelasId: user.kelasId,
        foto: user.siswa_foto,
      };
    } else if (user.role === 'GURU' && user.guru_id) {
      profileData = {
        id: user.guru_id,
        nama: user.guru_nama,
        nip: user.nipUsername,
        foto: user.guru_foto,
      };
    }

    return c.json({
      success: true,
      message: 'Login berhasil',
      data: {
        sessionId: session.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Terjadi kesalahan saat login' }, 500);
  }
});

// POST /auth/logout
auth.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c, lucia.sessionCookieName);
    
    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }

    const blankCookie = lucia.createBlankSessionCookie();
    deleteCookie(c, blankCookie.name);

    return c.json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: true, message: 'Logout berhasil' });
  }
});

// POST /auth/siswa-login - Login for siswa using NISN/NIS (no password)
const siswaLoginSchema = z.object({
  nisn: z.string().min(1, 'NISN/NIS harus diisi'),
});

auth.post('/siswa-login', zValidator('json', siswaLoginSchema), async (c) => {
  try {
    const { nisn } = c.req.valid('json');

    console.log('🔐 Siswa login attempt with NISN/NIS:', nisn);

    // Find siswa by NISN first, then try NIS
    let siswaResult = await sql`
      SELECT s.*, u.id as user_id, u.email, u.role, u."isActive", u."schoolId",
             k.nama as kelas_nama
      FROM siswa s
      JOIN users u ON u.id = s."userId"
      LEFT JOIN kelas k ON k.id = s."kelasId"
      WHERE s.nisn = ${nisn}
      LIMIT 1
    `;

    if (!siswaResult[0]) {
      // Try NIS
      siswaResult = await sql`
        SELECT s.*, u.id as user_id, u.email, u.role, u."isActive", u."schoolId",
               k.nama as kelas_nama
        FROM siswa s
        JOIN users u ON u.id = s."userId"
        LEFT JOIN kelas k ON k.id = s."kelasId"
        WHERE s.nis = ${nisn}
        LIMIT 1
      `;
    }

    const siswa = siswaResult[0];

    if (!siswa) {
      console.log('❌ Siswa not found');
      return c.json({ success: false, error: 'NISN/NIS tidak ditemukan' }, 401);
    }

    console.log('✅ Siswa found:', siswa.nama, 'userId:', siswa.user_id);

    // Check if user is active
    if (!siswa.isActive) {
      return c.json({ success: false, error: 'Akun tidak aktif. Hubungi administrator.' }, 403);
    }

    // Check if school is active
    const schools = await sql`
      SELECT * FROM schools WHERE id = ${siswa.schoolId} LIMIT 1
    `;
    const school = schools[0];

    if (!school || !school.isActive) {
      return c.json({ 
        success: false, 
        error: 'Sekolah tidak aktif. Hubungi administrator.' 
      }, 403);
    }

    // Create Lucia session
    const session = await lucia.createSession(siswa.user_id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set session cookie
    setCookie(c, sessionCookie.name, sessionCookie.value, {
      path: sessionCookie.attributes.path,
      maxAge: sessionCookie.attributes.maxAge,
      httpOnly: true,
      secure: c.env?.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return c.json({
      success: true,
      message: 'Login berhasil',
      data: {
        sessionId: session.id,
        userId: siswa.user_id,
        email: siswa.email,
        role: siswa.role,
        profile: {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,
          nisn: siswa.nisn,
          kelasId: siswa.kelasId,
          kelas: { nama: siswa.kelas_nama },
          jenisKelamin: siswa.jenisKelamin,
          foto: siswa.foto,
          email: siswa.email,
        },
      },
    });
  } catch (error) {
    console.error('Siswa login error:', error);
    return c.json({ success: false, error: 'Terjadi kesalahan saat login' }, 500);
  }
});

// GET /auth/session - Get current session/user info
auth.get('/session', async (c) => {
  try {
    const sessionId = getCookie(c, lucia.sessionCookieName);

    if (!sessionId) {
      return c.json({ success: false, isLoggedIn: false, data: null });
    }

    const { session, user: luciaUser } = await lucia.validateSession(sessionId);

    if (!session || !luciaUser) {
      return c.json({ success: false, isLoggedIn: false, data: null });
    }

    // Get fresh user data from database with siswa/guru info
    const users = await sql`
      SELECT u.*,
             s.id as siswa_id, s.nama as siswa_nama, s.nis, s.nisn, s."kelasId", s."jenisKelamin" as siswa_jk, s.foto as siswa_foto, s.email as siswa_email,
             k.nama as kelas_nama,
             g.id as guru_id, g.nama as guru_nama, g."nipUsername", g.email as guru_email, g.foto as guru_foto
      FROM users u
      LEFT JOIN siswa s ON s."userId" = u.id
      LEFT JOIN kelas k ON k.id = s."kelasId"
      LEFT JOIN guru g ON g."userId" = u.id
      WHERE u.id = ${luciaUser.id}
      LIMIT 1
    `;

    const user = users[0];

    if (!user || !user.isActive) {
      return c.json({ success: false, isLoggedIn: false, data: null });
    }

    // Build profile data based on role
    let profileData = null;
    if (user.role === 'SISWA' && user.siswa_id) {
      profileData = {
        id: user.siswa_id,
        nama: user.siswa_nama,
        nis: user.nis,
        nisn: user.nisn,
        kelasId: user.kelasId,
        kelas: { nama: user.kelas_nama },
        jenisKelamin: user.siswa_jk,
        foto: user.siswa_foto,
        email: user.siswa_email,
      };
    } else if (user.role === 'GURU' && user.guru_id) {
      // Get guru mapel
      const mapelList = await sql`
        SELECT m.id, m.nama, m.kode
        FROM guru_mapel gm
        JOIN mata_pelajaran m ON m.id = gm."mapelId"
        WHERE gm."guruId" = ${user.guru_id}
      `;
      
      profileData = {
        id: user.guru_id,
        nama: user.guru_nama,
        nip: user.nipUsername,
        email: user.guru_email,
        foto: user.guru_foto,
        mapel: mapelList,
      };
    } else if (user.role === 'ADMIN') {
      profileData = {
        email: user.email,
        role: 'ADMIN',
        foto: user.profilePhoto,
      };
    }

    // Refresh session if needed
    if (session.fresh) {
      const sessionCookie = lucia.createSessionCookie(session.id);
      setCookie(c, sessionCookie.name, sessionCookie.value, {
        path: sessionCookie.attributes.path,
        maxAge: sessionCookie.attributes.maxAge,
        httpOnly: true,
        secure: c.env?.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return c.json({
      success: true,
      isLoggedIn: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return c.json({ success: false, isLoggedIn: false, data: null });
  }
});

// ============================================
// FORGOT / RESET PASSWORD
// ============================================

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

// POST /auth/forgot-password - Request password reset
auth.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid('json');

    // Check if user exists
    const users = await sql`SELECT id, email, role FROM users WHERE email = ${email} AND "isActive" = true LIMIT 1`;
    const user = users[0];

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ success: true, message: 'Jika email terdaftar, link reset password telah dikirim.' });
    }

    // Only admin and guru can reset password (siswa uses NISN login)
    if (user.role === 'SISWA') {
      return c.json({ success: true, message: 'Jika email terdaftar, link reset password telah dikirim.' });
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Save token
    await sql`
      INSERT INTO password_reset_tokens (email, token, "expiresAt", "createdAt")
      VALUES (${email}, ${token}, ${expiresAt}, NOW())
    `;

    // Send email via Resend
    const resendApiKey = c.env?.RESEND_API_KEY || '';
    const frontendUrl = c.env?.FRONTEND_URL || 'http://localhost:3000';

    if (resendApiKey) {
      await sendPasswordResetEmail(resendApiKey, email, token, frontendUrl);
    } else {
      console.warn('RESEND_API_KEY not set, skipping email send. Token:', token);
    }

    return c.json({ success: true, message: 'Jika email terdaftar, link reset password telah dikirim.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ success: false, error: 'Terjadi kesalahan' }, 500);
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// POST /auth/reset-password - Reset password with token
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  try {
    const { token, password } = c.req.valid('json');

    // Find valid token
    const tokens = await sql`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND used = false AND "expiresAt" > NOW()
      LIMIT 1
    `;
    const resetToken = tokens[0];

    if (!resetToken) {
      return c.json({ success: false, error: 'Token tidak valid atau sudah expired' }, 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await sql`UPDATE users SET password = ${hashedPassword} WHERE email = ${resetToken.email}`;

    // Mark token as used
    await sql`UPDATE password_reset_tokens SET used = true WHERE id = ${resetToken.id}`;

    return c.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ success: false, error: 'Terjadi kesalahan' }, 500);
  }
});

export default auth;
