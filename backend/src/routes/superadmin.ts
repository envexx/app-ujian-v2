import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import bcrypt from 'bcryptjs';
import { sign, verify, decode } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

const superadmin = new Hono();

// JWT secret for super admin (separate from regular users)
const SUPERADMIN_JWT_SECRET = process.env.SUPERADMIN_JWT_SECRET || process.env.JWT_SECRET || 'superadmin-secret-key';

// Middleware to check super admin authentication
async function requireSuperAdmin(c: any, next: any) {
  try {
    // Try cookie first, then Authorization header
    let token = getCookie(c, 'superadmin_token');
    
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const payload = await verify(token, SUPERADMIN_JWT_SECRET, 'HS256');
    if (!payload || payload.role !== 'SUPERADMIN') {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    c.set('superadmin', payload);
    await next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
}

// POST /superadmin/auth/login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

superadmin.post('/auth/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    
    console.log('Super admin login attempt:', email);

    const result = await sql`SELECT * FROM super_admins WHERE email = ${email} AND "isActive" = true LIMIT 1`;
    const admin = result[0];
    
    console.log('Super admin found:', admin ? 'yes' : 'no');

    if (!admin) {
      // Check if any super admin exists
      const count = await sql`SELECT COUNT(*) as count FROM super_admins`;
      console.log('Total super admins in DB:', count[0]?.count);
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return c.json({ success: false, error: 'Email atau password salah' }, 401);
    }

    const token = await sign(
      {
        id: admin.id,
        email: admin.email,
        nama: admin.nama,
        role: 'SUPERADMIN',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
      SUPERADMIN_JWT_SECRET
    );

    // Set cookie for same-origin requests
    setCookie(c, 'superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Also return token in response for cross-origin scenarios
    return c.json({
      success: true,
      message: 'Login berhasil',
      data: { id: admin.id, email: admin.email, nama: admin.nama },
      token, // Include token for localStorage storage
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// POST /superadmin/auth/logout
superadmin.post('/auth/logout', async (c) => {
  deleteCookie(c, 'superadmin_token', { path: '/' });
  return c.json({ success: true, message: 'Logout berhasil' });
});

// GET /superadmin/auth/session
superadmin.get('/auth/session', async (c) => {
  try {
    // Try cookie first, then Authorization header
    let token = getCookie(c, 'superadmin_token');
    
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    console.log('Session check - token exists:', !!token);
    
    if (!token) {
      return c.json({ isLoggedIn: false });
    }

    const payload = await verify(token, SUPERADMIN_JWT_SECRET, 'HS256');
    console.log('Session check - payload:', payload ? 'valid' : 'invalid');
    
    if (!payload || payload.role !== 'SUPERADMIN') {
      return c.json({ isLoggedIn: false });
    }

    return c.json({
      isLoggedIn: true,
      success: true,
      data: { id: payload.id, email: payload.email, nama: payload.nama },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return c.json({ isLoggedIn: false });
  }
});

// GET /superadmin/stats - Dashboard statistics
superadmin.get('/stats', requireSuperAdmin, async (c) => {
  try {
    // Schools stats
    const schoolsTotal = await sql`SELECT COUNT(*) as count FROM schools`;
    const schoolsActive = await sql`SELECT COUNT(*) as count FROM schools WHERE "isActive" = true`;
    const schoolsInactive = await sql`SELECT COUNT(*) as count FROM schools WHERE "isActive" = false`;

    // Users stats
    const usersTotal = await sql`SELECT COUNT(*) as count FROM users`;
    const guruTotal = await sql`SELECT COUNT(*) as count FROM guru`;
    const siswaTotal = await sql`SELECT COUNT(*) as count FROM siswa`;

    // Content stats
    const ujianTotal = await sql`SELECT COUNT(*) as count FROM ujian`;
    
    // Tier breakdown
    const tierBreakdown = await sql`
      SELECT t.label, COUNT(s.id) as count 
      FROM tiers t 
      LEFT JOIN schools s ON s."tierId" = t.id 
      GROUP BY t.id, t.label 
      ORDER BY t.urutan
    `;

    // Recent schools
    const recentSchools = await sql`
      SELECT s.id, s.nama, s.kota, s.jenjang, s."isActive", s."createdAt",
             (SELECT COUNT(*) FROM guru g WHERE g."schoolId" = s.id) as guru_count,
             (SELECT COUNT(*) FROM siswa si WHERE si."schoolId" = s.id) as siswa_count
      FROM schools s 
      ORDER BY s."createdAt" DESC 
      LIMIT 5
    `;

    return c.json({
      success: true,
      data: {
        schools: {
          total: parseInt(schoolsTotal[0].count),
          active: parseInt(schoolsActive[0].count),
          inactive: parseInt(schoolsInactive[0].count),
        },
        users: {
          total: parseInt(usersTotal[0].count),
          guru: parseInt(guruTotal[0].count),
          siswa: parseInt(siswaTotal[0].count),
        },
        content: {
          ujian: parseInt(ujianTotal[0].count),
        },
        tierBreakdown: tierBreakdown.reduce((acc: any, t: any) => {
          acc[t.label] = parseInt(t.count);
          return acc;
        }, {}),
        recentSchools: recentSchools.map((s: any) => ({
          id: s.id,
          nama: s.nama,
          kota: s.kota,
          jenjang: s.jenjang,
          isActive: s.isActive,
          createdAt: s.createdAt,
          _count: { guru: parseInt(s.guru_count), siswa: parseInt(s.siswa_count) },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

// GET /superadmin/schools - List all schools
superadmin.get('/schools', requireSuperAdmin, async (c) => {
  try {
    const schools = await sql`
      SELECT s.*, t.label as tier_label,
             (SELECT COUNT(*) FROM guru g WHERE g."schoolId" = s.id) as guru_count,
             (SELECT COUNT(*) FROM siswa si WHERE si."schoolId" = s.id) as siswa_count,
             (SELECT COUNT(*) FROM ujian u WHERE u."schoolId" = s.id) as ujian_count
      FROM schools s
      LEFT JOIN tiers t ON t.id = s."tierId"
      ORDER BY s."createdAt" DESC
    `;

    return c.json({
      success: true,
      data: schools.map((s: any) => ({
        ...s,
        tierLabel: s.tier_label,
        _count: {
          guru: parseInt(s.guru_count),
          siswa: parseInt(s.siswa_count),
          ujian: parseInt(s.ujian_count),
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return c.json({ success: false, error: 'Failed to fetch schools' }, 500);
  }
});

// PUT /superadmin/schools/:id - Update school
superadmin.put('/schools/:id', requireSuperAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const result = await sql`
      UPDATE schools 
      SET nama = COALESCE(${body.nama}, nama),
          "isActive" = COALESCE(${body.isActive}, "isActive"),
          "tierId" = COALESCE(${body.tierId}, "tierId"),
          "expiredAt" = COALESCE(${body.expiredAt}, "expiredAt"),
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating school:', error);
    return c.json({ success: false, error: 'Failed to update school' }, 500);
  }
});

// DELETE /superadmin/schools/:id - Delete school
superadmin.delete('/schools/:id', requireSuperAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    const result = await sql`DELETE FROM schools WHERE id = ${id} RETURNING id`;

    if (!result[0]) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    return c.json({ success: true, message: 'School deleted' });
  } catch (error) {
    console.error('Error deleting school:', error);
    return c.json({ success: false, error: 'Failed to delete school' }, 500);
  }
});

// GET /superadmin/tiers - List all tiers
superadmin.get('/tiers', requireSuperAdmin, async (c) => {
  try {
    const tiers = await sql`
      SELECT t.*, 
             (SELECT COUNT(*) FROM schools s WHERE s."tierId" = t.id) as school_count
      FROM tiers t 
      ORDER BY t.urutan ASC
    `;

    return c.json({
      success: true,
      data: tiers.map((t: any) => ({
        ...t,
        _count: { schools: parseInt(t.school_count) },
      })),
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return c.json({ success: false, error: 'Failed to fetch tiers' }, 500);
  }
});

// POST /superadmin/tiers - Create tier
superadmin.post('/tiers', requireSuperAdmin, async (c) => {
  try {
    const body = await c.req.json();

    const result = await sql`
      INSERT INTO tiers (nama, label, harga, "maxSiswa", "maxGuru", "maxKelas", "maxMapel", "maxUjian", "maxStorage", fitur, "isActive", urutan, "createdAt", "updatedAt")
      VALUES (${body.nama}, ${body.label}, ${body.harga || 0}, ${body.maxSiswa || 50}, ${body.maxGuru || 5}, 
              ${body.maxKelas || 5}, ${body.maxMapel || 10}, ${body.maxUjian || 10}, ${body.maxStorage || 500},
              ${JSON.stringify(body.fitur || {})}, true, ${body.urutan || 0}, NOW(), NOW())
      RETURNING *
    `;

    return c.json({ success: true, data: result[0] }, 201);
  } catch (error) {
    console.error('Error creating tier:', error);
    return c.json({ success: false, error: 'Failed to create tier' }, 500);
  }
});

// PUT /superadmin/tiers/:id - Update tier
superadmin.put('/tiers/:id', requireSuperAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const result = await sql`
      UPDATE tiers 
      SET nama = COALESCE(${body.nama}, nama),
          label = COALESCE(${body.label}, label),
          harga = COALESCE(${body.harga}, harga),
          "maxSiswa" = COALESCE(${body.maxSiswa}, "maxSiswa"),
          "maxGuru" = COALESCE(${body.maxGuru}, "maxGuru"),
          "maxKelas" = COALESCE(${body.maxKelas}, "maxKelas"),
          "maxMapel" = COALESCE(${body.maxMapel}, "maxMapel"),
          "maxUjian" = COALESCE(${body.maxUjian}, "maxUjian"),
          "maxStorage" = COALESCE(${body.maxStorage}, "maxStorage"),
          fitur = COALESCE(${body.fitur ? JSON.stringify(body.fitur) : null}::jsonb, fitur),
          "isActive" = COALESCE(${body.isActive}, "isActive"),
          urutan = COALESCE(${body.urutan}, urutan),
          "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!result[0]) {
      return c.json({ success: false, error: 'Tier not found' }, 404);
    }

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating tier:', error);
    return c.json({ success: false, error: 'Failed to update tier' }, 500);
  }
});

// DELETE /superadmin/tiers/:id - Delete tier
superadmin.delete('/tiers/:id', requireSuperAdmin, async (c) => {
  try {
    const id = c.req.param('id');

    // Check if any schools use this tier
    const schoolsUsingTier = await sql`SELECT COUNT(*) as count FROM schools WHERE "tierId" = ${id}`;
    if (parseInt(schoolsUsingTier[0].count) > 0) {
      return c.json({ success: false, error: 'Cannot delete tier with active schools' }, 400);
    }

    const result = await sql`DELETE FROM tiers WHERE id = ${id} RETURNING id`;

    if (!result[0]) {
      return c.json({ success: false, error: 'Tier not found' }, 404);
    }

    return c.json({ success: true, message: 'Tier deleted' });
  } catch (error) {
    console.error('Error deleting tier:', error);
    return c.json({ success: false, error: 'Failed to delete tier' }, 500);
  }
});

// POST /superadmin/create - Create super admin (only if none exists)
superadmin.post('/create', async (c) => {
  try {
    // Check if any super admin exists
    const existing = await sql`SELECT COUNT(*) as count FROM super_admins`;
    if (parseInt(existing[0].count) > 0) {
      return c.json({ success: false, error: 'Super admin already exists' }, 400);
    }

    const body = await c.req.json();
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const result = await sql`
      INSERT INTO super_admins (email, password, nama, "isActive", "createdAt", "updatedAt")
      VALUES (${body.email}, ${hashedPassword}, ${body.nama}, true, NOW(), NOW())
      RETURNING id, email, nama
    `;

    return c.json({ success: true, data: result[0] }, 201);
  } catch (error) {
    console.error('Error creating super admin:', error);
    return c.json({ success: false, error: 'Failed to create super admin' }, 500);
  }
});

export default superadmin;
