import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const dashboard = new Hono<HonoEnv>();

// Apply auth middleware to all routes
dashboard.use('*', authMiddleware, tenantMiddleware);

// GET /dashboard/stats
dashboard.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Get counts in parallel for better performance
    const [siswaCount, guruCount, kelasCount, ujianCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM siswa WHERE "schoolId" = ${schoolId}`,
      sql`SELECT COUNT(*) as count FROM guru WHERE "schoolId" = ${schoolId}`,
      sql`SELECT COUNT(*) as count FROM kelas WHERE "schoolId" = ${schoolId}`,
      sql`SELECT COUNT(*) as count FROM ujian WHERE "schoolId" = ${schoolId} AND status = 'aktif'`,
    ]);

    return c.json({
      success: true,
      data: {
        totalSiswa: parseInt(siswaCount[0]?.count || '0'),
        totalGuru: parseInt(guruCount[0]?.count || '0'),
        totalKelas: parseInt(kelasCount[0]?.count || '0'),
        ujianAktif: parseInt(ujianCount[0]?.count || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

// GET /dashboard/activities
dashboard.get('/activities', async (c) => {
  try {
    const user = c.get('user');
    const schoolId = user.schoolId;

    if (!schoolId) {
      return c.json({ success: false, error: 'School ID tidak ditemukan' }, 400);
    }

    // Get recent ujian
    const recentUjian = await sql`
      SELECT u.id, u.judul, u.status, u."createdAt", g.nama as guru_nama
      FROM ujian u
      LEFT JOIN guru g ON g.id = u."guruId"
      WHERE u."schoolId" = ${schoolId}
      ORDER BY u."createdAt" DESC
      LIMIT 5
    `;

    // Get recent tugas
    const recentTugas = await sql`
      SELECT t.id, t.judul, t.deadline, t."createdAt", g.nama as guru_nama
      FROM tugas t
      LEFT JOIN guru g ON g.id = t."guruId"
      WHERE t."schoolId" = ${schoolId}
      ORDER BY t."createdAt" DESC
      LIMIT 5
    `;

    return c.json({
      success: true,
      data: {
        recentUjian: recentUjian.map((u: any) => ({
          id: u.id,
          judul: u.judul,
          status: u.status,
          createdAt: u.createdAt,
          guru: { nama: u.guru_nama },
        })),
        recentTugas: recentTugas.map((t: any) => ({
          id: t.id,
          judul: t.judul,
          deadline: t.deadline,
          createdAt: t.createdAt,
          guru: { nama: t.guru_nama },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return c.json({ success: false, error: 'Failed to fetch activities' }, 500);
  }
});

export default dashboard;
