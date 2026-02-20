import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const guru = new Hono<HonoEnv>();

// Apply auth middleware to all routes
guru.use('*', authMiddleware, tenantMiddleware);

// Helper to check tier limit for guru
async function checkGuruTierLimit(schoolId: string): Promise<{ allowed: boolean; max: number; current: number; tierLabel: string }> {
  const result = await sql`
    SELECT t.label as "tierLabel", t."maxGuru" as max,
           (SELECT COUNT(*) FROM guru WHERE "schoolId" = ${schoolId}) as current
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

// GET /guru - List all guru
guru.get('/', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const mapelId = c.req.query('mapel');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    let guruList;
    if (mapelId && mapelId !== 'all') {
      guruList = await sql`
        SELECT DISTINCT g.*
        FROM guru g
        JOIN guru_mapel gm ON gm."guruId" = g.id
        WHERE g."schoolId" = ${schoolId} AND gm."mapelId" = ${mapelId}
        ORDER BY g.nama ASC
      `;
    } else {
      guruList = await sql`
        SELECT g.*
        FROM guru g
        WHERE g."schoolId" = ${schoolId}
        ORDER BY g.nama ASC
      `;
    }

    // Get mapel and kelas for each guru
    const guruWithRelations = await Promise.all(
      guruList.map(async (g: any) => {
        const mapelList = await sql`
          SELECT m.id, m.nama, m.kode
          FROM guru_mapel gm
          JOIN mata_pelajaran m ON m.id = gm."mapelId"
          WHERE gm."guruId" = ${g.id}
        `;
        const kelasList = await sql`
          SELECT k.id, k.nama
          FROM guru_kelas gk
          JOIN kelas k ON k.id = gk."kelasId"
          WHERE gk."guruId" = ${g.id}
        `;
        return {
          ...g,
          mapel: mapelList.map((m: any) => ({ mapel: m })),
          kelas: kelasList.map((k: any) => ({ kelas: k })),
        };
      })
    );

    return c.json({ success: true, data: guruWithRelations });
  } catch (error) {
    console.error('Error fetching guru:', error);
    return c.json({ success: false, error: 'Failed to fetch guru' }, 500);
  }
});

// POST /guru - Create new guru
const createGuruSchema = z.object({
  email: z.string().email('Email tidak valid'),
  nipUsername: z.string().min(1, 'NIP wajib diisi'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  alamat: z.string().optional(),
  jenisKelamin: z.enum(['L', 'P']).optional().default('L'),
  isActive: z.boolean().optional().default(true),
  mapelIds: z.array(z.string()).optional().default([]),
  kelasIds: z.array(z.string()).optional().default([]),
});

guru.post('/', requireRole('ADMIN'), zValidator('json', createGuruSchema), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const body = c.req.valid('json');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Check tier limit
    const tierCheck = await checkGuruTierLimit(schoolId);
    if (!tierCheck.allowed) {
      return c.json({
        success: false,
        error: `Batas maksimal guru untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.`
      }, 403);
    }

    // Check if email already exists
    const existingUser = await sql`SELECT * FROM users WHERE email = ${body.email} LIMIT 1`;
    if (existingUser[0]) {
      return c.json({ success: false, error: 'Email sudah digunakan. Silakan gunakan email lain.' }, 400);
    }

    // Check if NIP already exists
    const existingGuru = await sql`SELECT * FROM guru WHERE "nipUsername" = ${body.nipUsername} LIMIT 1`;
    if (existingGuru[0]) {
      return c.json({ success: false, error: 'NIP sudah digunakan. Silakan gunakan NIP lain.' }, 400);
    }

    // Hash default password
    const defaultPassword = 'guru123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create User account first
    const newUserResult = await sql`
      INSERT INTO users (id, "schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${schoolId}, ${body.email}, ${hashedPassword}, 'GURU', ${body.isActive}, NOW(), NOW())
      RETURNING *
    `;
    const newUser = newUserResult[0];

    // Then create Guru with the userId
    const newGuruResult = await sql`
      INSERT INTO guru (id, "schoolId", "userId", "nipUsername", nama, email, alamat, "jenisKelamin", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${schoolId}, ${newUser.id}, ${body.nipUsername}, ${body.nama}, ${body.email}, ${body.alamat || null}, ${body.jenisKelamin}, ${body.isActive}, NOW(), NOW())
      RETURNING *
    `;
    const newGuru = newGuruResult[0];

    // Create mapel relations
    for (const mapelId of body.mapelIds) {
      await sql`INSERT INTO guru_mapel (id, "guruId", "mapelId") VALUES (gen_random_uuid(), ${newGuru.id}, ${mapelId})`;
    }

    // Create kelas relations
    for (const kelasId of body.kelasIds) {
      await sql`INSERT INTO guru_kelas (id, "guruId", "kelasId") VALUES (gen_random_uuid(), ${newGuru.id}, ${kelasId})`;
    }

    return c.json({
      success: true,
      data: newGuru,
      message: 'Guru berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating guru:', error);
    return c.json({ success: false, error: error.message || 'Gagal menambahkan guru' }, 500);
  }
});

// PUT /guru/:id - Update guru
guru.put('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify guru belongs to this school
    const existing = await sql`SELECT * FROM guru WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    }

    const { mapelIds = [], kelasIds = [], ...data } = body;

    // Update guru
    const result = await sql`
      UPDATE guru 
      SET "nipUsername" = ${data.nipUsername}, nama = ${data.nama}, email = ${data.email}, 
          alamat = ${data.alamat || null}, "jenisKelamin" = ${data.jenisKelamin}, "isActive" = ${data.isActive}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Delete existing mapel and kelas relations
    await sql`DELETE FROM guru_mapel WHERE "guruId" = ${id}`;
    await sql`DELETE FROM guru_kelas WHERE "guruId" = ${id}`;

    // Create new mapel relations
    for (const mapelId of mapelIds) {
      await sql`INSERT INTO guru_mapel (id, "guruId", "mapelId") VALUES (gen_random_uuid(), ${id}, ${mapelId})`;
    }

    // Create new kelas relations
    for (const kelasId of kelasIds) {
      await sql`INSERT INTO guru_kelas (id, "guruId", "kelasId") VALUES (gen_random_uuid(), ${id}, ${kelasId})`;
    }

    return c.json({
      success: true,
      data: result[0],
      message: 'Guru berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating guru:', error);
    return c.json({ success: false, error: 'Failed to update guru' }, 500);
  }
});

// DELETE /guru/:id - Delete guru
guru.delete('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Get guru to find userId (verify belongs to this school)
    const guruData = await sql`SELECT "userId" FROM guru WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!guruData[0]) {
      return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    }

    // Delete relations first
    await sql`DELETE FROM guru_mapel WHERE "guruId" = ${id}`;
    await sql`DELETE FROM guru_kelas WHERE "guruId" = ${id}`;
    
    // Delete guru
    await sql`DELETE FROM guru WHERE id = ${id}`;
    
    // Delete User
    await sql`DELETE FROM users WHERE id = ${guruData[0].userId}`;

    return c.json({ success: true, message: 'Guru berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting guru:', error);
    return c.json({ success: false, error: error.message || 'Gagal menghapus guru' }, 500);
  }
});

