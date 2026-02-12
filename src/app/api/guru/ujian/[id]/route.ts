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

    // Get ujian detail with questions
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
      include: {
        mapel: true,
        soal: {
          orderBy: {
            urutan: 'asc',
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

    return NextResponse.json({
      success: true,
      data: {
        ujian: {
          id: ujian.id,
          judul: ujian.judul,
          deskripsi: ujian.deskripsi,
          mapel: ujian.mapel.nama,
          mapelId: ujian.mapelId,
          kelas: ujian.kelas,
          startUjian: ujian.startUjian,
          endUjian: ujian.endUjian,
          shuffleQuestions: ujian.shuffleQuestions,
          showScore: ujian.showScore,
          status: ujian.status,
          createdAt: ujian.createdAt,
        },
        soal: ujian.soal.map((soal) => ({
          id: soal.id,
          tipe: soal.tipe,
          pertanyaan: soal.pertanyaan,
          poin: soal.poin,
          data: soal.data,
          urutan: soal.urutan,
        })),
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

    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      judul, 
      deskripsi, 
      mapelId, 
      kelas, 
      startUjian, 
      endUjian,
      shuffleQuestions,
      showScore,
      status,
    } = body;

    // Validate
    if (!judul || !judul.trim()) {
      return NextResponse.json(
        { success: false, error: 'Judul harus diisi' },
        { status: 400 }
      );
    }

    // Validate startUjian and endUjian
    if (!startUjian || !endUjian) {
      return NextResponse.json(
        { success: false, error: 'Waktu mulai dan waktu akhir ujian harus diisi' },
        { status: 400 }
      );
    }

    const startDate = new Date(startUjian);
    const endDate = new Date(endUjian);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format waktu tidak valid' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'Waktu akhir harus lebih besar dari waktu mulai' },
        { status: 400 }
      );
    }

    // Check if ujian exists and belongs to this guru
    const existingUjian = await prisma.ujian.findFirst({
      where: {
        id: id,
        guruId: guru.id,
      },
      include: {
        soal: true,
      },
    });

    if (!existingUjian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found' },
        { status: 404 }
      );
    }

    // Validasi: Jika status aktif/publish, harus ada minimal 1 soal dengan pertanyaan
    const finalStatus = status || existingUjian.status || 'draft';
    
    if (finalStatus === 'aktif') {
      if (existingUjian.soal.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tidak dapat mempublikasikan ujian. Minimal harus ada 1 soal. Silakan tambahkan soal terlebih dahulu.' 
          },
          { status: 400 }
        );
      }

      // Cek apakah semua soal memiliki pertanyaan
      const invalidSoal = existingUjian.soal.filter((soal) => {
        const hasQuestion = soal.pertanyaan && soal.pertanyaan.replace(/<[^>]*>/g, '').trim().length > 0;
        return !hasQuestion;
      });

      if (invalidSoal.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Tidak dapat mempublikasikan ujian. Terdapat ${invalidSoal.length} soal yang belum memiliki pertanyaan.` 
          },
          { status: 400 }
        );
      }
    }

    // Update ujian info (soal dikelola melalui /api/guru/ujian/[id]/soal)
    const updatedUjian = await prisma.ujian.update({
      where: { id },
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi?.trim() || null,
        mapelId: mapelId || existingUjian.mapelId,
        kelas: Array.isArray(kelas) ? kelas : (kelas ? [kelas] : existingUjian.kelas),
        startUjian: startDate,
        endUjian: endDate,
        shuffleQuestions: shuffleQuestions !== undefined ? shuffleQuestions : existingUjian.shuffleQuestions,
        showScore: showScore !== undefined ? showScore : existingUjian.showScore,
        status: finalStatus,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUjian,
      message: 'Ujian berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ujian' },
      { status: 500 }
    );
  }
}
