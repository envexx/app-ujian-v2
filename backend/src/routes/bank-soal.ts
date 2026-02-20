import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const bankSoal = new Hono();

bankSoal.use('*', authMiddleware, tenantMiddleware);

// Helper: get guru by userId
async function getGuru(userId: string) {
  const result = await sql`
    SELECT g.*, u."schoolId" FROM guru g
    JOIN users u ON u.id = g."userId"
    WHERE g."userId" = ${userId} LIMIT 1
  `;
  return result[0];
}

// GET /guru/bank-soal - List all bank soal for guru
bankSoal.get('/', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const mapelId = c.req.query('mapelId');
    const tipe = c.req.query('tipe');
    const search = c.req.query('search');

    // Build query based on filters - Neon doesn't support conditional fragments
    let soalList;
    if (mapelId && tipe && search) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs."mapelId" = ${mapelId}
          AND bs.tipe = ${tipe}
          AND (bs.pertanyaan ILIKE ${'%' + search + '%'} OR ${search} = ANY(bs.tags))
        ORDER BY bs."createdAt" DESC
      `;
    } else if (mapelId && tipe) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs."mapelId" = ${mapelId}
          AND bs.tipe = ${tipe}
        ORDER BY bs."createdAt" DESC
      `;
    } else if (mapelId && search) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs."mapelId" = ${mapelId}
          AND (bs.pertanyaan ILIKE ${'%' + search + '%'} OR ${search} = ANY(bs.tags))
        ORDER BY bs."createdAt" DESC
      `;
    } else if (tipe && search) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs.tipe = ${tipe}
          AND (bs.pertanyaan ILIKE ${'%' + search + '%'} OR ${search} = ANY(bs.tags))
        ORDER BY bs."createdAt" DESC
      `;
    } else if (mapelId) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs."mapelId" = ${mapelId}
        ORDER BY bs."createdAt" DESC
      `;
    } else if (tipe) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND bs.tipe = ${tipe}
        ORDER BY bs."createdAt" DESC
      `;
    } else if (search) {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
          AND (bs.pertanyaan ILIKE ${'%' + search + '%'} OR ${search} = ANY(bs.tags))
        ORDER BY bs."createdAt" DESC
      `;
    } else {
      soalList = await sql`
        SELECT bs.*, m.nama as mapel_nama, g.nama as guru_nama
        FROM bank_soal bs
        LEFT JOIN mata_pelajaran m ON m.id = bs."mapelId"
        LEFT JOIN guru g ON g.id = bs."guruId"
        WHERE bs."schoolId" = ${guru.schoolId}
        ORDER BY bs."createdAt" DESC
      `;
    }

    return c.json({
      success: true,
      data: soalList.map((s: any) => ({
        id: s.id,
        mapelId: s.mapelId,
        mapel: s.mapel_nama,
        guruId: s.guruId,
        guruNama: s.guru_nama,
        tipe: s.tipe,
        pertanyaan: s.pertanyaan,
        data: s.data,
        poin: s.poin,
        kelas: s.kelas || [],
        tags: s.tags || [],
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching bank soal:', error);
    return c.json({ success: false, error: 'Failed to fetch bank soal' }, 500);
  }
});

// GET /guru/bank-soal/stats - Get stats for bank soal
bankSoal.get('/stats', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE tipe = 'PILIHAN_GANDA') as pilihan_ganda,
        COUNT(*) FILTER (WHERE tipe = 'ESSAY') as essay,
        COUNT(*) FILTER (WHERE tipe = 'ISIAN_SINGKAT') as isian_singkat,
        COUNT(*) FILTER (WHERE tipe = 'BENAR_SALAH') as benar_salah,
        COUNT(*) FILTER (WHERE tipe = 'PENCOCOKAN') as pencocokan
      FROM bank_soal
      WHERE "schoolId" = ${guru.schoolId}
    `;

    const mapelStats = await sql`
      SELECT m.nama, COUNT(bs.id) as count
      FROM mata_pelajaran m
      LEFT JOIN bank_soal bs ON bs."mapelId" = m.id AND bs."schoolId" = ${guru.schoolId}
      WHERE m."schoolId" = ${guru.schoolId}
      GROUP BY m.id, m.nama
      ORDER BY count DESC
    `;

    return c.json({
      success: true,
      data: {
        total: parseInt(stats[0]?.total || '0'),
        byTipe: {
          PILIHAN_GANDA: parseInt(stats[0]?.pilihan_ganda || '0'),
          ESSAY: parseInt(stats[0]?.essay || '0'),
          ISIAN_SINGKAT: parseInt(stats[0]?.isian_singkat || '0'),
          BENAR_SALAH: parseInt(stats[0]?.benar_salah || '0'),
          PENCOCOKAN: parseInt(stats[0]?.pencocokan || '0'),
        },
        byMapel: mapelStats.map((m: any) => ({
          mapel: m.nama,
          count: parseInt(m.count || '0'),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching bank soal stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

// POST /guru/bank-soal - Create new bank soal
const createBankSoalSchema = z.object({
  mapelId: z.string().min(1),
  tipe: z.enum(['PILIHAN_GANDA', 'ESSAY', 'ISIAN_SINGKAT', 'BENAR_SALAH', 'PENCOCOKAN']),
  pertanyaan: z.string().min(1),
  data: z.any(),
  poin: z.number().min(1).default(1),
  kelas: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

bankSoal.post('/', requireRole('GURU', 'ADMIN'), zValidator('json', createBankSoalSchema), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const body = c.req.valid('json');

    const result = await sql`
      INSERT INTO bank_soal ("schoolId", "guruId", "mapelId", tipe, pertanyaan, data, poin, kelas, tags, "createdAt", "updatedAt")
      VALUES (${guru.schoolId}, ${guru.id}, ${body.mapelId}, ${body.tipe}, ${body.pertanyaan}, 
              ${JSON.stringify(body.data)}, ${body.poin}, ${body.kelas || []}, ${body.tags || []}, NOW(), NOW())
      RETURNING *
    `;

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating bank soal:', error);
    return c.json({ success: false, error: 'Failed to create bank soal' }, 500);
  }
});

// POST /guru/bank-soal/bulk - Create multiple bank soal (for import from ujian)
bankSoal.post('/bulk', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const { soalList, mapelId, tags } = await c.req.json();

    if (!Array.isArray(soalList) || soalList.length === 0) {
      return c.json({ success: false, error: 'soalList is required' }, 400);
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const soal of soalList) {
      try {
        await sql`
          INSERT INTO bank_soal ("schoolId", "guruId", "mapelId", tipe, pertanyaan, data, poin, tags, "createdAt", "updatedAt")
          VALUES (${guru.schoolId}, ${guru.id}, ${mapelId || soal.mapelId}, ${soal.tipe}, ${soal.pertanyaan}, 
                  ${JSON.stringify(soal.data)}, ${soal.poin || 1}, ${tags || []}, NOW(), NOW())
        `;
        successCount++;
      } catch (err: any) {
        errors.push(`Soal "${soal.pertanyaan?.substring(0, 30)}...": ${err.message}`);
      }
    }

    return c.json({
      success: true,
      message: `${successCount} soal berhasil ditambahkan ke bank soal`,
      data: { success: successCount, failed: errors.length, errors },
    });
  } catch (error) {
    console.error('Error bulk creating bank soal:', error);
    return c.json({ success: false, error: 'Failed to create bank soal' }, 500);
  }
});

// PUT /guru/bank-soal/:id - Update bank soal
bankSoal.put('/:id', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const id = c.req.param('id');
    const body = await c.req.json();

    const result = await sql`
      UPDATE bank_soal SET
        "mapelId" = COALESCE(${body.mapelId}, "mapelId"),
        tipe = COALESCE(${body.tipe}, tipe),
        pertanyaan = COALESCE(${body.pertanyaan}, pertanyaan),
        data = COALESCE(${body.data ? JSON.stringify(body.data) : null}, data),
        poin = COALESCE(${body.poin}, poin),
        kelas = COALESCE(${body.kelas}, kelas),
        tags = COALESCE(${body.tags}, tags),
        "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${guru.schoolId}
      RETURNING *
    `;

    if (!result[0]) {
      return c.json({ success: false, error: 'Bank soal not found' }, 404);
    }

    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating bank soal:', error);
    return c.json({ success: false, error: 'Failed to update bank soal' }, 500);
  }
});

// DELETE /guru/bank-soal/:id - Delete bank soal
bankSoal.delete('/:id', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const id = c.req.param('id');

    const result = await sql`
      DELETE FROM bank_soal WHERE id = ${id} AND "schoolId" = ${guru.schoolId} RETURNING id
    `;

    if (!result[0]) {
      return c.json({ success: false, error: 'Bank soal not found' }, 404);
    }

    return c.json({ success: true, message: 'Bank soal deleted' });
  } catch (error) {
    console.error('Error deleting bank soal:', error);
    return c.json({ success: false, error: 'Failed to delete bank soal' }, 500);
  }
});

// POST /guru/bank-soal/bulk-delete - Delete multiple bank soal (POST for better compatibility)
bankSoal.post('/bulk-delete', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const { ids } = await c.req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: 'ids is required' }, 400);
    }

    const idsArray = Array.isArray(ids) ? ids : [ids];
    const result = await sql`
      DELETE FROM bank_soal WHERE id = ANY(${idsArray}::text[]) AND "schoolId" = ${guru.schoolId}
    `;

    return c.json({ success: true, message: `${idsArray.length} soal deleted` });
  } catch (error) {
    console.error('Error bulk deleting bank soal:', error);
    return c.json({ success: false, error: 'Failed to delete bank soal' }, 500);
  }
});

