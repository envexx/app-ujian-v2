import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// POST: Generate admin account for a school
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: schoolId } = await params;
    const body = await request.json();
    const { email, password, nama } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Email ${email} sudah terdaftar di sistem` },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        schoolId,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolNama: school.nama,
        generatedPassword: password, // Return plain password once for admin to note
      },
      message: `Akun admin untuk ${school.nama} berhasil dibuat`,
    });
  } catch (error: any) {
    console.error('Error generating admin:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal membuat akun admin' }, { status: 500 });
  }
}
