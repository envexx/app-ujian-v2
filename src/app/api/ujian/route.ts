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
    const statusFilter = searchParams.get('status');
    
    const ujian = await prisma.ujian.findMany({
      where: {
        ...(kelasFilter && kelasFilter !== 'all' ? {
          kelas: { has: kelasFilter }
        } : {}),
        ...(guruId ? { guruId } : {}),
        ...(mapelId && mapelId !== 'all' ? { mapelId } : {}),
        ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter as any } : {}),
      },
      include: includes.ujianWithStats,
      orderBy: { startUjian: 'desc' },
    });
    
    return NextResponse.json({
      success: true,
      data: ujian,
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian' },
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
    
    const newUjian = await prisma.ujian.create({
      data: {
        ...body,
        schoolId: session.schoolId,
        status: body.status || 'DRAFT',
      },
      include: includes.ujianWithStats,
    });
    
    return NextResponse.json({
      success: true,
      data: newUjian,
      message: 'Ujian berhasil dibuat',
    });
  } catch (error) {
    console.error('Error creating ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ujian' },
      { status: 500 }
    );
  }
}
