import { Hono } from 'hono';
import { sql } from '../lib/db';
import { authMiddleware, tenantMiddleware } from '../middleware/auth';

const notifications = new Hono();

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

export default notifications;
