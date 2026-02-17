import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts in parallel for better performance
    const [totalSiswa, totalGuru, totalKelas, ujianAktif] = await Promise.all([
      prisma.siswa.count({ where: { schoolId: session.schoolId } }),
      prisma.guru.count({ where: { schoolId: session.schoolId } }),
      prisma.kelas.count({ where: { schoolId: session.schoolId } }),
      prisma.ujian.count({
        where: {
          schoolId: session.schoolId,
          status: 'aktif',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalSiswa,
        totalGuru,
        totalKelas,
        ujianAktif,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
