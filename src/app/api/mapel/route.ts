import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { checkTierLimit } from '@/lib/tier-limits';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const mapel = await prisma.mataPelajaran.findMany({
      where: { schoolId: session.schoolId },
      include: {
        _count: {
          select: { guru: true },
        },
      },
      orderBy: { nama: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: mapel,
    });
  } catch (error) {
    console.error('Error fetching mapel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mapel' },
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

    // Check tier limit
    const tierCheck = await checkTierLimit(session.schoolId, 'mapel');
    if (!tierCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Batas maksimal mata pelajaran untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.` },
        { status: 403 }
      );
    }
    
    const newMapel = await prisma.mataPelajaran.create({
      data: { ...body, schoolId: session.schoolId },
    });
    
    return NextResponse.json({
      success: true,
      data: newMapel,
      message: 'Mata pelajaran berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating mapel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapel' },
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
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.mataPelajaran.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Mapel tidak ditemukan' }, { status: 404 });
    }
    
    const updatedMapel = await prisma.mataPelajaran.update({
      where: { id },
      data,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedMapel,
      message: 'Mata pelajaran berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating mapel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update mapel' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const existing = await prisma.mataPelajaran.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Mapel tidak ditemukan' }, { status: 404 });
    }
    
    await prisma.mataPelajaran.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Mata pelajaran berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting mapel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mapel' },
      { status: 500 }
    );
  }
}
