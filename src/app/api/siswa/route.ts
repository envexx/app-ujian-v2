import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';
import * as bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelas');
    
    const siswa = await prisma.siswa.findMany({
      where: kelasId && kelasId !== 'all' ? { kelasId } : undefined,
      select: {
        id: true,
        nisn: true,
        nis: true,
        nama: true,
        email: true,
        kelasId: true,
        jenisKelamin: true,
        tanggalLahir: true,
        alamat: true,
        noTelp: true,
        namaWali: true,
        noTelpWali: true,
        foto: true,
        kelas: {
          select: {
            id: true,
            nama: true,
            tingkat: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: siswa,
    });
  } catch (error) {
    console.error('Error fetching siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch siswa' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nis, nisn, nama, kelasId, jenisKelamin, tanggalLahir, alamat, noTelp, namaWali, noTelpWali } = body;

    // Validate required fields
    if (!nis || !nisn || !nama || !kelasId || !jenisKelamin) {
      return NextResponse.json(
        { success: false, error: 'NIS, NISN, Nama, Kelas, dan Jenis Kelamin wajib diisi' },
        { status: 400 }
      );
    }

    // Check duplicate NIS
    const existingNis = await prisma.siswa.findUnique({ where: { nis } });
    if (existingNis) {
      return NextResponse.json(
        { success: false, error: `NIS "${nis}" sudah digunakan oleh siswa lain` },
        { status: 409 }
      );
    }

    // Check duplicate NISN
    const existingNisn = await prisma.siswa.findUnique({ where: { nisn } });
    if (existingNisn) {
      return NextResponse.json(
        { success: false, error: `NISN "${nisn}" sudah digunakan oleh siswa lain` },
        { status: 409 }
      );
    }

    // Auto-generate email for User record (login uses NIS/NISN, not email)
    const autoEmail = `${nis}@siswa.local`;

    // Check if auto-generated email already exists in users table
    const existingUser = await prisma.user.findUnique({ where: { email: autoEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `Akun dengan NIS "${nis}" sudah ada di sistem` },
        { status: 409 }
      );
    }

    // Hash password default (NISN)
    const hashedPassword = await bcrypt.hash(nisn, 10);

    // Convert tanggalLahir if provided
    let parsedTanggalLahir: Date | undefined;
    if (tanggalLahir) {
      if (typeof tanggalLahir === 'string' && tanggalLahir.match(/^\d{4}-\d{2}-\d{2}$/)) {
        parsedTanggalLahir = new Date(tanggalLahir + 'T00:00:00.000Z');
      } else {
        const d = new Date(tanggalLahir);
        if (!isNaN(d.getTime())) parsedTanggalLahir = d;
      }
    }

    // Build siswa data — only include optional fields if provided
    const siswaCreateData: any = {
      nis,
      nisn,
      nama,
      jenisKelamin,
      user: {
        create: {
          email: autoEmail,
          password: hashedPassword,
          role: 'SISWA',
          isActive: true,
        },
      },
      kelas: {
        connect: { id: kelasId },
      },
    };
    if (parsedTanggalLahir) siswaCreateData.tanggalLahir = parsedTanggalLahir;
    if (alamat) siswaCreateData.alamat = alamat;
    if (noTelp) siswaCreateData.noTelp = noTelp;
    if (namaWali) siswaCreateData.namaWali = namaWali;
    if (noTelpWali) siswaCreateData.noTelpWali = noTelpWali;

    // Create siswa with user account
    const newSiswa = await prisma.siswa.create({
      data: siswaCreateData,
      include: includes.siswaWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: newSiswa,
      message: `Siswa berhasil ditambahkan. Login: NISN/NIS, Password: ${nisn}`,
    });
  } catch (error: any) {
    console.error('Error creating siswa:', error);
    
    // Handle Prisma unique constraint errors with friendly messages
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { success: false, error: `Data dengan ${field} tersebut sudah ada` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Gagal menambahkan siswa' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Convert tanggalLahir from date string to DateTime if provided
    if (data.tanggalLahir) {
      if (typeof data.tanggalLahir === 'string') {
        // If it's just a date (YYYY-MM-DD), convert to DateTime
        if (data.tanggalLahir.match(/^\d{4}-\d{2}-\d{2}$/)) {
          data.tanggalLahir = new Date(data.tanggalLahir + 'T00:00:00.000Z');
        } else if (data.tanggalLahir) {
          // Try to parse as ISO string
          const parsedDate = new Date(data.tanggalLahir);
          if (!isNaN(parsedDate.getTime())) {
            data.tanggalLahir = parsedDate;
          }
        }
      }
      // If it's already a Date object, keep it as is
    }
    
    const updatedSiswa = await prisma.siswa.update({
      where: { id },
      data,
      include: includes.siswaWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedSiswa,
      message: 'Siswa berhasil diperbarui',
    });
  } catch (error: any) {
    console.error('Error updating siswa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || 'Failed to update siswa',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    await prisma.siswa.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Siswa berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete siswa' },
      { status: 500 }
    );
  }
}
