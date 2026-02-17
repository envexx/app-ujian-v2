import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const kelasFilter = searchParams.get('kelas');
    const tipeFilter = searchParams.get('tipe');

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

    // Build where clause
    const where: any = {
      guruId: guru.id,
    };

    if (kelasFilter && kelasFilter !== 'all') {
      where.kelas = {
        has: kelasFilter,
      };
    }

    if (tipeFilter && tipeFilter !== 'all') {
      where.tipe = tipeFilter;
    }

    // Get materi
    const materi = await prisma.materi.findMany({
      where,
      include: {
        mapel: true,
      },
      orderBy: {
        tanggalUpload: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        materi: materi.map((m) => ({
          id: m.id,
          judul: m.judul,
          deskripsi: m.deskripsi,
          kelas: m.kelas,
          mapel: m.mapel.nama,
          mapelId: m.mapelId,
          tipe: m.tipe,
          fileUrl: m.fileUrl,
          tanggalUpload: m.tanggalUpload,
          ukuranFile: m.ukuran,
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

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { judul, deskripsi, mapelId, kelas, tipe, fileUrl, ukuran } = body;

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

    // Create materi
    const materi = await prisma.materi.create({
      data: {
        schoolId: guru.schoolId,
        judul,
        deskripsi,
        mapelId,
        guruId: guru.id,
        kelas: Array.isArray(kelas) ? kelas : [kelas],
        tipe,
        fileUrl,
        ukuran,
        tanggalUpload: new Date(),
      },
      include: {
        mapel: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: materi,
      message: 'Materi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating materi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create materi' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
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

    // Delete materi (only if owned by this guru)
    await prisma.materi.deleteMany({
      where: {
        id,
        guruId: guru.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Materi berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting materi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete materi' },
      { status: 500 }
    );
  }
}
