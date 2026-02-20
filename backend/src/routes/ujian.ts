import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const ujian = new Hono<HonoEnv>();

// Apply auth middleware to all routes
ujian.use('*', authMiddleware, tenantMiddleware);

// Helper to check tier limit for ujian
async function checkUjianTierLimit(schoolId: string): Promise<{ allowed: boolean; max: number; current: number; tierLabel: string }> {
  const result = await sql`
    SELECT t.label as "tierLabel", t."maxUjian" as max,
           (SELECT COUNT(*) FROM ujian WHERE "schoolId" = ${schoolId}) as current
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

// GET /ujian - List all ujian for guru
ujian.get('/', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const statusFilter = c.req.query('status');

    // Get guru data
    const guruResult = await sql`SELECT * FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    const guru = guruResult[0];

    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Get ujian list
    let ujianList;
    if (statusFilter && statusFilter !== 'all') {
      ujianList = await sql`
        SELECT u.*, m.nama as mapel_nama,
               (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count,
               (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id) as submission_count
        FROM ujian u
        LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
        WHERE u."guruId" = ${guru.id} AND u.status = ${statusFilter}
        ORDER BY u."startUjian" DESC
      `;
    } else {
      ujianList = await sql`
        SELECT u.*, m.nama as mapel_nama,
               (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count,
               (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id) as submission_count
        FROM ujian u
        LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
        WHERE u."guruId" = ${guru.id}
        ORDER BY u."startUjian" DESC
      `;
    }

    // Get kelas list for this guru
    const kelasList = await sql`
      SELECT DISTINCT k.id, k.nama
      FROM guru_kelas gk
      JOIN kelas k ON k.id = gk."kelasId"
      WHERE gk."guruId" = ${guru.id}
      ORDER BY k.nama ASC
    `;

    // Get mapel list for this guru
    const mapelList = await sql`
      SELECT m.id, m.nama
      FROM guru_mapel gm
      JOIN mata_pelajaran m ON m.id = gm."mapelId"
      WHERE gm."guruId" = ${guru.id}
    `;

    return c.json({
      success: true,
      data: {
        ujian: ujianList.map((u: any) => ({
          id: u.id,
          judul: u.judul,
          deskripsi: u.deskripsi,
          mapel: u.mapel_nama,
          mapelId: u.mapelId,
          kelas: u.kelas,
          startUjian: u.startUjian,
          endUjian: u.endUjian,
          shuffleQuestions: u.shuffleQuestions,
          showScore: u.showScore,
          status: u.status,
          totalSoal: parseInt(u.soal_count || '0'),
          totalSubmissions: parseInt(u.submission_count || '0'),
          createdAt: u.createdAt,
        })),
        kelasList: kelasList.map((k: any) => ({ id: k.id, nama: k.nama })),
        mapelList: mapelList.map((m: any) => ({ id: m.id, nama: m.nama })),
      },
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian' }, 500);
  }
});

// POST /ujian - Create new ujian
const createUjianSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi'),
  deskripsi: z.string().optional(),
  mapelId: z.string().min(1, 'Mata pelajaran wajib dipilih'),
  kelas: z.union([z.string(), z.array(z.string())]),
  startUjian: z.string(),
  endUjian: z.string(),
  shuffleQuestions: z.boolean().optional().default(false),
  showScore: z.boolean().optional().default(true),
});

