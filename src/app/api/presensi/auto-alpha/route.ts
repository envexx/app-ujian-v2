import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDateIndonesia, getStartOfDayIndonesia } from '@/lib/date-utils';

/**
 * Auto-mark students as ALPHA if they haven't scanned by 9:00 AM
 * This endpoint should be called by a cron job at 9:00 AM daily
 */
export async function POST(request: Request) {
  try {
    // Get current time in Indonesian timezone
    const now = getCurrentDateIndonesia();
    const currentHour = now.getHours();
    
    // Only run if it's 9 AM or later
    if (currentHour < 9) {
      return NextResponse.json({
        success: false,
        message: 'Auto-alpha only runs at 9:00 AM or later',
        currentTime: now.toISOString(),
      });
    }

    const todayStart = getStartOfDayIndonesia();

    // Get all schools to process per-tenant
    const schools = await prisma.school.findMany({ select: { id: true, nama: true } });

    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalMarked = 0;

    for (const school of schools) {
      // Get all students for this school
      const allSiswa = await prisma.siswa.findMany({
        where: { schoolId: school.id },
        select: { id: true, nisn: true, nama: true },
      });

      // Get students who already have presensi today
      const todayPresensi = await prisma.presensi.findMany({
        where: {
          siswa: { schoolId: school.id },
          tanggal: { gte: todayStart },
        },
        select: { siswaId: true },
      });

      const presentSiswaIds = new Set(todayPresensi.map(p => p.siswaId));
      const absentSiswa = allSiswa.filter(siswa => !presentSiswaIds.has(siswa.id));

      if (absentSiswa.length > 0) {
        const alphaRecords = await prisma.presensi.createMany({
          data: absentSiswa.map(siswa => ({
            siswaId: siswa.id,
            tanggal: now,
            status: 'alpha',
            keterangan: 'Auto-marked as ALPHA - tidak hadir sebelum jam 09:00',
          })),
        });
        totalMarked += alphaRecords.count;
      }

      totalStudents += allSiswa.length;
      totalPresent += presentSiswaIds.size;
      totalAbsent += absentSiswa.length;
    }

    console.log(`Auto-marked ${totalMarked} students as ALPHA at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${totalMarked} students as ALPHA`,
      totalStudents,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      markedAsAlpha: totalMarked,
      executedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Error in auto-alpha marking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to auto-mark students as alpha',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger endpoint (for testing)
 * GET request to check status without marking
 */
export async function GET() {
  try {
    const now = getCurrentDateIndonesia();
    const todayStart = getStartOfDayIndonesia();
    
    // Aggregate across all schools
    const schools = await prisma.school.findMany({ select: { id: true } });
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    const breakdown = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };

    for (const school of schools) {
      const allSiswa = await prisma.siswa.findMany({
        where: { schoolId: school.id },
        select: { id: true },
      });

      const todayPresensi = await prisma.presensi.findMany({
        where: {
          siswa: { schoolId: school.id },
          tanggal: { gte: todayStart },
        },
        select: { siswaId: true, status: true },
      });

      const presentSiswaIds = new Set(todayPresensi.map(p => p.siswaId));
      totalStudents += allSiswa.length;
      totalPresent += presentSiswaIds.size;
      totalAbsent += allSiswa.filter(s => !presentSiswaIds.has(s.id)).length;
      breakdown.hadir += todayPresensi.filter(p => p.status === 'hadir').length;
      breakdown.izin += todayPresensi.filter(p => p.status === 'izin').length;
      breakdown.sakit += todayPresensi.filter(p => p.status === 'sakit').length;
      breakdown.alpha += todayPresensi.filter(p => p.status === 'alpha').length;
    }

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      currentHour: now.getHours(),
      shouldRunAutoAlpha: now.getHours() >= 9,
      totalStudents,
      presentCount: totalPresent,
      absentCount: totalAbsent,
      presensiBreakdown: breakdown,
    });
  } catch (error) {
    console.error('Error checking auto-alpha status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
