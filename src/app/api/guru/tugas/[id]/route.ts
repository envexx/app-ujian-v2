import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Get tugas detail with submissions
    const tugas = await prisma.tugas.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
      include: {
        mapel: true,
        submissions: {
          include: {
            siswa: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    });

    if (!tugas) {
      return NextResponse.json(
        { success: false, error: 'Tugas not found' },
        { status: 404 }
      );
    }

    // Get all siswa in the kelas (same school)
    const allSiswa = await prisma.siswa.findMany({
      where: {
        schoolId: tugas.schoolId,
        kelas: {
          nama: {
            in: tugas.kelas,
          },
        },
      },
      orderBy: {
        nama: 'asc',
      },
    });

    // Map submissions with all siswa
    const submissionsMap = new Map(
      tugas.submissions.map((sub) => [sub.siswaId, sub])
    );

    const submissions = allSiswa.map((siswa) => {
      const submission = submissionsMap.get(siswa.id);
      const isLate = submission && submission.submittedAt > tugas.deadline;

      // Prioritize fileUpload over fileUrl
      const fileToShow = submission?.fileUpload || submission?.fileUrl || null;

      const mappedSubmission = {
        id: submission?.id || null,
        siswaId: siswa.id,
        siswa: siswa.nama,
        nisn: siswa.nisn,
        tanggalKumpul: submission?.submittedAt || null,
        file: fileToShow,
        catatan: submission?.catatan || null,
        nilai: submission?.nilai || null,
        feedback: submission?.feedback || null,
        status: submission
          ? isLate
            ? 'terlambat'
            : 'sudah'
          : 'belum',
      };

      // Debug logging
      if (submission) {
        console.log('Submission for', siswa.nama, ':', {
          id: submission.id,
          fileUrl: submission.fileUrl,
          fileUpload: submission.fileUpload,
          fileToShow: fileToShow,
          catatan: submission.catatan,
        });
      }

      return mappedSubmission;
    });

    return NextResponse.json({
      success: true,
      data: {
        tugas: {
          id: tugas.id,
          judul: tugas.judul,
          deskripsi: tugas.deskripsi,
          instruksi: tugas.instruksi,
          kelas: tugas.kelas,
          mapel: tugas.mapel.nama,
          deadline: tugas.deadline,
          fileUrl: tugas.fileUrl,
        },
        submissions,
      },
    });
  } catch (error) {
    console.error('Error fetching tugas detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tugas detail' },
      { status: 500 }
    );
  }
}
