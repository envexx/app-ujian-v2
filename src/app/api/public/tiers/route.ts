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

// GET: Public endpoint - fetch active tiers for landing page (no auth required)
export async function GET() {
  try {
    const tiers = await prisma.tier.findMany({
      where: { isActive: true },
      orderBy: { urutan: 'asc' },
      select: {
        id: true,
        nama: true,
        label: true,
        harga: true,
        maxSiswa: true,
        maxGuru: true,
        maxKelas: true,
        maxMapel: true,
        maxUjian: true,
        maxStorage: true,
        fipitur: true,
        urutan: true,
      },
    });

    return NextResponse.json({ success: true, data: tiers }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error('Error fetching public tiers:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data paket' }, { status: 500, headers: CORS_HEADERS });
  }
}
