import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const mapel = new Hono();

// Apply auth middleware to all routes
mapel.use('*', authMiddleware, tenantMiddleware);

// Helper to check tier limit for mapel
async function checkMapelTierLimit(schoolId: string): Promise<{ allowed: boolean; max: number; current: number; tierLabel: string }> {
  const result = await sql`
    SELECT t.label as "tierLabel", t."maxMapel" as max,
           (SELECT COUNT(*) FROM mata_pelajaran WHERE "schoolId" = ${schoolId}) as current
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

// GET /mapel - List all mata pelajaran
mapel.get('/', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    const mapelList = await sql`
      SELECT m.*
      FROM mata_pelajaran m
      WHERE m."schoolId" = ${schoolId}
      ORDER BY m.nama ASC
    `;

    // Get guru for each mapel
    const mapelWithGuru = await Promise.all(
      mapelList.map(async (m: any) => {
        const guruList = await sql`
          SELECT g.id, g.nama
          FROM guru_mapel gm
          JOIN guru g ON g.id = gm."guruId"
          WHERE gm."mapelId" = ${m.id}
        `;
        return { ...m, guru: guruList.map((g: any) => ({ guru: g })) };
      })
    );

    return c.json({ success: true, data: mapelWithGuru });
  } catch (error) {
    console.error('Error fetching mapel:', error);
    return c.json({ success: false, error: 'Failed to fetch mapel' }, 500);
  }
});

// POST /mapel - Create new mata pelajaran
const createMapelSchema = z.object({
  nama: z.string().min(1, 'Nama mata pelajaran wajib diisi'),
  kode: z.string().min(1, 'Kode mata pelajaran wajib diisi'),
  jenis: z.string().optional(),
  jamPerMinggu: z.number().optional(),
});

mapel.post('/', requireRole('ADMIN'), zValidator('json', createMapelSchema), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const body = c.req.valid('json');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Check tier limit
    const tierCheck = await checkMapelTierLimit(schoolId);
    if (!tierCheck.allowed) {
      return c.json({
        success: false,
        error: `Batas maksimal mata pelajaran untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.`
      }, 403);
    }

    // Check duplicate kode
    const existingKode = await sql`SELECT * FROM mata_pelajaran WHERE kode = ${body.kode} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (existingKode[0]) {
      return c.json({ success: false, error: `Kode "${body.kode}" sudah digunakan` }, 409);
    }

    const result = await sql`
      INSERT INTO mata_pelajaran ("schoolId", nama, kode, jenis, "jamPerMinggu", "createdAt", "updatedAt")
      VALUES (${schoolId}, ${body.nama}, ${body.kode}, ${body.jenis || 'wajib'}, ${body.jamPerMinggu || 2}, NOW(), NOW())
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Mata pelajaran berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating mapel:', error);
    return c.json({ success: false, error: error?.message || 'Gagal menambahkan mata pelajaran' }, 500);
  }
});

// PUT /mapel/:id - Update mata pelajaran
mapel.put('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');
    const body = await c.req.json();

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify mapel belongs to this school
    const existing = await sql`SELECT * FROM mata_pelajaran WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Mata pelajaran tidak ditemukan' }, 404);
    }

    const result = await sql`
      UPDATE mata_pelajaran 
      SET nama = ${body.nama}, kode = ${body.kode}, jenis = ${body.jenis || 'wajib'}, "jamPerMinggu" = ${body.jamPerMinggu || 2}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Mata pelajaran berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating mapel:', error);
    return c.json({ success: false, error: error?.message || 'Failed to update mapel' }, 500);
  }
});

// DELETE /mapel/:id - Delete mata pelajaran
mapel.delete('/:id', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;
    const id = c.req.param('id');

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Verify mapel belongs to this school
    const existing = await sql`SELECT * FROM mata_pelajaran WHERE id = ${id} AND "schoolId" = ${schoolId} LIMIT 1`;
    if (!existing[0]) {
      return c.json({ success: false, error: 'Mata pelajaran tidak ditemukan' }, 404);
    }

    await sql`DELETE FROM mata_pelajaran WHERE id = ${id}`;

    return c.json({ success: true, message: 'Mata pelajaran berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting mapel:', error);
    return c.json({ success: false, error: 'Failed to delete mapel' }, 500);
  }
});

export default mapel;
