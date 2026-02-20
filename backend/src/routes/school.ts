import { Hono } from 'hono';
import { sql } from '../lib/db';

const school = new Hono();

// GET /school/info - Get school info
school.get('/info', async (c) => {
  try {
    // Try to get user from auth header
    const authHeader = c.req.header('Authorization');
    let schoolId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { jwtVerify } = await import('jose');
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret');
        const { payload } = await jwtVerify(token, secret);
        schoolId = payload.schoolId as string;
      } catch {
        // Token invalid, continue without schoolId
      }
    }

    if (!schoolId) {
      return c.json({
        success: true,
        data: {
          nama: 'E-Learning System',
          logo: null,
          alamat: null,
          telepon: null,
          email: null,
        },
      });
    }

    const schoolInfoList = await sql`
      SELECT "namaSekolah", logo, alamat, "noTelp", email
      FROM sekolah_info
      WHERE "schoolId" = ${schoolId}
      LIMIT 1
    `;

    const schoolInfo = schoolInfoList[0];

    if (!schoolInfo) {
      return c.json({
        success: true,
        data: {
          nama: 'E-Learning System',
          logo: null,
          alamat: null,
          telepon: null,
          email: null,
        },
      });
    }

    return c.json({
      success: true,
      data: {
        nama: schoolInfo.namaSekolah,
        logo: schoolInfo.logo,
        alamat: schoolInfo.alamat,
        telepon: schoolInfo.noTelp,
        email: schoolInfo.email,
      },
    });
  } catch (error) {
    console.error('Error fetching school info:', error);
    return c.json({
      success: true,
      data: {
        nama: 'E-Learning System',
        logo: null,
      },
    });
  }
});

export default school;
