// Edge-compatible email service using Resend HTTP API

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email via Resend HTTP API (edge-compatible, no SMTP needed)
 */
export async function sendEmail(
  resendApiKey: string,
  options: SendEmailOptions
): Promise<boolean> {
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'E-Learning Platform <noreply@nilai.online>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend API error:', res.status, err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  resendApiKey: string,
  email: string,
  token: string,
  frontendUrl: string
): Promise<boolean> {
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin: 0;">E-Learning Platform</h1>
      </div>
      <div style="background: #f8f9fb; border-radius: 12px; padding: 30px;">
        <h2 style="color: #1f2937; margin-top: 0;">Reset Password</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          Anda menerima email ini karena ada permintaan reset password untuk akun Anda.
          Klik tombol di bawah untuk membuat password baru:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">
          Link ini berlaku selama 1 jam. Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Jika tombol tidak berfungsi, copy link berikut ke browser:<br/>
          <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail(resendApiKey, {
    to: email,
    subject: 'Reset Password - E-Learning Platform',
    html,
  });
}
