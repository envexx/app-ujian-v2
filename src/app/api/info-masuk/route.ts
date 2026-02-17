import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // Check if prisma is properly initialized
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Check if infoMasuk model exists
    if (!prisma.infoMasuk) {
      console.error('InfoMasuk model not found in Prisma client');
      console.error('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
      return NextResponse.json(
        { success: false, error: 'InfoMasuk model not found. Please run: npx prisma generate' },
        { status: 500 }
      );
    }

    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const infoMasuk = await prisma.infoMasuk.findMany({
      where: { schoolId: session.schoolId },
      orderBy: {
        hari: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: infoMasuk,
    });
  } catch (error: any) {
    console.error('Error fetching info masuk:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to fetch info masuk',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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

    if (!prisma?.infoMasuk) {
      return NextResponse.json(
        { success: false, error: 'Database model not available. Please restart the server after running: npx prisma generate' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { hari, jamMasuk, jamPulang } = body;

    if (!hari || !jamMasuk || !jamPulang) {
      return NextResponse.json(
        { success: false, error: 'Hari, jamMasuk, dan jamPulang diperlukan' },
        { status: 400 }
      );
    }

    const infoMasuk = await prisma.infoMasuk.upsert({
      where: { schoolId_hari: { schoolId: session.schoolId!, hari } },
      update: {
        jamMasuk,
        jamPulang,
      },
      create: {
        schoolId: session.schoolId!,
        hari,
        jamMasuk,
        jamPulang,
      },
    });

    return NextResponse.json({
      success: true,
      data: infoMasuk,
      message: 'Info masuk berhasil disimpan',
    });
  } catch (error: any) {
    console.error('Error creating/updating info masuk:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to save info masuk',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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

    if (!prisma?.infoMasuk) {
      return NextResponse.json(
        { success: false, error: 'Database model not available. Please restart the server after running: npx prisma generate' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, hari, jamMasuk, jamPulang } = body;

    if (!id || !hari || !jamMasuk || !jamPulang) {
      return NextResponse.json(
        { success: false, error: 'ID, hari, jamMasuk, dan jamPulang diperlukan' },
        { status: 400 }
      );
    }

    const infoMasuk = await prisma.infoMasuk.update({
      where: { id },
      data: {
        hari,
        jamMasuk,
        jamPulang,
      },
    });

    return NextResponse.json({
      success: true,
      data: infoMasuk,
      message: 'Info masuk berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating info masuk:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to update info masuk',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
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

    if (!prisma?.infoMasuk) {
      return NextResponse.json(
        { success: false, error: 'Database model not available. Please restart the server after running: npx prisma generate' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID diperlukan' },
        { status: 400 }
      );
    }

    await prisma.infoMasuk.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Info masuk berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting info masuk:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to delete info masuk',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

