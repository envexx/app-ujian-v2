import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password harus diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        siswa: true,
        guru: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun Anda tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if school is active (multi-tenancy)
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
    });

    if (!school || !school.isActive) {
      return NextResponse.json(
        { success: false, error: 'Sekolah Anda sedang tidak aktif. Hubungi administrator platform.' },
        { status: 403 }
      );
    }

    // Create session with schoolId
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });

    // Get profile data based on role
    let profileData = null;
    if (user.role === 'SISWA' && user.siswa) {
      profileData = {
        id: user.siswa.id,
        nama: user.siswa.nama,
        nis: user.siswa.nis,
        kelasId: user.siswa.kelasId,
        foto: user.siswa.foto,
      };
    } else if (user.role === 'GURU' && user.guru) {
      profileData = {
        id: user.guru.id,
        nama: user.guru.nama,
        nip: user.guru.nipUsername,
        foto: user.guru.foto,
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    );
  }
}
