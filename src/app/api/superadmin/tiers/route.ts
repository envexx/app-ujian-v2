import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') return null;
  return session;
}

// GET: List all tiers
export async function GET() {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const tiers = await prisma.tier.findMany({
      orderBy: { urutan: 'asc' },
      include: {
        _count: { select: { schools: true } },
      },
    });

    return NextResponse.json({ success: true, data: tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data tier' }, { status: 500 });
  }
}

// POST: Create new tier
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, label, harga, maxSiswa, maxGuru, maxKelas, maxMapel, maxUjian, maxStorage, fipitur, urutan } = body;

    if (!nama || !label) {
      return NextResponse.json({ success: false, error: 'Nama dan label harus diisi' }, { status: 400 });
    }

    const tier = await prisma.tier.create({
      data: {
        nama,
        label,
        harga: harga || 0,
        maxSiswa: maxSiswa || 50,
        maxGuru: maxGuru || 5,
        maxKelas: maxKelas || 5,
        maxMapel: maxMapel || 10,
        maxUjian: maxUjian || 10,
        maxStorage: maxStorage || 500,
        fipitur: fipitur || {},
        urutan: urutan || 0,
      },
    });

    return NextResponse.json({ success: true, data: tier, message: 'Tier berhasil dibuat' });
  } catch (error: any) {
    console.error('Error creating tier:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Nama tier sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal membuat tier' }, { status: 500 });
  }
}

// PUT: Update tier
export async function PUT(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID tier harus diisi' }, { status: 400 });
    }

    const tier = await prisma.tier.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: tier, message: 'Tier berhasil diupdate' });
  } catch (error: any) {
    console.error('Error updating tier:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Nama tier sudah ada' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal mengupdate tier' }, { status: 500 });
  }
}
