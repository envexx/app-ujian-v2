import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: Platform-wide statistics
export async function GET() {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalUsers,
      totalGuru,
      totalSiswa,
      totalUjian,
      totalTugas,
      recentSchools,
    ] = await Promise.all([
      prisma.school.count(),
      prisma.school.count({ where: { isActive: true } }),
      prisma.school.count({ where: { isActive: false } }),
      prisma.user.count(),
      prisma.guru.count(),
      prisma.siswa.count(),
      prisma.ujian.count(),
      prisma.tugas.count(),
      prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { siswa: true, guru: true },
          },
        },
      }),
    ]);

    // Tier breakdown
    const tierStats = await prisma.school.groupBy({
      by: ['tierId'],
      _count: { id: true },
    });
    const tiers = await prisma.tier.findMany({ orderBy: { urutan: 'asc' } });
    const tierMap = Object.fromEntries(tiers.map(t => [t.id, t.label]));

    return NextResponse.json({
      success: true,
      data: {
        schools: {
          total: totalSchools,
          active: activeSchools,
          inactive: inactiveSchools,
        },
        users: {
          total: totalUsers,
          guru: totalGuru,
          siswa: totalSiswa,
        },
        content: {
          ujian: totalUjian,
          tugas: totalTugas,
        },
        tierBreakdown: tierStats.reduce((acc: Record<string, number>, s: any) => {
          const label = s.tierId ? (tierMap[s.tierId] || 'Unknown') : 'No Tier';
          acc[label] = s._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentSchools,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}
