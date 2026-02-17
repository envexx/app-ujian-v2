import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tanggalParam = searchParams.get('tanggal');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let startOfDay: Date;
    let endOfDay: Date;
    
    // Check if date range is provided (for export)
    if (startDateParam && endDateParam) {
      startOfDay = new Date(startDateParam);
      startOfDay.setHours(0, 0, 0, 0);
      
      endOfDay = new Date(endDateParam);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      // Single date query (for daily view)
      const tanggal = tanggalParam ? new Date(tanggalParam) : new Date();
      startOfDay = new Date(tanggal);
      startOfDay.setHours(0, 0, 0, 0);
      
      endOfDay = new Date(tanggal);
      endOfDay.setHours(23, 59, 59, 999);
    }
    
    console.log('Fetching presensi for date range:', { startOfDay, endOfDay });
    
    const presensi = await prisma.presensi.findMany({
      where: {
        siswa: { schoolId: session.schoolId },
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    
    console.log('Found presensi records:', presensi.length);
    
    return NextResponse.json({
      success: true,
      data: presensi,
    });
  } catch (error) {
    console.error('Error fetching presensi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presensi' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify siswa belongs to this school
    const siswa = await prisma.siswa.findFirst({ where: { id: body.siswaId, schoolId: session.schoolId } });
    if (!siswa) {
      return NextResponse.json({ success: false, error: 'Siswa tidak ditemukan' }, { status: 404 });
    }
    
    // Create new presensi
    const presensi = await prisma.presensi.create({
      data: {
        siswaId: body.siswaId,
        tanggal: new Date(body.tanggal),
        status: body.status,
        keterangan: body.keterangan,
      },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: presensi,
      message: 'Presensi berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating presensi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create presensi' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID presensi diperlukan' },
        { status: 400 }
      );
    }
    
    // Update existing presensi
    const presensi = await prisma.presensi.update({
      where: { id: body.id },
      data: {
        status: body.status,
        keterangan: body.keterangan,
      },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      data: presensi,
      message: 'Presensi berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating presensi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update presensi' },
      { status: 500 }
    );
  }
}