ujian.post('/', requireRole('GURU'), zValidator('json', createUjianSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');

    // Validate dates (frontend sends Jakarta local time strings)
    if (!body.startUjian || !body.endUjian) {
      return c.json({ success: false, error: 'Waktu mulai dan akhir harus diisi' }, 400);
    }

    if (new Date(body.endUjian) <= new Date(body.startUjian)) {
      return c.json({ success: false, error: 'Waktu akhir harus lebih besar dari waktu mulai' }, 400);
    }

    // Get guru data
    const guruResult = await sql`SELECT * FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    const guru = guruResult[0];

    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Check tier limit
    const tierCheck = await checkUjianTierLimit(guru.schoolId);
    if (!tierCheck.allowed) {
      return c.json({
        success: false,
        error: `Batas maksimal ujian untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.`
      }, 403);
    }

    const kelasArray = Array.isArray(body.kelas) ? body.kelas : [body.kelas];

    // Create ujian as draft — store datetime strings directly (Jakarta local time)
    const result = await sql`
      INSERT INTO ujian ("schoolId", judul, deskripsi, "mapelId", "guruId", kelas, "startUjian", "endUjian", "shuffleQuestions", "showScore", status, "createdAt", "updatedAt")
      VALUES (${guru.schoolId}, ${body.judul}, ${body.deskripsi || null}, ${body.mapelId}, ${guru.id}, ${kelasArray}, ${body.startUjian}, ${body.endUjian}, ${body.shuffleQuestions}, ${body.showScore}, 'draft', NOW(), NOW())
      RETURNING *
    `;

    return c.json({
      success: true,
      data: result[0],
      message: 'Ujian berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating ujian:', error);
    return c.json({ success: false, error: 'Failed to create ujian' }, 500);
  }
});

// PUT /ujian/:id - Update ujian status
ujian.put('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    // Get guru data
    const guruResult = await sql`SELECT * FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    const guru = guruResult[0];

    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Validate: If activating, must have at least 1 soal
    if (status === 'aktif') {
      const soalCount = await sql`SELECT COUNT(*) as count FROM soal WHERE "ujianId" = ${id}`;
      if (parseInt(soalCount[0]?.count || '0') === 0) {
        return c.json({
          success: false,
          error: 'Tidak dapat mengaktifkan ujian. Minimal harus ada 1 soal.'
        }, 400);
      }
    }

    // Update ujian status
    const result = await sql`
      UPDATE ujian SET status = ${status}, "updatedAt" = NOW()
      WHERE id = ${id} AND "guruId" = ${guru.id}
      RETURNING *
    `;

    if (!result[0]) {
      return c.json({ success: false, error: 'Ujian not found or unauthorized' }, 404);
    }

    return c.json({ success: true, message: 'Status ujian berhasil diupdate' });
  } catch (error) {
    console.error('Error updating ujian:', error);
    return c.json({ success: false, error: 'Failed to update ujian' }, 500);
  }
});

// DELETE /ujian/:id - Delete ujian
ujian.delete('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // Get guru data
    const guruResult = await sql`SELECT * FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    const guru = guruResult[0];

    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Delete soal first
    await sql`DELETE FROM soal WHERE "ujianId" = ${id}`;
    
    // Delete ujian (only if owned by this guru)
    await sql`DELETE FROM ujian WHERE id = ${id} AND "guruId" = ${guru.id}`;

    return c.json({ success: true, message: 'Ujian berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting ujian:', error);
    return c.json({ success: false, error: 'Failed to delete ujian' }, 500);
  }
});

// GET /ujian/:id - Get ujian detail
ujian.get('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // Get guru data
    const guruResult = await sql`SELECT * FROM guru WHERE "userId" = ${user.userId} LIMIT 1`;
    const guru = guruResult[0];

    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Get ujian detail
    const ujianResult = await sql`
      SELECT u.*, m.nama as mapel_nama, m.kode as mapel_kode,
             (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id) as submission_count
      FROM ujian u
      LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u.id = ${id} AND u."guruId" = ${guru.id}
      LIMIT 1
    `;

    if (!ujianResult[0]) {
      return c.json({ success: false, error: 'Ujian not found' }, 404);
    }

    // Get soal
    const soalList = await sql`
      SELECT * FROM soal WHERE "ujianId" = ${id} ORDER BY urutan ASC
    `;

    const ujianDetail = {
      ...ujianResult[0],
      mapel: { nama: ujianResult[0].mapel_nama, kode: ujianResult[0].mapel_kode },
      soal: soalList,
      _count: { submissions: parseInt(ujianResult[0].submission_count || '0') },
    };

    return c.json({ success: true, data: ujianDetail });
  } catch (error) {
    console.error('Error fetching ujian detail:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian detail' }, 500);
  }
});

export default ujian;