// POST /guru/bank-soal/import-to-ujian - Import soal from bank to ujian
bankSoal.post('/import-to-ujian', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const { ujianId, bankSoalIds } = await c.req.json();

    if (!ujianId || !Array.isArray(bankSoalIds) || bankSoalIds.length === 0) {
      return c.json({ success: false, error: 'ujianId and bankSoalIds are required' }, 400);
    }

    // Verify ujian belongs to guru
    const ujian = await sql`SELECT * FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) {
      return c.json({ success: false, error: 'Ujian not found' }, 404);
    }

    // Get current max urutan
    const maxUrutan = await sql`SELECT COALESCE(MAX(urutan), 0) as max FROM soal WHERE "ujianId" = ${ujianId}`;
    let currentUrutan = parseInt(maxUrutan[0]?.max || '0');

    // Get bank soal - ensure bankSoalIds is properly formatted as array
    const idsArray = Array.isArray(bankSoalIds) ? bankSoalIds : [bankSoalIds];
    console.log('Importing bank soal ids:', idsArray);
    
    const bankSoalList = await sql`
      SELECT * FROM bank_soal WHERE id = ANY(${idsArray}::text[]) AND "schoolId" = ${guru.schoolId}
    `;
    console.log('Found bank soal:', bankSoalList.length);

    let successCount = 0;
    const errors: string[] = [];

    for (const bs of bankSoalList) {
      try {
        currentUrutan++;
        // Generate unique ID for soal
        const soalId = `soal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await sql`
          INSERT INTO soal (id, "ujianId", tipe, urutan, pertanyaan, poin, data, "createdAt", "updatedAt")
          VALUES (${soalId}, ${ujianId}, ${bs.tipe}, ${currentUrutan}, ${bs.pertanyaan}, ${bs.poin}, ${JSON.stringify(bs.data)}::jsonb, NOW(), NOW())
        `;
        successCount++;
      } catch (err: any) {
        console.error('Error inserting soal:', err);
        errors.push(`Soal "${bs.pertanyaan?.substring(0, 30)}...": ${err.message}`);
      }
    }

    return c.json({
      success: true,
      message: `${successCount} soal berhasil diimport ke ujian`,
      data: { success: successCount, failed: errors.length, errors },
    });
  } catch (error) {
    console.error('Error importing to ujian:', error);
    return c.json({ success: false, error: 'Failed to import soal' }, 500);
  }
});

