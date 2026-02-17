import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: Get SMTP config
export async function GET() {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.smtpConfig.findFirst();

    // Mask password
    if (config) {
      return NextResponse.json({
        success: true,
        data: { ...config, pass: config.pass ? '••••••••' : '' },
      });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('Error fetching SMTP config:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil konfigurasi SMTP' }, { status: 500 });
  }
}

// POST: Create or update SMTP config
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { host, port, secure, user, pass, fromName, fromEmail, isActive } = body;

    if (!host || !user || !fromEmail) {
      return NextResponse.json({ success: false, error: 'Host, user, dan from email harus diisi' }, { status: 400 });
    }

    const existing = await prisma.smtpConfig.findFirst();

    if (existing) {
      const updateData: any = {
        host,
        port: port || 587,
        secure: secure || false,
        user,
        fromName: fromName || 'E-Learning Platform',
        fromEmail,
        isActive: isActive !== false,
      };
      // Only update password if provided (not masked)
      if (pass && pass !== '••••••••') {
        updateData.pass = pass;
      }

      const config = await prisma.smtpConfig.update({
        where: { id: existing.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        data: { ...config, pass: '••••••••' },
        message: 'Konfigurasi SMTP berhasil diupdate',
      });
    } else {
      if (!pass) {
        return NextResponse.json({ success: false, error: 'Password SMTP harus diisi' }, { status: 400 });
      }

      const config = await prisma.smtpConfig.create({
        data: {
          host,
          port: port || 587,
          secure: secure || false,
          user,
          pass,
          fromName: fromName || 'E-Learning Platform',
          fromEmail,
          isActive: isActive !== false,
        },
      });

      return NextResponse.json({
        success: true,
        data: { ...config, pass: '••••••••' },
        message: 'Konfigurasi SMTP berhasil disimpan',
      });
    }
  } catch (error) {
    console.error('Error saving SMTP config:', error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan konfigurasi SMTP' }, { status: 500 });
  }
}
