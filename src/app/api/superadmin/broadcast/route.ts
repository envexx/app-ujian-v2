import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: List broadcast emails
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

    const [broadcasts, total] = await Promise.all([
      prisma.broadcastEmail.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.broadcastEmail.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: broadcasts,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data broadcast' }, { status: 500 });
  }
}

// POST: Create and optionally send broadcast email
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, bodyHtml, targetType, targetFilter, sendNow } = body;

    if (!subject || !bodyHtml) {
      return NextResponse.json({ success: false, error: 'Subject dan body harus diisi' }, { status: 400 });
    }

    const broadcast = await prisma.broadcastEmail.create({
      data: {
        subject,
        body: bodyHtml,
        targetType: targetType || 'all_schools',
        targetFilter: targetFilter || null,
        status: sendNow ? 'sending' : 'draft',
        createdBy: session.userId!,
      },
    });

    if (sendNow) {
      // Get target emails
      let schoolWhere: any = { isActive: true };
      if (targetType === 'specific_schools' && targetFilter?.schoolIds?.length) {
        schoolWhere.id = { in: targetFilter.schoolIds };
      } else if (targetType === 'by_tier' && targetFilter?.tierIds?.length) {
        schoolWhere.tierId = { in: targetFilter.tierIds };
      }

      const schools = await prisma.school.findMany({
        where: schoolWhere,
        select: { email: true, nama: true },
      });

      const emails = schools.filter((s: any) => s.email).map((s: any) => s.email);
      let sentCount = 0;
      let failedCount = 0;

      // Send in batches of 10
      for (let i = 0; i < emails.length; i += 10) {
        const batch = emails.slice(i, i + 10);
        try {
          await sendEmail({ to: batch, subject, html: bodyHtml });
          sentCount += batch.length;
        } catch {
          failedCount += batch.length;
        }
      }

      await prisma.broadcastEmail.update({
        where: { id: broadcast.id },
        data: {
          status: failedCount === emails.length ? 'failed' : 'sent',
          sentCount,
          failedCount,
          sentAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: { ...broadcast, sentCount, failedCount },
        message: `Email broadcast terkirim ke ${sentCount} sekolah${failedCount > 0 ? `, ${failedCount} gagal` : ''}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: broadcast,
      message: 'Broadcast email disimpan sebagai draft',
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat broadcast email' }, { status: 500 });
  }
}
