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

    const kelas = await prisma.kelas.findMany({
      where: { schoolId: session.schoolId },
      include: {
        _count: {
          select: { siswa: true },
        },
      },
      orderBy: [{ tingkat: 'asc' }, { nama: 'asc' }],
    });
    
    return NextResponse.json({
      success: true,
      data: kelas,
    });
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch kelas' },
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
    const tierCheck = await checkTierLimit(session.schoolId, 'kelas');
    if (!tierCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Batas maksimal kelas untuk tier ${tierCheck.tierLabel} adalah ${tierCheck.max}. Saat ini: ${tierCheck.current}. Upgrade tier untuk menambah kapasitas.` },
        { status: 403 }
      );
    }

    const newKelas = await prisma.kelas.create({
      data: { ...body, schoolId: session.schoolId },
    });
    
    return NextResponse.json({
      success: true,
      data: newKelas,
      message: 'Kelas berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating kelas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create kelas' },
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

    const existing = await prisma.kelas.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    
    const updatedKelas = await prisma.kelas.update({
      where: { id },
      data,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedKelas,
      message: 'Kelas berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating kelas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update kelas' },
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

    const existing = await prisma.kelas.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kelas tidak ditemukan' }, { status: 404 });
    }
    
    await prisma.kelas.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Kelas berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete kelas' },
      { status: 500 }
    );
  }
}
