import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// Types that need manual grading by guru
const MANUAL_GRADE_TYPES = ['ESSAY'];
// Types that support partial scoring (nilai 0-100 stored on JawabanSoal)
const PARTIAL_SCORE_TYPES = ['PENCOCOKAN'];

/**
 * Calculate poin-based score for a submission.
 * Total poin per ujian = 100 (guru sets this).
 * nilaiTotal = sum of all earned poin (no percentage/division).
 * 
 * For auto-graded types:
 * - Most types: isCorrect ? full poin : 0
 * - Partial score types (Pencocokan): (nilai / 100) * poin
 * 
 * For manual types (Essay):
 * - nilai is direct poin earned (0 to soal.poin), stored as-is
 */
function calculateScore(
  soalList: { id: string; tipe: string; poin: number; data: any }[],
  jawabanList: { soalId: string; nilai: number | null; isCorrect: boolean | null }[]
): { nilaiAuto: number; nilaiManual: number; totalPoinAuto: number; totalPoinManual: number; earnedPoinAuto: number; earnedPoinManual: number; nilaiTotal: number; totalPoin: number; allGraded: boolean } {
  let totalPoinAuto = 0;
  let totalPoinManual = 0;
  let earnedPoinAuto = 0;
  let earnedPoinManual = 0;
  let allGraded = true;

  for (const soal of soalList) {
    const jawaban = jawabanList.find(j => j.soalId === soal.id);
    const isManual = MANUAL_GRADE_TYPES.includes(soal.tipe);
    const isPartial = PARTIAL_SCORE_TYPES.includes(soal.tipe);

    if (isManual) {
      totalPoinManual += soal.poin;
      if (jawaban && jawaban.nilai !== null) {
        // Manual grade: nilai is direct poin earned (0 to soal.poin)
        earnedPoinManual += Math.min(jawaban.nilai, soal.poin);
      } else if (jawaban) {
        allGraded = false; // Has answer but not yet graded
      }
    } else {
      totalPoinAuto += soal.poin;
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

  const totalPoin = totalPoinAuto + totalPoinManual;
  const earnedTotal = earnedPoinAuto + earnedPoinManual;
  // Direct sum — no percentage conversion. Total poin = 100, so earned = final score.
  const nilaiAuto = earnedPoinAuto;
  const nilaiManual = earnedPoinManual;
  const nilaiTotal = earnedTotal;

  return { nilaiAuto, nilaiManual, totalPoinAuto, totalPoinManual, earnedPoinAuto, earnedPoinManual, nilaiTotal, totalPoin, allGraded };
}

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

    // Get ujian with soal and submissions
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
      include: {
        mapel: true,
        soal: {
          orderBy: { urutan: 'asc' },
        },
        submissions: {
          include: {
            siswa: true,
            jawabanSoal: true,
          },
          orderBy: {
            submittedAt: 'desc',
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

    // Get all siswa in the kelas
    const allSiswa = await prisma.siswa.findMany({
      where: {
        kelas: {
          nama: {
            in: ujian.kelas,
          },
        },
      },
      orderBy: {
        nama: 'asc',
      },
    });

    // Soal summary by type
    const soalByType: Record<string, number> = {};
    let totalPoin = 0;
    for (const soal of ujian.soal) {
      soalByType[soal.tipe] = (soalByType[soal.tipe] || 0) + 1;
      totalPoin += soal.poin;
    }

    const hasManualSoal = ujian.soal.some(s => MANUAL_GRADE_TYPES.includes(s.tipe));

    // Map submissions with all siswa
    const submissionsMap = new Map(
      ujian.submissions.map((sub) => [sub.siswaId, sub])
    );

    const submissions = allSiswa.map((siswa) => {
      const submission = submissionsMap.get(siswa.id);

      if (!submission) {
        return {
          id: null,
          siswaId: siswa.id,
          siswa: siswa.nama,
          nisn: siswa.nisn,
          submittedAt: null,
          nilaiAuto: null,
          nilaiManual: null,
          nilaiTotal: null,
          status: 'belum' as const,
          allGraded: false,
          jawaban: [],
        };
      }

      // Calculate scores
      const scores = calculateScore(
        ujian.soal.map(s => ({ id: s.id, tipe: s.tipe, poin: s.poin, data: s.data })),
        submission.jawabanSoal.map(j => ({ soalId: j.soalId, nilai: j.nilai, isCorrect: j.isCorrect }))
      );

      // Determine status
      let status: 'belum' | 'sudah' | 'perlu_dinilai' = 'sudah';
      if (hasManualSoal && !scores.allGraded) {
        status = 'perlu_dinilai';
      }

      return {
        id: submission.id,
        siswaId: siswa.id,
        siswa: siswa.nama,
        nisn: siswa.nisn,
        submittedAt: submission.submittedAt,
        nilaiAuto: scores.nilaiAuto,
        nilaiManual: scores.totalPoinManual > 0 ? scores.nilaiManual : null,
        nilaiTotal: submission.nilai ?? scores.nilaiTotal,
        status,
        allGraded: scores.allGraded,
        jawaban: submission.jawabanSoal.map((j) => ({
          id: j.id,
          soalId: j.soalId,
          jawaban: j.jawaban,
          nilai: j.nilai,
          feedback: j.feedback,
          isCorrect: j.isCorrect,
        })),
      };
    });

    // Build soal list for frontend (with answer keys for display)
    const soalForDisplay = ujian.soal.map((soal, index) => ({
      id: soal.id,
      nomor: index + 1,
      tipe: soal.tipe,
      pertanyaan: soal.pertanyaan,
      poin: soal.poin,
      data: soal.data,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          deskripsi: ujian.deskripsi,
          mapel: ujian.mapel.nama,
          kelas: ujian.kelas,
          startUjian: ujian.startUjian,
          endUjian: ujian.endUjian,
          totalSoal: ujian.soal.length,
          totalPoin,
          soalByType,
          hasManualSoal,
        },
        soal: soalForDisplay,
        submissions,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian nilai:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian nilai' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Grade manual soal (essay) for a submission
 * Body: { submissionId, grades: [{ jawabanId, nilai (0-poin), feedback }] }
 */
export async function PUT(
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

    const body = await request.json();
    const { submissionId, grades } = body;

    if (!submissionId || !grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: submissionId, grades[]' },
        { status: 400 }
      );
    }

    // Update each jawaban with grade
    for (const grade of grades) {
      if (!grade.jawabanId) {
        console.error('Missing jawabanId:', grade);
        continue;
      }

      await prisma.jawabanSoal.update({
        where: { id: grade.jawabanId },
        data: {
          nilai: grade.nilai ?? 0,
          feedback: grade.feedback || '',
        },
      });
    }

    // Recalculate total score for this submission
    const submission = await prisma.ujianSubmission.findUnique({
      where: { id: submissionId },
      include: {
        ujian: {
          include: {
            soal: { orderBy: { urutan: 'asc' } },
          },
        },
        jawabanSoal: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const scores = calculateScore(
      submission.ujian.soal.map(s => ({ id: s.id, tipe: s.tipe, poin: s.poin, data: s.data })),
      submission.jawabanSoal.map(j => ({ soalId: j.soalId, nilai: j.nilai, isCorrect: j.isCorrect }))
    );

    // Update submission with final score
    const newStatus = scores.allGraded ? 'graded' : submission.status;
    await prisma.ujianSubmission.update({
      where: { id: submissionId },
      data: {
        nilai: scores.nilaiTotal,
        status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Nilai berhasil disimpan',
      data: {
        nilai: scores.nilaiTotal,
        status: newStatus,
      },
    });
  } catch (error) {
    console.error('Error updating grades:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update grades' },
      { status: 500 }
    );
  }
}
