import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const guruUjian = new Hono();

guruUjian.use('*', authMiddleware, tenantMiddleware);

// Helper: get guru by userId with schoolId
async function getGuru(userId: string) {
  const result = await sql`
    SELECT g.*, u."schoolId"
    FROM guru g
    JOIN users u ON u.id = g."userId"
    WHERE g."userId" = ${userId} LIMIT 1
  `;
  return result[0];
}

// GET /guru/ujian - List ujian for guru
guruUjian.get('/', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const statusFilter = c.req.query('status');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    let ujianList;
    if (statusFilter && statusFilter !== 'all') {
      ujianList = await sql`
        SELECT u.*, m.nama as mapel_nama,
          (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count,
          (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id) as submission_count
        FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
        WHERE u."guruId" = ${guru.id} AND u.status = ${statusFilter}
        ORDER BY u."startUjian" DESC
      `;
    } else {
      ujianList = await sql`
        SELECT u.*, m.nama as mapel_nama,
          (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count,
          (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id) as submission_count
        FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
        WHERE u."guruId" = ${guru.id}
        ORDER BY u."startUjian" DESC
      `;
    }

    const kelasList = await sql`
      SELECT k.id, k.nama FROM guru_kelas gk JOIN kelas k ON k.id = gk."kelasId"
      WHERE gk."guruId" = ${guru.id} ORDER BY k.nama ASC
    `;
    const mapelList = await sql`
      SELECT m.id, m.nama FROM guru_mapel gm JOIN mata_pelajaran m ON m.id = gm."mapelId"
      WHERE gm."guruId" = ${guru.id}
    `;

    return c.json({
      success: true,
      data: {
        ujian: ujianList.map((u: any) => ({
          id: u.id, judul: u.judul, deskripsi: u.deskripsi, mapel: u.mapel_nama, mapelId: u.mapelId,
          kelas: u.kelas, startUjian: u.startUjian, endUjian: u.endUjian,
          shuffleQuestions: u.shuffleQuestions, showScore: u.showScore, status: u.status,
          totalSoal: parseInt(u.soal_count || '0'), totalSubmissions: parseInt(u.submission_count || '0'),
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

// POST /guru/ujian - Create ujian
const createUjianSchema = z.object({
  judul: z.string().min(1), deskripsi: z.string().optional(),
  mapelId: z.string().min(1), kelas: z.union([z.string(), z.array(z.string())]),
  startUjian: z.string(), endUjian: z.string(),
  shuffleQuestions: z.boolean().optional().default(false),
  showScore: z.boolean().optional().default(true),
});

guruUjian.post('/', requireRole('GURU'), zValidator('json', createUjianSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const tierCheck = await sql`
      SELECT t."maxUjian" as max, (SELECT COUNT(*) FROM ujian WHERE "schoolId" = ${guru.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${guru.schoolId}
    `;
    if (tierCheck[0] && parseInt(tierCheck[0].current) >= tierCheck[0].max) {
      return c.json({ success: false, error: 'Batas maksimal ujian tercapai' }, 403);
    }

    const startDate = new Date(body.startUjian);
    const endDate = new Date(body.endUjian);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return c.json({ success: false, error: 'Format waktu tidak valid' }, 400);
    }
    if (endDate <= startDate) {
      return c.json({ success: false, error: 'Waktu akhir harus lebih besar dari waktu mulai' }, 400);
    }

    const kelasArr = Array.isArray(body.kelas) ? body.kelas : [body.kelas];
    // PostgreSQL array format: {value1,value2}
    const kelasPostgres = `{${kelasArr.map((k: string) => `"${k}"`).join(',')}}`;
    const result = await sql`
      INSERT INTO ujian (id, "schoolId", judul, deskripsi, "mapelId", "guruId", kelas, "startUjian", "endUjian",
        "shuffleQuestions", "showScore", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${guru.schoolId}, ${body.judul}, ${body.deskripsi || null}, ${body.mapelId}, ${guru.id},
        ${kelasPostgres}::text[], ${startDate.toISOString()}, ${endDate.toISOString()},
        ${body.shuffleQuestions}, ${body.showScore}, 'draft', NOW(), NOW())
      RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating ujian:', error);
    return c.json({ success: false, error: 'Failed to create ujian' }, 500);
  }
});

// GET /guru/ujian/:id - Get ujian detail
guruUjian.get('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujianResult = await sql`
      SELECT u.*, m.nama as mapel_nama FROM ujian u
      LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u.id = ${ujianId} AND u."guruId" = ${guru.id} LIMIT 1
    `;
    if (!ujianResult[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId} ORDER BY urutan ASC`;
    const submissionCount = await sql`SELECT COUNT(*) as count FROM ujian_submission WHERE "ujianId" = ${ujianId}`;

    return c.json({
      success: true,
      data: {
        ujian: {
          ...ujianResult[0],
          mapel: { nama: ujianResult[0].mapel_nama },
          _count: { submissions: parseInt(submissionCount[0]?.count || '0') },
        },
        soal: soalList,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian' }, 500);
  }
});

// PUT /guru/ujian/:id - Update ujian
guruUjian.put('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const body = await c.req.json();
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const existing = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!existing[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const kelasArr = body.kelas ? (Array.isArray(body.kelas) ? body.kelas : [body.kelas]) : null;
    // PostgreSQL array format: {value1,value2}
    const kelasPostgres = kelasArr ? `{${kelasArr.map((k: string) => `"${k}"`).join(',')}}` : null;
    const result = await sql`
      UPDATE ujian SET
        judul = COALESCE(${body.judul || null}, judul),
        deskripsi = COALESCE(${body.deskripsi !== undefined ? body.deskripsi : null}, deskripsi),
        "mapelId" = COALESCE(${body.mapelId || null}, "mapelId"),
        kelas = COALESCE(${kelasPostgres}::text[], kelas),
        "startUjian" = COALESCE(${body.startUjian ? new Date(body.startUjian).toISOString() : null}, "startUjian"),
        "endUjian" = COALESCE(${body.endUjian ? new Date(body.endUjian).toISOString() : null}, "endUjian"),
        "shuffleQuestions" = COALESCE(${body.shuffleQuestions !== undefined ? body.shuffleQuestions : null}, "shuffleQuestions"),
        "showScore" = COALESCE(${body.showScore !== undefined ? body.showScore : null}, "showScore"),
        status = COALESCE(${body.status || null}, status),
        "updatedAt" = NOW()
      WHERE id = ${ujianId} AND "guruId" = ${guru.id} RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating ujian:', error);
    return c.json({ success: false, error: 'Failed to update ujian' }, 500);
  }
});

// DELETE /guru/ujian/:id
guruUjian.delete('/:id', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    await sql`DELETE FROM soal WHERE "ujianId" = ${ujianId}`;
    await sql`DELETE FROM ujian_jawaban WHERE "submissionId" IN (SELECT id FROM ujian_submission WHERE "ujianId" = ${ujianId})`;
    await sql`DELETE FROM ujian_submission WHERE "ujianId" = ${ujianId}`;
    await sql`DELETE FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id}`;
    return c.json({ success: true, message: 'Ujian deleted' });
  } catch (error) {
    console.error('Error deleting ujian:', error);
    return c.json({ success: false, error: 'Failed to delete ujian' }, 500);
  }
});

// ============================================
// SOAL ROUTES
// ============================================

// GET /guru/ujian/:id/soal - Get soal list for ujian
guruUjian.get('/:id/soal', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId} ORDER BY urutan ASC`;
    return c.json({ success: true, data: soalList });
  } catch (error) {
    console.error('Error fetching soal:', error);
    return c.json({ success: false, error: 'Failed to fetch soal' }, 500);
  }
});

const createSoalSchema = z.object({
  tipe: z.string(), pertanyaan: z.string(), poin: z.number().min(1), data: z.any(),
});

guruUjian.post('/:id/soal', requireRole('GURU'), zValidator('json', createSoalSchema), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const body = c.req.valid('json');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const countResult = await sql`SELECT COUNT(*) as count FROM soal WHERE "ujianId" = ${ujianId}`;
    const urutan = parseInt(countResult[0]?.count || '0') + 1;

    const result = await sql`
      INSERT INTO soal (id, "ujianId", tipe, pertanyaan, poin, data, urutan, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${ujianId}, ${body.tipe}, ${body.pertanyaan}, ${body.poin}, ${JSON.stringify(body.data)}, ${urutan}, NOW(), NOW())
      RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating soal:', error);
    return c.json({ success: false, error: 'Failed to create soal' }, 500);
  }
});

guruUjian.put('/:id/soal/:soalId', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const soalId = c.req.param('soalId');
    const body = await c.req.json();
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const result = await sql`
      UPDATE soal SET
        tipe = COALESCE(${body.tipe || null}, tipe),
        pertanyaan = COALESCE(${body.pertanyaan || null}, pertanyaan),
        poin = COALESCE(${body.poin !== undefined ? body.poin : null}, poin),
        data = COALESCE(${body.data !== undefined ? JSON.stringify(body.data) : null}, data),
        "updatedAt" = NOW()
      WHERE id = ${soalId} AND "ujianId" = ${ujianId} RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating soal:', error);
    return c.json({ success: false, error: 'Failed to update soal' }, 500);
  }
});

guruUjian.delete('/:id/soal/:soalId', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const soalId = c.req.param('soalId');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    await sql`DELETE FROM soal WHERE id = ${soalId} AND "ujianId" = ${ujianId}`;
    return c.json({ success: true, message: 'Soal deleted' });
  } catch (error) {
    console.error('Error deleting soal:', error);
    return c.json({ success: false, error: 'Failed to delete soal' }, 500);
  }
});

// Reorder soal
guruUjian.put('/:id/reorder-soal', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const { soalIds } = await c.req.json();
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    for (let i = 0; i < soalIds.length; i++) {
      await sql`UPDATE soal SET urutan = ${i + 1} WHERE id = ${soalIds[i]} AND "ujianId" = ${ujianId}`;
    }
    return c.json({ success: true, message: 'Soal reordered' });
  } catch (error) {
    console.error('Error reordering soal:', error);
    return c.json({ success: false, error: 'Failed to reorder soal' }, 500);
  }
});

