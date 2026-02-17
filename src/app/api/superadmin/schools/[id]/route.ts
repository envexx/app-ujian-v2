import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: Get school detail with full stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        tier: true,
        _count: {
          select: {
            users: true,
            guru: true,
            siswa: true,
            ujian: true,
            tugas: true,
            kelas: true,
            mataPelajaran: true,
            materi: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    // Get admin users for this school
    const admins = await prisma.user.findMany({
      where: { schoolId: id, role: 'ADMIN' },
      select: { id: true, email: true, isActive: true, createdAt: true },
    });

    return NextResponse.json({
      success: true,
      data: { ...school, admins },
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data sekolah' }, { status: 500 });
  }
}

// PUT: Update school
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    const { nama, npsn, alamat, kota, provinsi, noTelp, email, website, jenjang, isActive, tierId, expiredAt } = body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(npsn !== undefined && { npsn: npsn || null }),
        ...(alamat !== undefined && { alamat }),
        ...(kota !== undefined && { kota }),
        ...(provinsi !== undefined && { provinsi }),
        ...(noTelp !== undefined && { noTelp }),
        ...(email !== undefined && { email: email || null }),
        ...(website !== undefined && { website }),
        ...(jenjang !== undefined && { jenjang }),
        ...(isActive !== undefined && { isActive }),
        ...(tierId !== undefined && { tierId }),
        ...(expiredAt !== undefined && { expiredAt: expiredAt ? new Date(expiredAt) : null }),
      },
    });

    return NextResponse.json({
      success: true,
      data: school,
      message: 'Sekolah berhasil diupdate',
    });
  } catch (error: any) {
    console.error('Error updating school:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Data duplikat: NPSN atau email sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengupdate sekolah' }, { status: 500 });
  }
}

// DELETE: Delete school (soft delete by deactivating)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.school.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    // Soft delete: deactivate instead of hard delete
    await prisma.school.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: `Sekolah "${existing.nama}" berhasil dinonaktifkan`,
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus sekolah' }, { status: 500 });
  }
}
