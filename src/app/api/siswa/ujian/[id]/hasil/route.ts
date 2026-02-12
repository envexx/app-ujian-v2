import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Use refreshSession for viewing hasil (rolling session)
    const session = await refreshSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Get ujian with unified soal model
    const ujian = await prisma.ujian.findFirst({
      where: { id },
      include: {
        mapel: true,
        soal: {
          orderBy: { urutan: 'asc' },
        },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Get submission with unified JawabanSoal
    const submission = await prisma.ujianSubmission.findFirst({
      where: {
        ujianId: id,
        siswaId: siswa.id,
      },
      include: {
        jawabanSoal: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Anda belum mengerjakan ujian ini' },
        { status: 404 }
      );
    }

    // Build answers map from JawabanSoal
    const answersMap: { [key: string]: any } = {};
    const jawabanDetails: { [key: string]: { jawaban: any; isCorrect: boolean | null; nilai: number | null } } = {};

    if (submission.jawabanSoal && submission.jawabanSoal.length > 0) {
      submission.jawabanSoal.forEach((j: any) => {
        answersMap[j.soalId] = j.jawaban;
        jawabanDetails[j.soalId] = {
          jawaban: j.jawaban,
          isCorrect: j.isCorrect,
          nilai: j.nilai,
        };
      });
    }

    // Prepare soal for response — include answer keys since exam is already submitted
    const soal = ujian.soal.map((s, idx) => ({
      id: s.id,
      tipe: s.tipe,
      urutan: s.urutan,
      nomor: idx + 1,
      pertanyaan: s.pertanyaan,
      poin: s.poin,
      data: s.data, // Include full data with answer keys for review
    }));

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          mapel: ujian.mapel.nama,
          startUjian: ujian.startUjian,
          endUjian: ujian.endUjian,
          showScore: ujian.showScore,
        },
        submission: {
          id: submission.id,
          nilai: submission.nilai,
          status: submission.status,
          submittedAt: submission.submittedAt,
          startedAt: submission.startedAt,
        },
        soal,
        answers: answersMap,
        jawabanDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian result:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}
