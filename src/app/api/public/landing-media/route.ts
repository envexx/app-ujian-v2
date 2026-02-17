import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Public endpoint - fetch active landing media (no auth required)
export async function GET() {
  try {
    const media = await prisma.landingMedia.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
      select: {
        id: true,
        tipe: true,
        judul: true,
        url: true,
        aspectRatio: true,
        urutan: true,
      },
    });

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('Error fetching public landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data media' }, { status: 500 });
  }
}