// POST /guru/bank-soal/export-from-ujian - Export soal from ujian to bank
bankSoal.post('/export-from-ujian', requireRole('GURU', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const { ujianId, soalIds, deleteFromUjian, tags } = await c.req.json();

    if (!ujianId) {
      return c.json({ success: false, error: 'ujianId is required' }, 400);
    }

    // Verify ujian belongs to guru
    const ujian = await sql`SELECT * FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) {
      return c.json({ success: false, error: 'Ujian not found' }, 404);
    }

    // Get soal from ujian
    let soalList;
    if (soalIds && Array.isArray(soalIds) && soalIds.length > 0) {
      soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId} AND id = ANY(${soalIds})`;
    } else {
      soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId}`;
    }

    let successCount = 0;
    const errors: string[] = [];

    // Get kelas from ujian for export
    const ujianKelas = ujian[0].kelas || [];
    
    for (const soal of soalList) {
      try {
        await sql`
          INSERT INTO bank_soal ("schoolId", "guruId", "mapelId", tipe, pertanyaan, data, poin, kelas, tags, "createdAt", "updatedAt")
          VALUES (${guru.schoolId}, ${guru.id}, ${ujian[0].mapelId}, ${soal.tipe}, ${soal.pertanyaan}, 
                  ${JSON.stringify(soal.data)}, ${soal.poin}, ${ujianKelas}, ${tags || []}, NOW(), NOW())
        `;
        successCount++;

        // Delete from ujian if requested
        if (deleteFromUjian) {
          await sql`DELETE FROM soal WHERE id = ${soal.id}`;
        }
      } catch (err: any) {
        errors.push(`Soal "${soal.pertanyaan?.substring(0, 30)}...": ${err.message}`);
      }
    }

    return c.json({
      success: true,
      message: `${successCount} soal berhasil diekspor ke bank soal${deleteFromUjian ? ' dan dihapus dari ujian' : ''}`,
      data: { success: successCount, failed: errors.length, errors },
    });
  } catch (error) {
    console.error('Error exporting from ujian:', error);
    return c.json({ success: false, error: 'Failed to export soal' }, 500);
  }
});

export default bankSoal;
