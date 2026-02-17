import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sekolahInfo = await prisma.sekolahInfo.findFirst({
      where: { schoolId: session.schoolId },
    });
    
    return NextResponse.json({
      success: true,
      data: sekolahInfo,
    });
  } catch (error) {
    console.error('Error fetching sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sekolah info' },
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
    
    // Check if school info already exists for this school
    const existing = await prisma.sekolahInfo.findFirst({
      where: { schoolId: session.schoolId },
    });
    
    if (existing) {
      // Update existing record
      const updated = await prisma.sekolahInfo.update({
        where: { id: existing.id },
        data: body,
      });
      
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Informasi sekolah berhasil diperbarui',
      });
    } else {
      // Create new record
      const created = await prisma.sekolahInfo.create({
        data: { ...body, schoolId: session.schoolId },
      });
      
      return NextResponse.json({
        success: true,
        data: created,
        message: 'Informasi sekolah berhasil ditambahkan',
      });
    }
  } catch (error) {
    console.error('Error saving sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save sekolah info' },
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

    const existing = await prisma.sekolahInfo.findFirst({ where: { id, schoolId: session.schoolId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 404 });
    }
    
    const updated = await prisma.sekolahInfo.update({
      where: { id },
      data,
    });
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Informasi sekolah berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating sekolah info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update sekolah info' },
      { status: 500 }
    );
  }
}
