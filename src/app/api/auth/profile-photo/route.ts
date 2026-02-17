import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File foto harus diupload' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file maksimal 2MB' },
        { status: 400 }
      );
    }

    // Create unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileName = `profile_${session.userId}_${timestamp}_${randomStr}.${ext}`;

    // Save file
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(uploadDir, fileName), buffer);

    const photoUrl = `/uploads/profiles/${fileName}`;

    // Update profilePhoto on User model
    await prisma.user.update({
      where: { id: session.userId },
      data: { profilePhoto: photoUrl },
    });

    // Also update foto on role-specific model
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (user?.role === 'GURU') {
      await prisma.guru.updateMany({
        where: { userId: session.userId },
        data: { foto: photoUrl },
      });
    } else if (user?.role === 'SISWA') {
      await prisma.siswa.updateMany({
        where: { userId: session.userId },
        data: { foto: photoUrl },
      });
    }

    return NextResponse.json({
      success: true,
      data: { url: photoUrl },
      message: 'Foto profil berhasil diupload',
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupload foto profil' },
      { status: 500 }
    );
  }
}
