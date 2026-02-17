import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { to } = await request.json();
    if (!to) {
      return NextResponse.json({ success: false, error: 'Email tujuan harus diisi' }, { status: 400 });
    }

    await sendEmail({
      to,
      subject: 'Test Email - E-Learning Platform',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">✅ Test Email Berhasil!</h2>
          <p>Konfigurasi SMTP Anda sudah benar dan berfungsi dengan baik.</p>
          <p style="color: #6b7280; font-size: 14px;">Email ini dikirim dari E-Learning Platform Management Console.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Email test berhasil dikirim ke ${to}`,
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Gagal mengirim email test',
    }, { status: 500 });
  }
}