// ============================================
// NILAI ROUTES
// ============================================

guruUjian.get('/:id/nilai', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujianResult = await sql`
      SELECT u.*, m.nama as mapel_nama
      FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u.id = ${ujianId} AND u."guruId" = ${guru.id} LIMIT 1
    `;
    if (!ujianResult[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId} ORDER BY urutan ASC`;
    const totalPoin = soalList.reduce((sum: number, s: any) => sum + (s.poin || 0), 0);

    // Count soal by type
    const soalByType: Record<string, number> = {};
    soalList.forEach((s: any) => {
      soalByType[s.tipe] = (soalByType[s.tipe] || 0) + 1;
    });

    // Check if there are manual soal (essay)
    const hasManualSoal = soalList.some((s: any) => s.tipe === 'ESSAY');

    // Get submissions with jawaban
    const submissions = await sql`
      SELECT us.id, us."submittedAt", us.nilai, us."startedAt",
        s.id as siswa_id, s.nama as siswa_nama, s.nisn, k.nama as kelas_nama
      FROM ujian_submission us
      LEFT JOIN siswa s ON s.id = us."siswaId"
      LEFT JOIN kelas k ON k.id = s."kelasId"
      WHERE us."ujianId" = ${ujianId}
      ORDER BY s.nama ASC
    `;

    // Get jawaban for each submission
    const submissionsWithJawaban = await Promise.all(submissions.map(async (sub: any) => {
      const jawaban = await sql`
        SELECT uj.*, s.tipe as soal_tipe, s.poin as soal_poin
        FROM ujian_jawaban uj
        LEFT JOIN soal s ON s.id = uj."soalId"
        WHERE uj."submissionId" = ${sub.id}
      `;

      // Calculate scores
      let nilaiAuto = 0;
      let nilaiManual = 0;
      let hasEssay = false;
      let essayNeedsGrading = false;

      jawaban.forEach((j: any) => {
        if (j.soal_tipe === 'ESSAY') {
          hasEssay = true;
          if (j.nilai !== null) {
            nilaiManual += j.nilai;
          } else {
            essayNeedsGrading = true;
          }
        } else if (j.isCorrect) {
          nilaiAuto += j.nilai || 0;
        }
      });

      const nilaiTotal = sub.nilai;
      let status = 'belum';
      if (sub.submittedAt) {
        status = essayNeedsGrading ? 'perlu_dinilai' : 'sudah';
      }

      return {
        id: sub.id,
        siswaId: sub.siswa_id,
        siswa: sub.siswa_nama,
        nisn: sub.nisn,
        kelas: sub.kelas_nama,
        submittedAt: sub.submittedAt,
        startedAt: sub.startedAt,
        nilaiAuto,
        nilaiManual: hasEssay ? nilaiManual : null,
        nilaiTotal,
        status,
        jawaban: jawaban.map((j: any) => ({
          id: j.id,
          soalId: j.soalId,
          jawaban: j.jawaban,
          nilai: j.nilai,
          isCorrect: j.isCorrect,
          feedback: j.feedback,
        })),
      };
    }));

    return c.json({
      success: true,
      data: {
        ujian: {
          id: ujianResult[0].id,
          judul: ujianResult[0].judul,
          kelas: ujianResult[0].kelas,
          mapel: ujianResult[0].mapel_nama,
          startUjian: ujianResult[0].startUjian,
          totalSoal: soalList.length,
          totalPoin,
          soalByType,
          hasManualSoal,
        },
        soal: soalList.map((s: any, idx: number) => ({
          ...s,
          nomor: idx + 1,
        })),
        submissions: submissionsWithJawaban,
      },
    });
  } catch (error) {
    console.error('Error fetching nilai:', error);
    return c.json({ success: false, error: 'Failed to fetch nilai' }, 500);
  }
});

guruUjian.put('/:id/nilai', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const { submissionId, grades } = await c.req.json();
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    for (const grade of grades) {
      await sql`UPDATE ujian_jawaban SET nilai = ${grade.nilai}, feedback = ${grade.feedback || null} WHERE id = ${grade.jawabanId}`;
    }

    // Recalculate
    const soalPoin = await sql`SELECT SUM(poin) as total FROM soal WHERE "ujianId" = ${ujianId}`;
    const jawabanNilai = await sql`SELECT SUM(nilai) as total FROM ujian_jawaban WHERE "submissionId" = ${submissionId}`;
    const totalPoin = parseInt(soalPoin[0]?.total || '0');
    const totalNilai = parseInt(jawabanNilai[0]?.total || '0');
    const finalNilai = totalPoin > 0 ? Math.round((totalNilai / totalPoin) * 100) : 0;
    await sql`UPDATE ujian_submission SET nilai = ${finalNilai} WHERE id = ${submissionId}`;

    return c.json({ success: true, message: 'Nilai updated' });
  } catch (error) {
    console.error('Error updating nilai:', error);
    return c.json({ success: false, error: 'Failed to update nilai' }, 500);
  }
});

guruUjian.post('/:id/nilai/recalculate', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    const ujian = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "guruId" = ${guru.id} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const soalPoin = await sql`SELECT SUM(poin) as total FROM soal WHERE "ujianId" = ${ujianId}`;
    const totalPoin = parseInt(soalPoin[0]?.total || '0');

    const submissions = await sql`SELECT id FROM ujian_submission WHERE "ujianId" = ${ujianId}`;
    let updated = 0;
    for (const sub of submissions) {
      const jawabanNilai = await sql`SELECT SUM(nilai) as total FROM ujian_jawaban WHERE "submissionId" = ${sub.id}`;
      const totalNilai = parseInt(jawabanNilai[0]?.total || '0');
      const finalNilai = totalPoin > 0 ? Math.round((totalNilai / totalPoin) * 100) : 0;
      await sql`UPDATE ujian_submission SET nilai = ${finalNilai} WHERE id = ${sub.id}`;
      updated++;
    }

    return c.json({ success: true, updated });
  } catch (error) {
    console.error('Error recalculating nilai:', error);
    return c.json({ success: false, error: 'Failed to recalculate nilai' }, 500);
  }
});

export default guruUjian;
