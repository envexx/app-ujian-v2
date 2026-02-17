import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();

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
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Get tugas for siswa's kelas (same school)
    const tugas = await prisma.tugas.findMany({
      where: {
        schoolId: siswa.schoolId,
        kelas: {
          has: siswa.kelas.nama,
        },
      },
      include: {
        mapel: true,
        submissions: {
          where: {
            siswaId: siswa.id,
          },
        },
      },
      orderBy: {
        deadline: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tugas: tugas.map(t => {
          const submission = t.submissions[0];
          const isLate = submission && submission.submittedAt > t.deadline;
          
          return {
            id: t.id,
            judul: t.judul,
            deskripsi: t.deskripsi,
            instruksi: t.instruksi,
            mapel: t.mapel.nama,
            deadline: t.deadline,
            fileUrl: t.fileUrl,
            status: t.status,
            submission: submission ? {
              id: submission.id,
              submittedAt: submission.submittedAt,
              fileUrl: submission.fileUrl,
              catatan: submission.catatan,
              nilai: submission.nilai,
              feedback: submission.feedback,
              status: isLate ? 'terlambat' : 'sudah',
            } : null,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tugas' },
      { status: 500 }
    );
  }
}
