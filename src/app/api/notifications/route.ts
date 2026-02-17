import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET: Get notifications for current user
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.role || '';
    const schoolId = session.schoolId || '';

    const notifications = await prisma.platformNotification.findMany({
      where: {
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        AND: [
          {
            OR: [
              { targetRole: { has: 'ALL' } },
              { targetRole: { has: role } },
            ],
          },
          {
            OR: [
              { targetSchoolIds: { isEmpty: true } },
              ...(schoolId ? [{ targetSchoolIds: { has: schoolId } }] : []),
            ],
          },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        reads: {
          where: { userId: session.userId },
          select: { id: true, readAt: true },
        },
      },
    });

    const data = notifications.map((n) => ({
      id: n.id,
      judul: n.judul,
      pesan: n.pesan,
      tipe: n.tipe,
      priority: n.priority,
      publishedAt: n.publishedAt,
      isRead: n.reads.length > 0,
      readAt: n.reads[0]?.readAt || null,
    }));

    const unreadCount = data.filter((n) => !n.isRead).length;

    return NextResponse.json({ success: true, data, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil notifikasi' }, { status: 500 });
  }
}

// POST: Mark notification as read
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      const role = session.role || '';
      const schoolId = session.schoolId || '';

      const unreadNotifications = await prisma.platformNotification.findMany({
        where: {
          isPublished: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
          AND: [
            {
              OR: [
                { targetRole: { has: 'ALL' } },
                { targetRole: { has: role } },
              ],
            },
            {
              OR: [
                { targetSchoolIds: { isEmpty: true } },
                ...(schoolId ? [{ targetSchoolIds: { has: schoolId } }] : []),
              ],
            },
          ],
          NOT: {
            reads: { some: { userId: session.userId } },
          },
        },
        select: { id: true },
      });

      if (unreadNotifications.length > 0) {
        await prisma.notificationRead.createMany({
          data: unreadNotifications.map((n) => ({
            notificationId: n.id,
            userId: session.userId!,
          })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' });
    }

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'ID notifikasi harus diisi' }, { status: 400 });
    }

    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId: session.userId,
        },
      },
      create: {
        notificationId,
        userId: session.userId,
      },
      update: {},
    });

    return NextResponse.json({ success: true, message: 'Notifikasi ditandai sudah dibaca' });
  } catch (error) {
    console.error('Error marking notification:', error);
    return NextResponse.json({ success: false, error: 'Gagal menandai notifikasi' }, { status: 500 });
  }
}
