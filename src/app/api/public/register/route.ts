import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// POST: Public endpoint - register a new school with free (trial) tier
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      namaSekolah,
      npsn,
      alamat,
      kota,
      provinsi,
      jenjang,
      noTelp,
      emailSekolah,
      namaAdmin,
      emailAdmin,
      passwordAdmin,
    } = body;

    // ========== VALIDATION ==========
    if (!namaSekolah || !namaAdmin || !emailAdmin || !passwordAdmin) {
      return NextResponse.json(
        { success: false, error: 'Nama sekolah, nama admin, email admin, dan password wajib diisi' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (passwordAdmin.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAdmin)) {
      return NextResponse.json(
        { success: false, error: 'Format email admin tidak valid' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // ========== CHECK DUPLICATES ==========

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailAdmin },
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email admin sudah terdaftar. Gunakan email lain atau login ke akun yang sudah ada.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }

    // Check if school email already exists (if provided)
    if (emailSekolah) {
      const existingSchool = await prisma.school.findUnique({
        where: { email: emailSekolah },
      });
      if (existingSchool) {
        return NextResponse.json(
          { success: false, error: 'Email sekolah sudah terdaftar. Jika ini sekolah Anda, hubungi administrator.' },
          { status: 409, headers: CORS_HEADERS }
        );
      }
    }

    // Check if NPSN already exists (if provided)
    if (npsn) {
      const existingNpsn = await prisma.school.findUnique({
        where: { npsn },
      });
      if (existingNpsn) {
        return NextResponse.json(
          { success: false, error: 'NPSN sudah terdaftar. Jika ini sekolah Anda, hubungi administrator.' },
          { status: 409, headers: CORS_HEADERS }
        );
      }
    }

    // ========== GET FREE TIER ==========

    // Find the free/trial tier (lowest urutan or nama = 'trial')
    let freeTier = await prisma.tier.findFirst({
      where: { nama: 'trial', isActive: true },
    });

    // Fallback: find the cheapest active tier
    if (!freeTier) {
      freeTier = await prisma.tier.findFirst({
        where: { isActive: true, harga: 0 },
        orderBy: { urutan: 'asc' },
      });
    }

    // Fallback: find any active tier with lowest order
    if (!freeTier) {
      freeTier = await prisma.tier.findFirst({
        where: { isActive: true },
        orderBy: { urutan: 'asc' },
      });
    }

    if (!freeTier) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada paket yang tersedia saat ini. Hubungi administrator.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // ========== CREATE SCHOOL + ADMIN IN TRANSACTION ==========

    const hashedPassword = await bcrypt.hash(passwordAdmin, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create school
      const school = await tx.school.create({
        data: {
          nama: namaSekolah,
          npsn: npsn || null,
          alamat: alamat || null,
          kota: kota || null,
          provinsi: provinsi || null,
          jenjang: jenjang || null,
          noTelp: noTelp || null,
          email: emailSekolah || null,
          isActive: true,
          tierId: freeTier!.id,
        },
      });

      // 2. Create admin user
      const adminUser = await tx.user.create({
        data: {
          schoolId: school.id,
          email: emailAdmin,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // 3. Create default SekolahInfo
      await tx.sekolahInfo.create({
        data: {
          schoolId: school.id,
          namaSekolah: namaSekolah,
          alamat: alamat || '-',
          noTelp: noTelp || '-',
          email: emailSekolah || emailAdmin,
          namaKepsek: namaAdmin,
          nipKepsek: '-',
          tahunAjaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          semester: 'Ganjil',
        },
      });

      return { school, adminUser };
    });

    return NextResponse.json(
      {
        success: true,
        message: `Sekolah "${namaSekolah}" berhasil didaftarkan dengan paket ${freeTier.label}!`,
        data: {
          schoolId: result.school.id,
          schoolName: result.school.nama,
          adminEmail: result.adminUser.email,
          tier: {
            nama: freeTier.nama,
            label: freeTier.label,
            maxSiswa: freeTier.maxSiswa,
            maxGuru: freeTier.maxGuru,
            maxKelas: freeTier.maxKelas,
            maxMapel: freeTier.maxMapel,
            maxUjian: freeTier.maxUjian,
          },
        },
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Error registering school:', error);

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, error: 'Email sudah terdaftar.' },
          { status: 409, headers: CORS_HEADERS }
        );
      }
      if (target?.includes('npsn')) {
        return NextResponse.json(
          { success: false, error: 'NPSN sudah terdaftar.' },
          { status: 409, headers: CORS_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mendaftarkan sekolah. Silakan coba lagi.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
