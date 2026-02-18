import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

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

    return NextResponse.json({ success: true, data: media }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error fetching public landing media:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data media' }, { status: 500, headers: CORS_HEADERS });
  }
}
