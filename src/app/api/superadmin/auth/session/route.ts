import { NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await refreshSession();

    if (!session.isLoggedIn || !session.userId || session.role !== 'SUPERADMIN') {
      return NextResponse.json({
        success: false,
        isLoggedIn: false,
        data: null,
      });
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.userId },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json({
        success: false,
        isLoggedIn: false,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      data: {
        userId: superAdmin.id,
        email: superAdmin.email,
        nama: superAdmin.nama,
        role: 'SUPERADMIN',
      },
    });
  } catch (error) {
    console.error('SuperAdmin session error:', error);
    return NextResponse.json({
      success: false,
      isLoggedIn: false,
      data: null,
    });
  }
}
