import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: List all notifications
export async function GET(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.platformNotification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { reads: true } },
        },
      }),
      prisma.platformNotification.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil notifikasi' }, { status: 500 });
  }
}

// POST: Create notification
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { judul, pesan, tipe, targetRole, targetSchoolIds, priority, expiresAt, publish } = body;

    if (!judul || !pesan || !tipe) {
      return NextResponse.json({ success: false, error: 'Judul, pesan, dan tipe harus diisi' }, { status: 400 });
    }

    const notification = await prisma.platformNotification.create({
      data: {
        judul,
        pesan,
        tipe: tipe || 'info',
        targetRole: targetRole || ['ALL'],
        targetSchoolIds: targetSchoolIds || [],
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPublished: publish === true,
        publishedAt: publish === true ? new Date() : null,
        createdBy: session.userId!,
      },
    });

    return NextResponse.json({
      success: true,
      data: notification,
      message: publish ? 'Notifikasi berhasil dipublikasikan' : 'Notifikasi berhasil disimpan sebagai draft',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat notifikasi' }, { status: 500 });
  }
}

// PUT: Update notification
export async function PUT(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, publish, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID notifikasi harus diisi' }, { status: 400 });
    }

    const updateData: any = { ...data };
    if (publish === true) {
      updateData.isPublished = true;
      updateData.publishedAt = new Date();
    } else if (publish === false) {
      updateData.isPublished = false;
      updateData.publishedAt = null;
    }
    if (data.expiresAt) {
      updateData.expiresAt = new Date(data.expiresAt);
    }

    const notification = await prisma.platformNotification.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notifikasi berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate notifikasi' }, { status: 500 });
  }
}

// DELETE: Delete notification
export async function DELETE(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID notifikasi harus diisi' }, { status: 400 });
    }

    await prisma.platformNotification.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Notifikasi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus notifikasi' }, { status: 500 });
  }
}
