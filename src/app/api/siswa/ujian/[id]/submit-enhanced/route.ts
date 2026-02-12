import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';
import { autoGradeSoal, TipeSoal, SoalData, JawabanData } from '@/types/soal';

const MANUAL_GRADE_TYPES = ['ESSAY'];
const PARTIAL_SCORE_TYPES = ['PENCOCOKAN'];

/**
 * Enhanced Submit Endpoint (unified Soal + JawabanSoal model)
 * Features:
 * - Transaction-based for data consistency
 * - Auto-grading with partial scoring for Pencocokan
 * - Checksum verification
 * - All questions saved (including unanswered)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id: ujianId } = await params;
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
    const { answers, checksum, submittedAt } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Tidak ada jawaban yang dikirim' },
        { status: 400 }
      );
    }

    // Get ujian with unified soal
    const ujian = await prisma.ujian.findUnique({
      where: { id: ujianId },
      include: {
        soal: { orderBy: { urutan: 'asc' } },
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
        { success: false, message: 'Waktu ujian sudah berakhir' },
        { status: 403 }
      );
    }

    // Validate checksum if provided
    if (checksum) {
      const expectedChecksum = generateChecksum(answers);
      if (checksum !== expectedChecksum) {
        console.warn('[SUBMIT] Checksum mismatch', { expected: expectedChecksum, received: checksum });
      }
    }

    const hasManual = ujian.soal.some(s => MANUAL_GRADE_TYPES.includes(s.tipe));

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get or create submission
      let submission = await tx.ujianSubmission.findUnique({
        where: {
          ujianId_siswaId: { ujianId, siswaId: siswa.id },
        },
        include: { jawabanSoal: true },
      });

      if (submission?.submittedAt) {
        throw new Error('Ujian sudah pernah dikumpulkan');
      }

      // Auto-grade and prepare all answers
      let totalPoin = 0;
      let earnedPoin = 0;

      const gradedAnswers: {
        soalId: string;
        jawaban: any;
        isCorrect: boolean | null;
        nilai: number | null;
      }[] = [];

      for (const soal of ujian.soal) {
        const userAnswer = answers[soal.id];
        const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);
        const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);

        totalPoin += soal.poin;

        if (isManual) {
          // userAnswer may already be { jawaban: "text" } from frontend
          const jawabanManual = userAnswer
            ? (typeof userAnswer === 'object' ? userAnswer : { jawaban: userAnswer })
            : { jawaban: '' };
          gradedAnswers.push({
            soalId: soal.id,
            jawaban: jawabanManual,
            isCorrect: null,
            nilai: null,
          });
        } else if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
          const jawabanData = typeof userAnswer === 'object' ? userAnswer : { jawaban: userAnswer };
          const gradeResult = autoGradeSoal(
            soal.tipe as TipeSoal,
            soal.data as unknown as SoalData,
            jawabanData as JawabanData
          );

          if (isPartial) {
            earnedPoin += Math.round(gradeResult.score * soal.poin);
            gradedAnswers.push({
              soalId: soal.id,
              jawaban: jawabanData,
              isCorrect: gradeResult.isCorrect,
              nilai: gradeResult.nilai,
            });
          } else {
            if (gradeResult.isCorrect) earnedPoin += soal.poin;
            gradedAnswers.push({
              soalId: soal.id,
              jawaban: jawabanData,
              isCorrect: gradeResult.isCorrect,
              nilai: gradeResult.isCorrect ? 100 : 0,
            });
          }
        } else {
          gradedAnswers.push({
            soalId: soal.id,
            jawaban: { jawaban: '' },
            isCorrect: false,
            nilai: 0,
          });
        }
      }

      // Direct sum — no percentage conversion. Total poin = 100, so earned = final score.
      const finalScore = hasManual ? null : earnedPoin;
      const statusSubmission = hasManual ? 'pending' : 'completed';

      // Create or update submission
      if (!submission) {
        submission = await tx.ujianSubmission.create({
          data: {
            ujianId,
            siswaId: siswa.id,
            startedAt: submittedAt ? new Date(submittedAt) : new Date(),
            submittedAt: new Date(),
            nilai: finalScore,
            status: statusSubmission,
          },
          include: { jawabanSoal: true },
        });
      } else {
        submission = await tx.ujianSubmission.update({
          where: { id: submission.id },
          data: {
            submittedAt: new Date(),
            nilai: finalScore,
            status: statusSubmission,
          },
          include: { jawabanSoal: true },
        });
      }

      // Save all answers using unified JawabanSoal
      let created = 0;
      let updated = 0;

      for (const graded of gradedAnswers) {
        const existing = submission.jawabanSoal.find(j => j.soalId === graded.soalId);

        if (existing) {
          await tx.jawabanSoal.update({
            where: { id: existing.id },
            data: {
              jawaban: graded.jawaban,
              isCorrect: graded.isCorrect,
              nilai: graded.nilai,
            },
          });
          updated++;
        } else {
          await tx.jawabanSoal.create({
            data: {
              submissionId: submission.id,
              soalId: graded.soalId,
              jawaban: graded.jawaban,
              isCorrect: graded.isCorrect,
              nilai: graded.nilai,
            },
          });
          created++;
        }
      }

      return {
        submission,
        finalScore,
        totalSoal: ujian.soal.length,
        stats: { created, updated, total: created + updated },
      };
    });

    const duration = Date.now() - startTime;
    console.log('[SUBMIT SUCCESS]', {
      ujianId,
      siswaId: siswa.id,
      duration: `${duration}ms`,
      totalSoal: result.totalSoal,
      saved: result.stats.total,
      score: result.finalScore,
    });

    return NextResponse.json({
      success: true,
      message: `Ujian berhasil dikumpulkan. ${result.stats.total} soal tersimpan`,
      data: {
        submission: result.submission,
        score: result.finalScore,
        totalSoal: result.totalSoal,
        totalSaved: result.stats.total,
      },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[SUBMIT ERROR]', { duration: `${duration}ms`, error: error.message });

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate checksum for data integrity
 */
function generateChecksum(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return hash.toString(36);
}