// GET /guru/profile - Get current guru profile
guru.get('/profile', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    
    const guruData = await sql`
      SELECT g.*, u.email,
        (SELECT COUNT(*) FROM ujian WHERE "guruId" = g.id) as "totalUjian",
        (SELECT COUNT(*) FROM soal s JOIN ujian u ON u.id = s."ujianId" WHERE u."guruId" = g.id) as "totalSoal"
      FROM guru g
      JOIN users u ON u.id = g."userId"
      WHERE g."userId" = ${user.userId}
      LIMIT 1
    `;

    if (!guruData[0]) {
      return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: guruData[0].id,
        nama: guruData[0].nama,
        nip: guruData[0].nip,
        email: guruData[0].email,
        foto: guruData[0].foto,
        totalUjian: parseInt(guruData[0].totalUjian || '0'),
        totalSoal: parseInt(guruData[0].totalSoal || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching guru profile:', error);
    return c.json({ success: false, error: 'Gagal mengambil profil' }, 500);
  }
});

// PUT /guru/profile - Update current guru profile
guru.put('/profile', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { nama, nip, foto } = body;

    // Get guru id
    const guruData = await sql`SELECT id FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    if (!guruData[0]) {
      return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    }

    // Build update query
    const updates: any = {};
    if (nama !== undefined) updates.nama = nama;
    if (nip !== undefined) updates.nip = nip;
    if (foto !== undefined) updates.foto = foto;

    if (Object.keys(updates).length === 0) {
      return c.json({ success: false, error: 'Tidak ada data yang diupdate' }, 400);
    }

    // Update guru
    if (updates.nama && updates.nip && updates.foto) {
      await sql`UPDATE guru SET nama = ${updates.nama}, nip = ${updates.nip}, foto = ${updates.foto}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.nama && updates.nip) {
      await sql`UPDATE guru SET nama = ${updates.nama}, nip = ${updates.nip}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.nama && updates.foto) {
      await sql`UPDATE guru SET nama = ${updates.nama}, foto = ${updates.foto}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.nip && updates.foto) {
      await sql`UPDATE guru SET nip = ${updates.nip}, foto = ${updates.foto}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.nama) {
      await sql`UPDATE guru SET nama = ${updates.nama}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.nip) {
      await sql`UPDATE guru SET nip = ${updates.nip}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    } else if (updates.foto) {
      await sql`UPDATE guru SET foto = ${updates.foto}, "updatedAt" = NOW() WHERE id = ${guruData[0].id}`;
    }

    return c.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating guru profile:', error);
    return c.json({ success: false, error: 'Gagal memperbarui profil' }, 500);
  }
});

// PUT /guru/profile/password - Change password
guru.put('/profile/password', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return c.json({ success: false, error: 'Password lama dan baru harus diisi' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ success: false, error: 'Password minimal 6 karakter' }, 400);
    }

    // Get user with password
    const userData = await sql`SELECT id, password FROM users WHERE id = ${user.userId} LIMIT 1`;
    if (!userData[0]) {
      return c.json({ success: false, error: 'User tidak ditemukan' }, 404);
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, userData[0].password);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Password lama tidak sesuai' }, 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await sql`UPDATE users SET password = ${hashedPassword}, "updatedAt" = NOW() WHERE id = ${user.userId}`;

    return c.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return c.json({ success: false, error: 'Gagal mengubah password' }, 500);
  }
});

export default guru;
