import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';
import type { PilihanGandaData, PencocokanData } from '@/types/soal';

/**
 * SECURITY: Strip answer keys from soal data before sending to student.
 * Each soal type has different fields that contain the answer.
 */
function sanitizeSoalData(tipe: string, data: any): any {
  switch (tipe) {
    case 'PILIHAN_GANDA': {
      const pgData = data as PilihanGandaData;
      return {
        opsi: pgData.opsi, // Keep options, remove kunciJawaban
      };
    }
    case 'ESSAY': {
      return {
        minKata: data.minKata,
        maxKata: data.maxKata,
        // Remove kunciJawaban
      };
    }
    case 'ISIAN_SINGKAT': {
      return {
        caseSensitive: data.caseSensitive,
        // Remove kunciJawaban
      };
    }
    case 'PENCOCOKAN': {
      const pencocokanData = data as PencocokanData;
      return {
        itemKiri: pencocokanData.itemKiri,
        itemKanan: pencocokanData.itemKanan,
        // Remove jawaban (the correct mapping)
      };
    }
    case 'BENAR_SALAH': {
      return {};
      // Remove kunciJawaban — student just sees Benar/Salah buttons
    }
    default:
      return {};
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Use refreshSession to keep session alive when loading exam (rolling session)
    const session = await refreshSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
      include: { kelas: true },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Get ujian detail with unified soal model (same school)
    const ujian = await prisma.ujian.findFirst({
      where: {
        id,
        schoolId: siswa.schoolId,
        kelas: { has: siswa.kelas.nama },
        status: 'aktif',
      },
      include: {
        mapel: true,
        soal: {
          orderBy: { urutan: 'asc' },
          select: {
            id: true,
            tipe: true,
            urutan: true,
            pertanyaan: true,
            poin: true,
            data: true, // Will be sanitized before sending
          },
        },
        submissions: {
          where: { siswaId: siswa.id },
        },
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Check time validation
    const now = new Date();
    const examStartTime = new Date(ujian.startUjian);
    const examEndTime = new Date(ujian.endUjian);

    const canStart = now >= examStartTime && now <= examEndTime && !ujian.submissions[0]?.submittedAt;

    // Calculate remaining time in seconds
    const timeRemaining = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));

    // Helper function to format date in Indonesian
    const formatDateIndonesian = (date: Date) => {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatTime = (date: Date) => {
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    // Determine access status message
    let accessMessage = '';
    if (ujian.submissions[0]?.submittedAt) {
      accessMessage = 'Ujian sudah dikumpulkan';
    } else if (now < examStartTime) {
      accessMessage = `Ujian belum dimulai. Ujian dapat diakses mulai ${formatDateIndonesian(examStartTime)} pukul ${formatTime(examStartTime)}`;
    } else if (now > examEndTime) {
      accessMessage = `Waktu ujian telah berakhir. Ujian berakhir pada ${formatDateIndonesian(examEndTime)} pukul ${formatTime(examEndTime)}`;
    } else {
      accessMessage = 'Ujian dapat diakses';
    }

    // SECURITY: Sanitize soal data — strip answer keys before sending to client
    const soal = ujian.soal.map((s, idx) => ({
      id: s.id,
      tipe: s.tipe,
      urutan: s.urutan,
      nomor: idx + 1,
      pertanyaan: s.pertanyaan,
      poin: s.poin,
      data: sanitizeSoalData(s.tipe, s.data),
    }));

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          deskripsi: ujian.deskripsi,
          mapel: ujian.mapel.nama,
          startUjian: ujian.startUjian,
          endUjian: ujian.endUjian,
          shuffleQuestions: ujian.shuffleQuestions,
          totalSoal: ujian.soal.length,
        },
        soal,
        submission: ujian.submissions[0] || null,
        canStart,
        timeRemaining,
        examStartTime: examStartTime.toISOString(),
        examEndTime: examEndTime.toISOString(),
        accessMessage,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian detail' },
      { status: 500 }
    );
  }
}
