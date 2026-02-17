import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const kelasFilter = searchParams.get('kelas');
    const mapelId = searchParams.get('mapel');
    const guruId = searchParams.get('guruId');
    
    const materi = await prisma.materi.findMany({
      where: {
        schoolId: session.schoolId,
        ...(kelasFilter && kelasFilter !== 'all' ? {
          kelas: { has: kelasFilter }
        } : {}),
        ...(mapelId && mapelId !== 'all' ? { mapelId } : {}),
        ...(guruId ? { guruId } : {}),
      },
      include: {
        mapel: true,
        guru: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      data: materi,
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
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const newMateri = await prisma.materi.create({
      data: { ...body, schoolId: session.schoolId },
      include: {
        mapel: true,
        guru: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: newMateri,
      message: 'Materi berhasil diupload',
    });
  } catch (error) {
    console.error('Error creating materi:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create materi' },
      { status: 500 }
    );
  }
}
