import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const guruNilai = new Hono<HonoEnv>();

guruNilai.use('*', authMiddleware, tenantMiddleware);

// Helper: get guru by userId
async function getGuru(userId: string) {
  const result = await sql`SELECT * FROM guru WHERE "userId" = ${userId} LIMIT 1`;
  return result[0];
}

// GET /guru/nilai - Get nilai data for guru
guruNilai.get('/', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const kelasId = c.req.query('kelasId');
    const mapelId = c.req.query('mapelId');

    const guru = await getGuru(user.userId);
    if (!guru) return c.json({ success: false, error: 'Guru not found' }, 404);

    // Get kelas list that this guru teaches
    const kelasList = await sql`
      SELECT k.id, k.nama FROM guru_kelas gk 
      JOIN kelas k ON k.id = gk."kelasId"
      WHERE gk."guruId" = ${guru.id} 
      ORDER BY k.nama ASC
    `;

    // Get mapel list for this guru
    const mapelList = await sql`
      SELECT m.id, m.nama FROM guru_mapel gm 
      JOIN mata_pelajaran m ON m.id = gm."mapelId"
      WHERE gm."guruId" = ${guru.id}
    `;

    // If no filters, return empty nilai with lists
    if (!kelasId || !mapelId) {
      return c.json({
        success: true,
        data: {
          nilai: [],
          kelasList: kelasList.map((k: any) => ({ id: k.id, nama: k.nama })),
          mapelList: mapelList.map((m: any) => ({ id: m.id, nama: m.nama })),
        },
      });
    }

    // Get siswa in selected kelas (same school)
    const siswaList = await sql`
      SELECT s.id, s.nisn, s.nama, s."kelasId"
      FROM siswa s
      WHERE s."schoolId" = ${guru.schoolId} AND s."kelasId" = ${kelasId}
      ORDER BY s.nama ASC
    `;

    // Get ujian submissions for this mapel
    const nilaiData = await Promise.all(siswaList.map(async (s: any) => {
      // Get average ujian score for this mapel
      const ujianScores = await sql`
        SELECT us.nilai FROM ujian_submission us
        JOIN ujian u ON u.id = us."ujianId"
        WHERE us."siswaId" = ${s.id} AND u."mapelId" = ${mapelId} AND us.nilai IS NOT NULL
      `;

      const avgUjian = ujianScores.length > 0
        ? Math.round(ujianScores.reduce((sum: number, us: any) => sum + (us.nilai || 0), 0) / ujianScores.length)
        : null;

      // For now, we use ujian average as both UTS and UAS
      // In the future, you can differentiate by checking ujian.judul
      const nilaiAkhir = avgUjian !== null ? avgUjian : null;

      return {
        id: null,
        siswaId: s.id,
        nisn: s.nisn,
        nama: s.nama,
        kelas: kelasId,
        tugas: null, // No tugas in this system yet
        uts: avgUjian,
        uas: avgUjian,
        nilaiAkhir: nilaiAkhir,
      };
    }));

    return c.json({
      success: true,
      data: {
        nilai: nilaiData,
        kelasList: kelasList.map((k: any) => ({ id: k.id, nama: k.nama })),
        mapelList: mapelList.map((m: any) => ({ id: m.id, nama: m.nama })),
      },
    });
  } catch (error) {
    console.error('Error fetching nilai:', error);
    return c.json({ success: false, error: 'Failed to fetch nilai' }, 500);
  }
});

export default guruNilai;
