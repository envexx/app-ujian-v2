import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// POST: Toggle school active/inactive
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.school.update({
      where: { id },
      data: { isActive: !school.isActive },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: updated.isActive
        ? `Sekolah "${updated.nama}" berhasil diaktifkan`
        : `Sekolah "${updated.nama}" berhasil dinonaktifkan`,
    });
  } catch (error) {
    console.error('Error toggling school:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengubah status sekolah' }, { status: 500 });
  }
}
