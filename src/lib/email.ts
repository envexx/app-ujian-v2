import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export async function getSmtpTransporter() {
  const config = await prisma.smtpConfig.findFirst({
    where: { isActive: true },
  });

  if (!config) return null;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return { transporter, config };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const smtp = await getSmtpTransporter();
  if (!smtp) throw new Error('SMTP belum dikonfigurasi');

  const { transporter, config } = smtp;

  const result = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
  });

  return result;
}
