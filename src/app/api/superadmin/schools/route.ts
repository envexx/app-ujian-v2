import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// Helper: verify superadmin session
async function verifySuperAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== 'SUPERADMIN') {
    return null;
  }
  return session;
}

// GET: List all schools with stats
export async function GET(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // active, inactive, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { npsn: { contains: search, mode: 'insensitive' } },
        { kota: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        include: {
          tier: { select: { id: true, nama: true, label: true, harga: true, maxSiswa: true, maxGuru: true } },
          _count: {
            select: {
              users: true,
              guru: true,
              siswa: true,
              ujian: true,
              kelas: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.school.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: schools,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data sekolah' }, { status: 500 });
  }
}

// POST: Create new school
export async function POST(request: Request) {
  try {
    const session = await verifySuperAdmin();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nama, npsn, alamat, kota, provinsi, noTelp, email, website, jenjang, tierId } = body;

    if (!nama) {
      return NextResponse.json({ success: false, error: 'Nama sekolah harus diisi' }, { status: 400 });
    }

    // Check duplicate NPSN
    if (npsn) {
      const existing = await prisma.school.findUnique({ where: { npsn } });
      if (existing) {
        return NextResponse.json({ success: false, error: `NPSN ${npsn} sudah terdaftar` }, { status: 400 });
      }
    }

    // Default to trial tier if none specified
    let assignTierId = tierId;
    if (!assignTierId) {
      const trialTier = await prisma.tier.findUnique({ where: { nama: 'trial' } });
      assignTierId = trialTier?.id || null;
    }

    const school = await prisma.school.create({
      data: {
        nama,
        npsn: npsn || null,
        alamat: alamat || null,
        kota: kota || null,
        provinsi: provinsi || null,
        noTelp: noTelp || null,
        email: email || null,
        website: website || null,
        jenjang: jenjang || null,
        tierId: assignTierId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: school,
      message: 'Sekolah berhasil dibuat',
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Data duplikat: NPSN atau email sudah terdaftar' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Gagal membuat sekolah' }, { status: 500 });
  }
}
