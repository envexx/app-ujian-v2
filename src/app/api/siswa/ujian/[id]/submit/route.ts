import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';
import { autoGradeSoal, TipeSoal, SoalData, JawabanData } from '@/types/soal';

const MANUAL_GRADE_TYPES = ['ESSAY'];
const PARTIAL_SCORE_TYPES = ['PENCOCOKAN'];

export async function POST(
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
    const { answers } = body; // { [soalId]: jawaban value }

    // Get ujian with unified soal
    const ujian = await prisma.ujian.findFirst({
      where: { id },
      include: {
        soal: { orderBy: { urutan: 'asc' } },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Check if exam time has passed
    const now = new Date();
    if (now > new Date(ujian.endUjian)) {
      return NextResponse.json(
        { success: false, error: 'Waktu ujian telah berakhir' },
        { status: 400 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.ujianSubmission.findFirst({
      where: { ujianId: id, siswaId: siswa.id },
      include: { jawabanSoal: true },
    });

    if (existingSubmission?.submittedAt) {
      return NextResponse.json(
        { success: false, error: 'Ujian sudah dikumpulkan' },
        { status: 400 }
      );
    }

    const hasManual = ujian.soal.some(s => MANUAL_GRADE_TYPES.includes(s.tipe));

    // Auto-grade all soal and calculate score
    let totalPoin = 0;
    let earnedPoin = 0;
    let allAutoGraded = true;

    const gradedAnswers: {
      soalId: string;
      jawaban: any;
      isCorrect: boolean | null;
      nilai: number | null;
    }[] = [];

    for (const soal of ujian.soal) {
      const userAnswer = answers?.[soal.id];
      const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);
      const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);

      totalPoin += soal.poin;

      if (isManual) {
        // Essay: store answer, guru grades later
        allAutoGraded = false;
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
        // Auto-grade this answer
        const jawabanData = typeof userAnswer === 'object' ? userAnswer : { jawaban: userAnswer };
        const gradeResult = autoGradeSoal(
          soal.tipe as TipeSoal,
          soal.data as unknown as SoalData,
          jawabanData as JawabanData
        );

        if (isPartial) {
          // Partial scoring: store score as nilai (0-100)
          earnedPoin += Math.round((gradeResult.score) * soal.poin);
          gradedAnswers.push({
            soalId: soal.id,
            jawaban: jawabanData,
            isCorrect: gradeResult.isCorrect,
            nilai: gradeResult.nilai, // 0-100 partial score
          });
        } else {
          // Binary scoring
          if (gradeResult.isCorrect) earnedPoin += soal.poin;
          gradedAnswers.push({
            soalId: soal.id,
            jawaban: jawabanData,
            isCorrect: gradeResult.isCorrect,
            nilai: gradeResult.isCorrect ? 100 : 0,
          });
        }
      } else {
        // No answer provided
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
    const status = hasManual ? 'pending' : 'completed';

    // Create or update submission
    let submission;
    if (existingSubmission && !existingSubmission.submittedAt) {
      submission = await prisma.ujianSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          submittedAt: new Date(),
          nilai: finalScore,
          status,
        },
      });
    } else {
      submission = await prisma.ujianSubmission.create({
        data: {
          ujianId: id,
          siswaId: siswa.id,
          startedAt: new Date(),
          submittedAt: new Date(),
          nilai: finalScore,
          status,
        },
      });
    }

    // Save all jawaban using unified JawabanSoal model
    let saved = 0;
    let updated = 0;

    for (const graded of gradedAnswers) {
      const existing = existingSubmission?.jawabanSoal?.find(
        (j) => j.soalId === graded.soalId
      );

      if (existing) {
        await prisma.jawabanSoal.update({
          where: { id: existing.id },
          data: {
            jawaban: graded.jawaban,
            isCorrect: graded.isCorrect,
            nilai: graded.nilai,
          },
        });
        updated++;
      } else {
        await prisma.jawabanSoal.create({
          data: {
            submissionId: submission.id,
            soalId: graded.soalId,
            jawaban: graded.jawaban,
            isCorrect: graded.isCorrect,
            nilai: graded.nilai,
          },
        });
        saved++;
      }
    }

    console.log(`[SUBMIT] siswa=${siswa.id} ujian=${id} score=${finalScore} status=${status} saved=${saved} updated=${updated}`);

    return NextResponse.json({
      success: true,
      data: {
        submission,
        score: finalScore,
        totalSoal: ujian.soal.length,
        totalSaved: saved + updated,
        message: hasManual
          ? 'Ujian berhasil dikumpulkan. Nilai akan diberikan setelah guru mengoreksi essay.'
          : `Ujian berhasil dikumpulkan. Nilai Anda: ${finalScore}`,
      },
    });
  } catch (error) {
    console.error('Error submitting ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit ujian' },
      { status: 500 }
    );
  }
}
