import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getSchoolTierLimits, getSchoolCurrentUsage } from '@/lib/tier-limits';

// GET: Get current school's tier info and usage
export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const school = await prisma.school.findUnique({
      where: { id: session.schoolId },
      include: { tier: true },
    });

    if (!school) {
      return NextResponse.json({ success: false, error: 'Sekolah tidak ditemukan' }, { status: 404 });
    }

    const limits = await getSchoolTierLimits(session.schoolId);
    const usage = await getSchoolCurrentUsage(session.schoolId);

    return NextResponse.json({
      success: true,
      data: {
        tier: school.tier ? {
          nama: school.tier.nama,
          label: school.tier.label,
          harga: school.tier.harga,
        } : null,
        limits,
        usage,
        expiredAt: school.expiredAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tier info:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil info tier' }, { status: 500 });
  }
}
