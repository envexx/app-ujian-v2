import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const MANUAL_GRADE_TYPES = ['ESSAY'];
const PARTIAL_SCORE_TYPES = ['PENCOCOKAN'];

/**
 * POST - Recalculate all scores for an exam using poin-based scoring
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // Get ujian with soal and submissions
    const ujian = await prisma.ujian.findUnique({
      where: { id },
      include: {
        soal: { orderBy: { urutan: 'asc' } },
        submissions: {
          include: {
            jawabanSoal: true,
          },
        },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Verify guru owns this ujian
    if (ujian.guruId !== guru.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - not your ujian' },
        { status: 403 }
      );
    }

    let updatedCount = 0;

    // Recalculate each submission
    for (const submission of ujian.submissions) {
      let totalPoinAuto = 0;
      let totalPoinManual = 0;
      let earnedPoinAuto = 0;
      let earnedPoinManual = 0;

      for (const soal of ujian.soal) {
        const jawaban = submission.jawabanSoal.find(j => j.soalId === soal.id);
        const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);

        if (isManual) {
          totalPoinManual += soal.poin;
          if (jawaban && jawaban.nilai !== null) {
            // Manual grade: nilai is direct poin earned (0 to soal.poin)
            earnedPoinManual += Math.min(jawaban.nilai, soal.poin);
          }
        } else {
          totalPoinAuto += soal.poin;
          const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);
          if (jawaban) {
            if (isPartial && jawaban.nilai !== null) {
              // Partial scoring: nilai is 0-100, convert to proportional poin
              earnedPoinAuto += Math.round((jawaban.nilai / 100) * soal.poin);
            } else if (jawaban.isCorrect) {
              // Binary scoring: full poin if correct
              earnedPoinAuto += soal.poin;
            }
          }
        }
      }

      const earnedTotal = earnedPoinAuto + earnedPoinManual;
      // Direct sum — no percentage conversion. Total poin = 100, so earned = final score.
      const nilaiTotal = earnedTotal;

      await prisma.ujianSubmission.update({
        where: { id: submission.id },
        data: { nilai: nilaiTotal },
      });

      updatedCount++;
    }

    console.log(`Recalculated ${updatedCount} submissions for ujian ${id}`);

    return NextResponse.json({
      success: true,
      message: `Berhasil menghitung ulang ${updatedCount} nilai`,
      updated: updatedCount,
    });
  } catch (error) {
    console.error('Error recalculating scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate scores' },
      { status: 500 }
    );
  }
}
