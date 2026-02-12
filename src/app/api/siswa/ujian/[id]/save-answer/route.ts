import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';
import { rateLimiters } from '@/lib/rate-limit';
import { autoGradeSoal, TipeSoal, SoalData, JawabanData } from '@/types/soal';

const MANUAL_GRADE_TYPES = ['ESSAY'];
const PARTIAL_SCORE_TYPES = ['PENCOCOKAN'];

/**
 * Auto-save single answer (unified Soal + JawabanSoal model)
 * Rate limited: 1 request per 2 seconds per question per student
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await refreshSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, message: 'Siswa not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { questionId, answer, timestamp } = body;

    // Rate limiting
    const rateLimitKey = `${siswa.id}-${questionId}`;
    const isAllowed = rateLimiters.saveAnswer.check(rateLimitKey);

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak request. Tunggu 2 detik.' },
        { status: 429 }
      );
    }

    if (!questionId || answer === undefined) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Get ujian with soal
    const ujian = await prisma.ujian.findFirst({
      where: { id },
      include: {
        soal: true,
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, message: 'Ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate time
    const now = new Date();
    if (now > new Date(ujian.endUjian)) {
      return NextResponse.json(
        { success: false, message: 'Waktu ujian telah berakhir.' },
        { status: 403 }
      );
    }
    if (now < new Date(ujian.startUjian)) {
      return NextResponse.json(
        { success: false, message: 'Ujian belum dimulai' },
        { status: 403 }
      );
    }

    // Find the soal
    const soal = ujian.soal.find((s) => s.id === questionId);
    if (!soal) {
      return NextResponse.json(
        { success: false, message: `Soal ${questionId} tidak ditemukan` },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get or create submission
      let submission = await tx.ujianSubmission.findUnique({
        where: {
          ujianId_siswaId: { ujianId: id, siswaId: siswa.id },
        },
      });

      if (!submission) {
        submission = await tx.ujianSubmission.create({
          data: {
            ujianId: id,
            siswaId: siswa.id,
            startedAt: timestamp ? new Date(timestamp) : new Date(),
            status: 'draft',
          },
        });
      }

      if (submission.submittedAt) {
        throw new Error('Ujian sudah dikumpulkan, tidak bisa mengubah jawaban');
      }

      // Auto-grade if not manual type
      const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);
      const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);
      const jawabanData = typeof answer === 'object' ? answer : { jawaban: answer };

      let isCorrect: boolean | null = null;
      let nilai: number | null = null;

      if (!isManual && answer !== '' && answer !== null) {
        const gradeResult = autoGradeSoal(
          soal.tipe as TipeSoal,
          soal.data as unknown as SoalData,
          jawabanData as JawabanData
        );
        isCorrect = gradeResult.isCorrect;
        nilai = isPartial ? gradeResult.nilai : (gradeResult.isCorrect ? 100 : 0);
      }

      // Upsert jawaban
      const existingAnswer = await tx.jawabanSoal.findUnique({
        where: {
          submissionId_soalId: {
            submissionId: submission.id,
            soalId: questionId,
          },
        },
      });

      if (existingAnswer) {
        await tx.jawabanSoal.update({
          where: { id: existingAnswer.id },
          data: { jawaban: jawabanData, isCorrect, nilai },
        });
      } else {
        await tx.jawabanSoal.create({
          data: {
            submissionId: submission.id,
            soalId: questionId,
            jawaban: jawabanData,
            isCorrect,
            nilai,
          },
        });
      }

      return { submissionId: submission.id, isCorrect, nilai };
    });

    return NextResponse.json({
      success: true,
      message: 'Jawaban berhasil disimpan',
      data: {
        questionId,
        savedAt: new Date().toISOString(),
        ...result,
      },
    });
  } catch (error: any) {
    console.error('[SAVE ANSWER ERROR]', error.message);
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal menyimpan jawaban' },
      { status: 500 }
    );
  }
}

/**
 * Batch save multiple answers (unified model)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { answers } = body; // Array of { questionId, answer }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    const ujian = await prisma.ujian.findFirst({
      where: { id },
      include: { soal: true },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Validate time
    const now = new Date();
    if (now > new Date(ujian.endUjian)) {
      return NextResponse.json(
        { success: false, error: 'Waktu ujian telah berakhir.' },
        { status: 400 }
      );
    }
    if (now < new Date(ujian.startUjian)) {
      return NextResponse.json(
        { success: false, error: 'Ujian belum dimulai' },
        { status: 400 }
      );
    }

    // Get or create submission
    let submission = await prisma.ujianSubmission.findFirst({
      where: { ujianId: id, siswaId: siswa.id },
    });

    if (!submission) {
      submission = await prisma.ujianSubmission.create({
        data: {
          ujianId: id,
          siswaId: siswa.id,
          startedAt: new Date(),
          status: 'draft',
        },
      });
    }

    // Batch save using unified JawabanSoal
    const savePromises = answers.map(async ({ questionId, answer }: { questionId: string; answer: any }) => {
      const soal = ujian.soal.find((s) => s.id === questionId);
      if (!soal) return null;

      const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);
      const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);
      const jawabanData = typeof answer === 'object' ? answer : { jawaban: answer };

      let isCorrect: boolean | null = null;
      let nilai: number | null = null;

      if (!isManual && answer !== '' && answer !== null) {
        const gradeResult = autoGradeSoal(
          soal.tipe as TipeSoal,
          soal.data as unknown as SoalData,
          jawabanData as JawabanData
        );
        isCorrect = gradeResult.isCorrect;
        nilai = isPartial ? gradeResult.nilai : (gradeResult.isCorrect ? 100 : 0);
      }

      const existingAnswer = await prisma.jawabanSoal.findUnique({
        where: {
          submissionId_soalId: {
            submissionId: submission.id,
            soalId: questionId,
          },
        },
      });

      if (existingAnswer) {
        return prisma.jawabanSoal.update({
          where: { id: existingAnswer.id },
          data: { jawaban: jawabanData, isCorrect, nilai },
        });
      } else {
        return prisma.jawabanSoal.create({
          data: {
            submissionId: submission.id,
            soalId: questionId,
            jawaban: jawabanData,
            isCorrect,
            nilai,
          },
        });
      }
    });

    await Promise.all(savePromises.filter(Boolean));

    return NextResponse.json({
      success: true,
      data: {
        message: `${answers.length} jawaban berhasil disimpan`,
        savedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error batch saving answers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save answers' },
      { status: 500 }
    );
  }
}
