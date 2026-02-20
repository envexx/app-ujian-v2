import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { sql } from '../lib/db';
import { authMiddleware, tenantMiddleware } from '../middleware/auth';

const notifications = new Hono<HonoEnv>();

notifications.use('*', authMiddleware, tenantMiddleware);

// GET /notifications - Get notifications for user
notifications.get('/', async (c) => {
  try {
    const user = c.get('user');
    const notificationList = await sql`
      SELECT * FROM notification
      WHERE ("userId" = ${user.userId} OR ("schoolId" = ${user.schoolId} AND "userId" IS NULL))
      ORDER BY "createdAt" DESC LIMIT 20
    `;
    const unreadResult = await sql`
      SELECT COUNT(*) as count FROM notification
      WHERE ("userId" = ${user.userId} OR ("schoolId" = ${user.schoolId} AND "userId" IS NULL))
        AND "isRead" = false
    `;
    return c.json({
      success: true,
      data: notificationList,
      unreadCount: parseInt(unreadResult[0]?.count || '0'),
    });
  } catch (error: any) {
    // If table doesn't exist, return empty data
    if (error?.code === '42P01') {
      return c.json({ success: true, data: [], unreadCount: 0 });
    }
    console.error('Error fetching notifications:', error);
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
  }
});

// POST /notifications - Mark notification as read
notifications.post('/', async (c) => {
  try {
    const user = c.get('user');
    const { notificationId, markAll } = await c.req.json();
    if (markAll) {
      await sql`
        UPDATE notifications SET "isRead" = true
        WHERE ("userId" = ${user.userId} OR ("schoolId" = ${user.schoolId} AND "userId" IS NULL))
      `;
    } else if (notificationId) {
      await sql`UPDATE notifications SET "isRead" = true WHERE id = ${notificationId}`;
    }
    return c.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification:', error);
    return c.json({ success: false, error: 'Failed to mark notification' }, 500);
  }
});

// GET /notifications/platform - Get platform notifications for current user's role
notifications.get('/platform', async (c) => {
  try {
    const user = c.get('user');
    const role = user.role;
    const schoolId = user.schoolId;

    // Get published, non-expired platform notifications targeting this user's role/school
    const platformNotifs = await sql`
      SELECT pn.id, pn.judul, pn.pesan, pn.tipe, pn.priority, pn."publishedAt", pn."expiresAt",
        CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as "isRead"
      FROM platform_notifications pn
      LEFT JOIN notification_reads nr ON nr."notificationId" = pn.id AND nr."userId" = ${user.userId}
      WHERE pn."isPublished" = true
        AND (pn."expiresAt" IS NULL OR pn."expiresAt" > NOW())
        AND ('ALL' = ANY(pn."targetRole") OR ${role} = ANY(pn."targetRole"))
        AND (array_length(pn."targetSchoolIds", 1) IS NULL OR ${schoolId} = ANY(pn."targetSchoolIds"))
      ORDER BY pn."publishedAt" DESC
      LIMIT 20
    `;

    const unreadCount = platformNotifs.filter((n: any) => !n.isRead).length;

    return c.json({
      success: true,
      data: platformNotifs,
      unreadCount,
    });
  } catch (error: any) {
    if (error?.code === '42P01') {
      return c.json({ success: true, data: [], unreadCount: 0 });
    }
    console.error('Error fetching platform notifications:', error);
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
  }
});

// POST /notifications/platform/read - Mark platform notification as read
notifications.post('/platform/read', async (c) => {
  try {
    const user = c.get('user');
    const { notificationId } = await c.req.json();

    if (!notificationId) {
      return c.json({ success: false, error: 'notificationId required' }, 400);
    }

    await sql`
      INSERT INTO notification_reads ("notificationId", "userId", "readAt")
      VALUES (${notificationId}, ${user.userId}, NOW())
      ON CONFLICT ("notificationId", "userId") DO NOTHING
    `;

    return c.json({ success: true });
  } catch (error) {
    console.error('Error marking platform notification as read:', error);
    return c.json({ success: false, error: 'Failed to mark as read' }, 500);
  }
});

export default notifications;
