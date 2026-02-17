import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nisn } = body;

    if (!nisn) {
      return NextResponse.json(
        { success: false, error: 'NISN/NIS harus diisi' },
        { status: 400 }
      );
    }

    // Find siswa by NISN first, then try NIS
    let siswa = await prisma.siswa.findFirst({
      where: { nisn },
      include: {
        user: { include: { school: true } },
        kelas: true,
      },
    });

    if (!siswa) {
      siswa = await prisma.siswa.findFirst({
        where: { nis: nisn },
        include: {
          user: { include: { school: true } },
          kelas: true,
        },
      });
    }

    if (!siswa || !siswa.user) {
      return NextResponse.json(
        { success: false, error: 'NISN/NIS tidak ditemukan' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!siswa.user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Check if school is active
    if (!(siswa.user as any).school?.isActive) {
      return NextResponse.json(
        { success: false, error: 'Sekolah tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Create session using the same system as regular login
    await createSession({
      userId: siswa.user.id,
      email: siswa.user.email,
      role: siswa.user.role,
      schoolId: siswa.user.schoolId,
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        userId: siswa.user.id,
        email: siswa.user.email,
        role: siswa.user.role,
        profile: {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,
          nisn: siswa.nisn,
          kelasId: siswa.kelasId,
          kelas: siswa.kelas,
          jenisKelamin: siswa.jenisKelamin,
          foto: siswa.foto,
          email: siswa.email,
        },
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Siswa login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
