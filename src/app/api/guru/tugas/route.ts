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
    const statusFilter = searchParams.get('status');

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

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    // Get tugas with submission count
    const [tugas, kelasList, mapelList] = await Promise.all([
      prisma.tugas.findMany({
        where,
        include: {
          mapel: true,
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          deadline: 'desc',
        },
      }),
      // Get kelas that this guru teaches
      prisma.kelas.findMany({
        where: {
          guru: {
            some: {
              guruId: guru.id,
            },
          },
        },
        select: {
          id: true,
          nama: true,
        },
        orderBy: {
          nama: 'asc',
        },
      }),
      // Get mapel that this guru teaches
      prisma.guruMapel.findMany({
        where: {
          guruId: guru.id,
        },
        include: {
          mapel: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        tugas: tugas.map((t) => ({
          id: t.id,
          judul: t.judul,
          deskripsi: t.deskripsi,
          instruksi: t.instruksi,
          mapel: t.mapel.nama,
          mapelId: t.mapelId,
          kelas: t.kelas,
          deadline: t.deadline,
          fileUrl: t.fileUrl,
          status: t.status,
          totalSubmissions: t._count.submissions,
          createdAt: t.createdAt,
        })),
        kelasList: kelasList.map((k) => ({
          id: k.id,
          nama: k.nama,
        })),
        mapelList: mapelList.map((gm) => ({
          id: gm.mapel.id,
          nama: gm.mapel.nama,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tugas' },
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
    const { judul, deskripsi, instruksi, mapelId, kelas, deadline, fileUrl } = body;

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

    // Create tugas
    const tugas = await prisma.tugas.create({
      data: {
        schoolId: guru.schoolId,
        judul,
        deskripsi,
        instruksi,
        mapelId,
        guruId: guru.id,
        kelas: Array.isArray(kelas) ? kelas : [kelas],
        deadline: new Date(deadline),
        fileUrl,
        status: 'aktif',
      },
      include: {
        mapel: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: tugas,
      message: 'Tugas berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tugas' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, judul, deskripsi, instruksi, mapelId, kelas, deadline, fileUrl, status } = body;

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

    // Update tugas (only if owned by this guru)
    const tugas = await prisma.tugas.updateMany({
      where: {
        id,
        guruId: guru.id,
      },
      data: {
        judul,
        deskripsi,
        instruksi,
        mapelId,
        kelas: Array.isArray(kelas) ? kelas : [kelas],
        deadline: deadline ? new Date(deadline) : undefined,
        fileUrl,
        status,
      },
    });

    if (tugas.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Tugas not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tugas berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tugas' },
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

    // Delete tugas (only if owned by this guru)
    await prisma.tugas.deleteMany({
      where: {
        id,
        guruId: guru.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tugas berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete tugas' },
      { status: 500 }
    );
  }
}
