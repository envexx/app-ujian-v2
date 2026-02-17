import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: List all landing media
export async function GET() {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const media = await prisma.landingMedia.findMany({
      orderBy: { urutan: 'asc' },
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Error fetching landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data media' }, { status: 500 });
  }
}

// POST: Create new landing media
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tipe, judul, url, aspectRatio, urutan } = body;

    if (!tipe || !judul || !url) {
      return NextResponse.json({ success: false, error: 'Tipe, judul, dan URL harus diisi' }, { status: 400 });
    }

    if (!['image', 'video'].includes(tipe)) {
      return NextResponse.json({ success: false, error: 'Tipe harus image atau video' }, { status: 400 });
    }

    if (aspectRatio && !['16:9', '9:16', '1:1'].includes(aspectRatio)) {
      return NextResponse.json({ success: false, error: 'Aspect ratio harus 16:9, 9:16, atau 1:1' }, { status: 400 });
    }

    const media = await prisma.landingMedia.create({
      data: {
        tipe,
        judul,
        url,
        aspectRatio: aspectRatio || '16:9',
        urutan: urutan ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: media, message: 'Media berhasil ditambahkan' });
  } catch (error) {
    console.error('Error creating landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal menambahkan media' }, { status: 500 });
  }
}

// PUT: Update landing media
export async function PUT(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, tipe, judul, url, aspectRatio, urutan, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID harus diisi' }, { status: 400 });
    }

    const existing = await prisma.landingMedia.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Media tidak ditemukan' }, { status: 404 });
    }

    const media = await prisma.landingMedia.update({
      where: { id },
      data: {
        ...(tipe !== undefined && { tipe }),
        ...(judul !== undefined && { judul }),
        ...(url !== undefined && { url }),
        ...(aspectRatio !== undefined && { aspectRatio }),
        ...(urutan !== undefined && { urutan }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: media, message: 'Media berhasil diupdate' });
  } catch (error) {
    console.error('Error updating landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate media' }, { status: 500 });
  }
}

// DELETE: Delete landing media
export async function DELETE(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID harus diisi' }, { status: 400 });
    }

    await prisma.landingMedia.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Media berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus media' }, { status: 500 });
  }
}
