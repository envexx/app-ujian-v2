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

    // Get materi for siswa's kelas (same school)
    const materi = await prisma.materi.findMany({
      where: {
        schoolId: siswa.schoolId,
        kelas: {
          has: siswa.kelas.nama,
        },
      },
      include: {
        mapel: true,
        guru: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        materi: materi.map(m => ({
          id: m.id,
          judul: m.judul,
          deskripsi: m.deskripsi,
          tipe: m.tipe,
          fileUrl: m.fileUrl,
          mapel: m.mapel.nama,
          guru: m.guru.nama,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching materi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch materi' },
      { status: 500 }
    );
  }
}
