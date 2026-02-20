import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const guruDashboard = new Hono<HonoEnv>();

// Apply auth middleware to all routes
guruDashboard.use('*', authMiddleware, tenantMiddleware);

// Helper to get guru from user
const getGuru = async (userId: string) => {
  const result = await sql`SELECT * FROM guru WHERE "userId" = ${userId} LIMIT 1`;
  return result[0] || null;
};

// GET /guru/dashboard/stats
guruDashboard.get('/stats', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    
    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Get ujian stats for this guru
    const [totalUjian, ujianAktif, ujianDraft, totalSubmissions] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM ujian WHERE "guruId" = ${guru.id}`,
      sql`SELECT COUNT(*) as count FROM ujian WHERE "guruId" = ${guru.id} AND status = 'active'`,
      sql`SELECT COUNT(*) as count FROM ujian WHERE "guruId" = ${guru.id} AND status = 'draft'`,
      sql`
        SELECT COUNT(*) as count FROM ujian_submission us
        INNER JOIN ujian u ON u.id = us."ujianId"
        WHERE u."guruId" = ${guru.id} AND us."submittedAt" IS NOT NULL
      `,
    ]);

    // Get pending essay grading count
    const pendingGrading = await sql`
      SELECT COUNT(DISTINCT us.id) as count 
      FROM ujian_submission us
      INNER JOIN ujian u ON u.id = us."ujianId"
      INNER JOIN ujian_jawaban uj ON uj."submissionId" = us.id
      INNER JOIN soal s ON s.id = uj."soalId"
      WHERE u."guruId" = ${guru.id} 
        AND us."submittedAt" IS NOT NULL
        AND s.tipe = 'ESSAY'
        AND uj.nilai IS NULL
    `;

    // Get average score
    const avgScore = await sql`
      SELECT AVG(us.nilai) as avg 
      FROM ujian_submission us
      INNER JOIN ujian u ON u.id = us."ujianId"
      WHERE u."guruId" = ${guru.id} AND us.nilai IS NOT NULL
    `;

    return c.json({
      success: true,
      data: {
        totalUjian: parseInt(totalUjian[0]?.count || '0'),
        ujianAktif: parseInt(ujianAktif[0]?.count || '0'),
        ujianDraft: parseInt(ujianDraft[0]?.count || '0'),
        totalSubmissions: parseInt(totalSubmissions[0]?.count || '0'),
        pendingGrading: parseInt(pendingGrading[0]?.count || '0'),
        avgScore: parseFloat(avgScore[0]?.avg || '0').toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error fetching guru dashboard stats:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

// GET /guru/dashboard/aktivitas
guruDashboard.get('/aktivitas', requireRole('GURU'), async (c) => {
  try {
    const user = c.get('user');
    const guru = await getGuru(user.userId);
    
    if (!guru) {
      return c.json({ success: false, error: 'Guru not found' }, 404);
    }

    // Get recent ujian
    const recentUjian = await sql`
      SELECT u.id, u.judul, u.status, u."createdAt", u."startUjian", u."endUjian",
        m.nama as mapel_nama,
        (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as total_soal,
        (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id AND "submittedAt" IS NOT NULL) as total_submissions
      FROM ujian u
      LEFT JOIN mapel m ON m.id = u."mapelId"
      WHERE u."guruId" = ${guru.id}
      ORDER BY u."createdAt" DESC
      LIMIT 5
    `;

    // Get recent submissions that need grading
    const recentSubmissions = await sql`
      SELECT us.id, us."submittedAt", us.nilai,
        s.nama as siswa_nama, s.nisn,
        k.nama as kelas_nama,
        u.judul as ujian_judul
      FROM ujian_submission us
      INNER JOIN ujian u ON u.id = us."ujianId"
      LEFT JOIN siswa s ON s.id = us."siswaId"
      LEFT JOIN kelas k ON k.id = s."kelasId"
      WHERE u."guruId" = ${guru.id} AND us."submittedAt" IS NOT NULL
      ORDER BY us."submittedAt" DESC
      LIMIT 10
    `;

    // Get upcoming ujian
    const upcomingUjian = await sql`
      SELECT u.id, u.judul, u."startUjian", u."endUjian", u.status,
        m.nama as mapel_nama
      FROM ujian u
      LEFT JOIN mapel m ON m.id = u."mapelId"
      WHERE u."guruId" = ${guru.id} 
        AND u.status = 'active'
        AND u."startUjian" > NOW() AT TIME ZONE 'Asia/Jakarta'
      ORDER BY u."startUjian" ASC
      LIMIT 5
    `;

    return c.json({
      success: true,
      data: {
        recentUjian: recentUjian.map((u: any) => ({
          id: u.id,
          judul: u.judul,
          status: u.status,
          mapel: u.mapel_nama,
          createdAt: u.createdAt,
          startUjian: u.startUjian,
          endUjian: u.endUjian,
          totalSoal: parseInt(u.total_soal || '0'),
          totalSubmissions: parseInt(u.total_submissions || '0'),
        })),
        recentSubmissions: recentSubmissions.map((s: any) => ({
          id: s.id,
          siswa: s.siswa_nama,
          nisn: s.nisn,
          kelas: s.kelas_nama,
          ujian: s.ujian_judul,
          submittedAt: s.submittedAt,
          nilai: s.nilai,
        })),
        upcomingUjian: upcomingUjian.map((u: any) => ({
          id: u.id,
          judul: u.judul,
          mapel: u.mapel_nama,
          startUjian: u.startUjian,
          endUjian: u.endUjian,
          status: u.status,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching guru activities:', error);
    return c.json({ success: false, error: 'Failed to fetch activities' }, 500);
  }
});

export default guruDashboard;
