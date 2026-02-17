import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // Use refreshSession to keep session alive on dashboard access (rolling session)
    const session = await refreshSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get siswa data
    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
      include: {
        kelas: true,
        school: { select: { id: true } },
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Get stats
    const [tugasCount, ujianCount, materiCount, tugasSubmissions, ujianSubmissions] = await Promise.all([
      // Total tugas for this kelas (same school)
      prisma.tugas.count({
        where: {
          schoolId: siswa.schoolId,
          kelas: {
            has: siswa.kelas.nama,
          },
          status: 'aktif',
        },
      }),
      // Total ujian for this kelas (same school)
      prisma.ujian.count({
        where: {
          schoolId: siswa.schoolId,
          kelas: {
            has: siswa.kelas.nama,
          },
          status: 'aktif',
        },
      }),
      // Total materi for this kelas (same school)
      prisma.materi.count({
        where: {
          schoolId: siswa.schoolId,
          kelas: {
            has: siswa.kelas.nama,
          },
        },
      }),
      // Tugas submissions
      prisma.tugasSubmission.findMany({
        where: {
          siswaId: siswa.id,
        },
      }),
      // Ujian submissions
      prisma.ujianSubmission.findMany({
        where: {
          siswaId: siswa.id,
        },
      }),
    ]);

    // Get upcoming tugas (deadline soon)
    const upcomingTugas = await prisma.tugas.findMany({
      where: {
        schoolId: siswa.schoolId,
        kelas: {
          has: siswa.kelas.nama,
        },
        status: 'aktif',
        deadline: {
          gte: new Date(),
        },
      },
      include: {
        mapel: true,
      },
      orderBy: {
        deadline: 'asc',
      },
      take: 5,
    });

    // Get upcoming ujian
    const upcomingUjian = await prisma.ujian.findMany({
      where: {
        schoolId: siswa.schoolId,
        kelas: {
          has: siswa.kelas.nama,
        },
        status: 'aktif',
        startUjian: {
          gte: new Date(),
        },
      },
      include: {
        mapel: true,
      },
      orderBy: {
        startUjian: 'asc',
      },
      take: 5,
    });

    // Calculate stats
    const tugasSelesai = tugasSubmissions.length;
    const tugasBelum = tugasCount - tugasSelesai;
    const ujianSelesai = ujianSubmissions.length;
    const ujianBelum = ujianCount - ujianSelesai;

    // Calculate average nilai
    const nilaiUjian = ujianSubmissions
      .filter(s => s.nilai !== null)
      .map(s => s.nilai as number);
    const rataRataNilai = nilaiUjian.length > 0
      ? Math.round(nilaiUjian.reduce((a, b) => a + b, 0) / nilaiUjian.length)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        siswa: {
          nama: siswa.nama,
          nisn: siswa.nisn,
          kelas: siswa.kelas.nama,
          foto: siswa.foto,
        },
        stats: {
          totalTugas: tugasCount,
          tugasSelesai,
          tugasBelum,
          totalUjian: ujianCount,
          ujianSelesai,
          ujianBelum,
          totalMateri: materiCount,
          rataRataNilai,
        },
        upcomingTugas: upcomingTugas.map(t => ({
          id: t.id,
          judul: t.judul,
          mapel: t.mapel.nama,
          deadline: t.deadline,
          status: tugasSubmissions.find(s => s.tugasId === t.id) ? 'sudah' : 'belum',
        })),
        upcomingUjian: upcomingUjian.map(u => ({
          id: u.id,
          judul: u.judul,
          mapel: u.mapel.nama,
          startUjian: u.startUjian,
          endUjian: u.endUjian,
          status: ujianSubmissions.find(s => s.ujianId === u.id) ? 'sudah' : 'belum',
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching siswa dashboard:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
