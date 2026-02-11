import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { includes } from '@/lib/query-helpers';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapelId = searchParams.get('mapel');
    
    const guru = await prisma.guru.findMany({
      where: mapelId && mapelId !== 'all' ? {
        mapel: {
          some: {
            mapelId,
          },
        },
      } : undefined,
      include: includes.guruWithRelations,
      orderBy: { nama: 'asc' },
    });
    
    return NextResponse.json({
      success: true,
      data: guru,
    });
  } catch (error) {
    console.error('Error fetching guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guru' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapelIds = [], kelasIds = [], ...guruData } = body;
    
    // Validate required fields
    if (!guruData.email || !guruData.nipUsername || !guruData.nama) {
      return NextResponse.json(
        { success: false, error: 'Email, NIP, dan Nama wajib diisi' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: guruData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan. Silakan gunakan email lain.' },
        { status: 400 }
      );
    }
    
    // Check if NIP already exists
    const existingGuru = await prisma.guru.findFirst({
      where: { nipUsername: guruData.nipUsername },
    });
    
    if (existingGuru) {
      return NextResponse.json(
        { success: false, error: 'NIP sudah digunakan. Silakan gunakan NIP lain.' },
        { status: 400 }
      );
    }
    
    // Hash default password
    const defaultPassword = 'guru123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Create User account first
    const user = await prisma.user.create({
      data: {
        email: guruData.email,
        password: hashedPassword, // Default password: guru123 (hashed)
        role: 'GURU',
        isActive: guruData.isActive !== undefined ? guruData.isActive : true,
      },
    });
    
    // Then create Guru with the userId
    const newGuru = await prisma.guru.create({
      data: {
        nipUsername: guruData.nipUsername,
        nama: guruData.nama,
        email: guruData.email,
        alamat: guruData.alamat,
        jenisKelamin: guruData.jenisKelamin || 'L',
        isActive: guruData.isActive !== undefined ? guruData.isActive : true,
        userId: user.id,
        mapel: {
          create: mapelIds.map((mapelId: string) => ({
            mapelId,
          })),
        },
        kelas: {
          create: kelasIds.map((kelasId: string) => ({
            kelasId,
          })),
        },
      },
      include: includes.guruWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: newGuru,
      message: 'Guru berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating guru:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      let message = 'Data sudah ada di sistem';
      
      if (field === 'email') {
        message = 'Email sudah digunakan. Silakan gunakan email lain.';
      } else if (field === 'nipUsername') {
        message = 'NIP sudah digunakan. Silakan gunakan NIP lain.';
      }
      
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menambahkan guru' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, mapelIds = [], kelasIds = [], ...data } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    
    // Delete existing mapel and kelas relations
    await prisma.guruMapel.deleteMany({
      where: { guruId: id },
    });
    
    await prisma.guruKelas.deleteMany({
      where: { guruId: id },
    });
    
    const updatedGuru = await prisma.guru.update({
      where: { id },
      data: {
        nipUsername: data.nipUsername,
        nama: data.nama,
        email: data.email,
        alamat: data.alamat,
        jenisKelamin: data.jenisKelamin,
        isActive: data.isActive,
        mapel: {
          create: mapelIds.map((mapelId: string) => ({
            mapelId,
          })),
        },
        kelas: {
          create: kelasIds.map((kelasId: string) => ({
            kelasId,
          })),
        },
      },
      include: includes.guruWithRelations,
    });
    
    return NextResponse.json({
      success: true,
      data: updatedGuru,
      message: 'Guru berhasil diperbarui',
    });
  } catch (error) {
    console.error('Error updating guru:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guru' },
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
    
    // Get guru to find userId
    const guru = await prisma.guru.findUnique({
      where: { id },
      select: { userId: true },
    });
    
    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Delete User (will cascade delete Guru automatically)
    await prisma.user.delete({
      where: { id: guru.userId },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Guru berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting guru:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus guru' },
      { status: 500 }
    );
  }
}
