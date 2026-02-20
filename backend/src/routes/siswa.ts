import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const siswa = new Hono<HonoEnv>();

// Apply auth middleware to all routes
siswa.use('*', authMiddleware, tenantMiddleware);

// Helper to check tier limit for siswa
async function checkSiswaTierLimit(schoolId: string): Promise<{ allowed: boolean; max: number; current: number; tierLabel: string }> {
  const result = await sql`
    SELECT t.label as "tierLabel", t."maxSiswa" as max,
           (SELECT COUNT(*) FROM siswa WHERE "schoolId" = ${schoolId}) as current
    FROM schools s
    JOIN tiers t ON t.id = s."tierId"
    WHERE s.id = ${schoolId}
  `;
  const data = result[0];
  if (!data) return { allowed: true, max: 999, current: 0, tierLabel: 'Unknown' };
  return {
    allowed: parseInt(data.current) < data.max,
    max: data.max,
    current: parseInt(data.current),
    tierLabel: data.tierLabel,
  };
}

// GET /siswa - List all siswa
siswa.get('/', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const kelasId = c.req.query('kelas');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    let siswaList;
    if (kelasId && kelasId !== 'all') {
      siswaList = await sql`
        SELECT s.*, k.id as kelas_id, k.nama as kelas_nama, k.tingkat as kelas_tingkat,
               u.id as user_id, u.email as user_email, u.role as user_role, u."isActive" as user_active
        FROM siswa s
        LEFT JOIN kelas k ON k.id = s."kelasId"
        LEFT JOIN users u ON u.id = s."userId"
        WHERE s."schoolId" = ${schoolId} AND s."kelasId" = ${kelasId}
        ORDER BY s.nama ASC
      `;
    } else {
      siswaList = await sql`
        SELECT s.*, k.id as kelas_id, k.nama as kelas_nama, k.tingkat as kelas_tingkat,
               u.id as user_id, u.email as user_email, u.role as user_role, u."isActive" as user_active
        FROM siswa s
        LEFT JOIN kelas k ON k.id = s."kelasId"
        LEFT JOIN users u ON u.id = s."userId"
        WHERE s."schoolId" = ${schoolId}
        ORDER BY s.nama ASC
      `;
    }

    return c.json({
      success: true,
      data: siswaList.map((s: any) => ({
        ...s,
        kelas: s.kelas_id ? { id: s.kelas_id, nama: s.kelas_nama, tingkat: s.kelas_tingkat } : null,
        user: s.user_id ? { id: s.user_id, email: s.user_email, role: s.user_role, isActive: s.user_active } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching siswa:', error);
    return c.json({ success: false, error: 'Failed to fetch siswa' }, 500);
  }
});

// POST /siswa - Create new siswa
const createSiswaSchema = z.object({
  nis: z.string().min(1, 'NIS wajib diisi'),
  nisn: z.string().min(1, 'NISN wajib diisi'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  kelasId: z.string().min(1, 'Kelas wajib diisi'),
  jenisKelamin: z.enum(['L', 'P']),
  tanggalLahir: z.string().optional(),
  alamat: z.string().optional(),
  noTelp: z.string().optional(),
  namaWali: z.string().optional(),
  noTelpWali: z.string().optional(),
});

siswa.post('/', requireRole('ADMIN'), zValidator('json', createSiswaSchema), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const body = c.req.valid('json');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Check tier limit
    const tierCheck = await checkSiswaTierLimit(schoolId);
    if (!tierCheck.allowed) {
      return c.json({
        success: false,
        error: `Batas maksimal siswa untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.`
      }, 403);
    }

    // Check duplicate NIS
    const existingNis = await sql`SELECT * FROM siswa WHERE nis = ${body.nis} LIMIT 1`;
    if (existingNis[0]) {
      return c.json({ success: false, error: `NIS "${body.nis}" sudah digunakan oleh siswa lain` }, 409);
    }

    // Check duplicate NISN
    const existingNisn = await sql`SELECT * FROM siswa WHERE nisn = ${body.nisn} LIMIT 1`;
    if (existingNisn[0]) {
      return c.json({ success: false, error: `NISN "${body.nisn}" sudah digunakan oleh siswa lain` }, 409);
    }

    // Auto-generate email for User record
    const autoEmail = `${body.nis}@siswa.local`;

    // Check if auto-generated email already exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${autoEmail} LIMIT 1`;
    if (existingUser[0]) {
      return c.json({ success: false, error: `Akun dengan NIS "${body.nis}" sudah ada di sistem` }, 409);
    }

    // Hash password default (NISN)
    const hashedPassword = await bcrypt.hash(body.nisn, 10);

    // Convert tanggalLahir if provided
    let parsedTanggalLahir: string | null = null;
    if (body.tanggalLahir) {
      parsedTanggalLahir = body.tanggalLahir;
    }

    // Create User account first
    const newUserResult = await sql`
      INSERT INTO users (id, "schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${schoolId}, ${autoEmail}, ${hashedPassword}, 'SISWA', true, NOW(), NOW())
      RETURNING *
    `;
    const newUser = newUserResult[0];

    // Create siswa
    const newSiswaResult = await sql`
      INSERT INTO siswa (id, "schoolId", "userId", nis, nisn, nama, "kelasId", "jenisKelamin", "tanggalLahir", alamat, "noTelp", "namaWali", "noTelpWali", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${schoolId}, ${newUser.id}, ${body.nis}, ${body.nisn}, ${body.nama}, ${body.kelasId}, ${body.jenisKelamin}, ${parsedTanggalLahir}, ${body.alamat || null}, ${body.noTelp || null}, ${body.namaWali || null}, ${body.noTelpWali || null}, NOW(), NOW())
      RETURNING *
    `;

    return c.json({
      success: true,
      data: newSiswaResult[0],
      message: `Siswa berhasil ditambahkan. Login: NISN/NIS, Password: ${body.nisn}`,
    });
  } catch (error: any) {
    console.error('Error creating siswa:', error);
    return c.json({ success: false, error: error?.message || 'Gagal menambahkan siswa' }, 500);
  }
});

// PUT /siswa/:id - Update siswa
siswa.put('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify siswa belongs to this school
    const existing = await sql`SELECT * FROM siswa WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Siswa tidak ditemukan' }, 404);
    }

    const result = await sql`
      UPDATE siswa 
      SET nis = ${body.nis}, nisn = ${body.nisn}, nama = ${body.nama}, "kelasId" = ${body.kelasId},
          "jenisKelamin" = ${body.jenisKelamin}, "tanggalLahir" = ${body.tanggalLahir || null},
          alamat = ${body.alamat || null}, "noTelp" = ${body.noTelp || null},
          "namaWali" = ${body.namaWali || null}, "noTelpWali" = ${body.noTelpWali || null}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Siswa berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating siswa:', error);
    return c.json({ success: false, error: error?.message || 'Failed to update siswa' }, 500);
  }
});

// DELETE /siswa/:id - Delete siswa
siswa.delete('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify siswa belongs to this school and get userId
    const existing = await sql`SELECT "userId" FROM siswa WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Siswa tidak ditemukan' }, 404);
    }

    // Delete siswa first
    await sql`DELETE FROM siswa WHERE id = ${id}`;
    
    // Delete user
    if (existing[0].userId) {
      await sql`DELETE FROM users WHERE id = ${existing[0].userId}`;
    }

    return c.json({ success: true, message: 'Siswa berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    return c.json({ success: false, error: 'Failed to delete siswa' }, 500);
  }
});

export default siswa;
