import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasFilter = searchParams.get('kelas');
    const guruId = searchParams.get('guruId');
    const mapelId = searchParams.get('mapel');
    
    const tugas = await prisma.tugas.findMany({
      where: {
        ...(kelasFilter && kelasFilter !== 'all' ? {
          kelas: { has: kelasFilter }
        } : {}),
        ...(guruId ? { guruId } : {}),
        ...(mapelId && mapelId !== 'all' ? { mapelId } : {}),
      },
      include: includes.tugasWithStats,
      orderBy: { deadline: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: tugas,
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
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const newTugas = await prisma.tugas.create({
      data: {
        ...body,
        schoolId: session.schoolId,
        status: body.status || 'aktif',
      },
      include: includes.tugasWithStats,
    });
    
    return NextResponse.json({
      success: true,
      data: newTugas,
      message: 'Tugas berhasil dibuat',
    });
  } catch (error) {
    console.error('Error creating tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tugas' },
      { status: 500 }
    );
  }
}
