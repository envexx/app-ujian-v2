import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const kelas = new Hono<HonoEnv>();

// Apply auth middleware to all routes
kelas.use('*', authMiddleware, tenantMiddleware);

// Helper to check tier limit
async function checkTierLimit(schoolId: string, resource: string): Promise<{ allowed: boolean; max: number; current: number; tierLabel: string }> {
  const result = await sql`
    SELECT t.label as "tierLabel", t."maxKelas" as max,
           (SELECT COUNT(*) FROM kelas WHERE "schoolId" = ${schoolId}) as current
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

// GET /kelas - List all kelas
kelas.get('/', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    const kelasList = await sql`
      SELECT k.*, 
             g.id as wali_id, g.nama as wali_nama,
             (SELECT COUNT(*) FROM siswa WHERE "kelasId" = k.id) as siswa_count
      FROM kelas k
      LEFT JOIN guru g ON g.id = k."waliKelasId"
      WHERE k."schoolId" = ${schoolId}
      ORDER BY k.tingkat ASC, k.nama ASC
    `;

    return c.json({
      success: true,
      data: kelasList.map((k: any) => ({
        ...k,
        _count: { siswa: parseInt(k.siswa_count || '0') },
        waliKelas: k.wali_id ? { id: k.wali_id, nama: k.wali_nama } : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return c.json({ success: false, error: 'Failed to fetch kelas' }, 500);
  }
});

// POST /kelas - Create new kelas
const createKelasSchema = z.object({
  nama: z.string().min(1, 'Nama kelas wajib diisi'),
  tingkat: z.string(),
  waliKelasId: z.string().optional(),
  tahunAjaran: z.string().optional(),
});

kelas.post('/', requireRole('ADMIN'), zValidator('json', createKelasSchema), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const body = c.req.valid('json');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Check tier limit
    const tierCheck = await checkTierLimit(schoolId, 'kelas');
    if (!tierCheck.allowed) {
      return c.json({
        success: false,
        error: `Batas maksimal kelas untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.`
      }, 403);
    }

    const tahunAjaran = body.tahunAjaran || new Date().getFullYear().toString();

    const result = await sql`
      INSERT INTO kelas (id, "schoolId", nama, tingkat, "waliKelasId", "tahunAjaran", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${schoolId}, ${body.nama}, ${body.tingkat}, ${body.waliKelasId || null}, ${tahunAjaran}, NOW(), NOW())
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Kelas berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating kelas:', error);
    return c.json({ success: false, error: error?.message || 'Gagal menambahkan kelas' }, 500);
  }
});

// PUT /kelas/:id - Update kelas
kelas.put('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify kelas belongs to this school
    const existing = await sql`SELECT * FROM kelas WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Kelas tidak ditemukan' }, 404);
    }

    const result = await sql`
      UPDATE kelas 
      SET nama = ${body.nama}, tingkat = ${body.tingkat}, "waliKelasId" = ${body.waliKelasId || null}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Kelas berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating kelas:', error);
    return c.json({ success: false, error: error?.message || 'Failed to update kelas' }, 500);
  }
});

// DELETE /kelas/:id - Delete kelas
kelas.delete('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify kelas belongs to this school
    const existing = await sql`SELECT * FROM kelas WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Kelas tidak ditemukan' }, 404);
    }

    // Check if kelas has students
    const siswaCount = await sql`SELECT COUNT(*) as count FROM siswa WHERE "kelasId" = ${id}`;
    if (parseInt(siswaCount[0]?.count || '0') > 0) {
      return c.json({
        success: false,
        error: `Kelas masih memiliki ${siswaCount[0].count} siswa. Pindahkan siswa terlebih dahulu.`
      }, 400);
    }

    await sql`DELETE FROM kelas WHERE id = ${id}`;

    return c.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return c.json({ success: false, error: 'Failed to delete kelas' }, 500);
  }
});

export default kelas;
