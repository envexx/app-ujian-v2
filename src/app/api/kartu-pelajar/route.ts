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
    const kelasId = searchParams.get('kelas');
    
    const kartuPelajar = await prisma.kartuPelajar.findMany({
      where: {
        siswa: {
          schoolId: session.schoolId,
          ...(kelasId && kelasId !== 'all' ? { kelasId } : {}),
        },
      },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
      orderBy: { siswa: { nama: 'asc' } },
    });
    
    return NextResponse.json({
      success: true,
      data: kartuPelajar,
    });
  } catch (error) {
    console.error('Error fetching kartu pelajar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kartu pelajar' },
      { status: 500 }
    );
  }
}
