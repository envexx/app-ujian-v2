import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { TipeSoal, SoalData } from '@/types/soal';

// GET - Get all soal for an ujian
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ujianId } = await params;

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Verify ujian belongs to this guru
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id,
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get all soal for this ujian
    const soal = await prisma.soal.findMany({
      where: { ujianId },
      orderBy: { urutan: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: soal,
    });
  } catch (error) {
    console.error('Error fetching soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch soal' },
      { status: 500 }
    );
  }
}

// POST - Create new soal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ujianId } = await params;
    const body = await request.json();
    const { tipe, pertanyaan, poin, data } = body as {
      tipe: TipeSoal;
      pertanyaan: string;
      poin: number;
      data: SoalData;
    };

    // Validate required fields (pertanyaan can be empty for new soal)
    if (!tipe || poin === undefined || !data) {
      console.error('Validation failed:', { tipe, pertanyaan, poin, data, body });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: { tipe: !!tipe, poin: poin !== undefined, data: !!data }
        },
        { status: 400 }
      );
    }

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Verify ujian belongs to this guru
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id,
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get next urutan number
    const lastSoal = await prisma.soal.findFirst({
      where: { ujianId },
      orderBy: { urutan: 'desc' },
    });

    const urutan = lastSoal ? lastSoal.urutan + 1 : 1;

    // Create soal
    const newSoal = await prisma.soal.create({
      data: {
        ujianId,
        tipe,
        urutan,
        pertanyaan,
        poin,
        data: data as any, // Prisma Json type
      },
    });

    return NextResponse.json({
      success: true,
      data: newSoal,
      message: 'Soal berhasil ditambahkan',
    });
  } catch (error) {
    console.error('Error creating soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create soal' },
      { status: 500 }
    );
  }
}

// PUT - Reorder soal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ujianId } = await params;
    const body = await request.json();
    const { soalIds } = body as { soalIds: string[] };

    if (!Array.isArray(soalIds) || soalIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid soalIds array' },
        { status: 400 }
      );
    }

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Verify ujian belongs to this guru
    const ujian = await prisma.ujian.findFirst({
      where: {
        id: ujianId,
        guruId: guru.id,
      },
    });

    if (!ujian) {
      return NextResponse.json(
        { success: false, error: 'Ujian not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update urutan for each soal
    const updatePromises = soalIds.map((soalId, index) =>
      prisma.soal.update({
        where: { id: soalId },
        data: { urutan: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Urutan soal berhasil diupdate',
    });
  } catch (error) {
    console.error('Error reordering soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder soal' },
      { status: 500 }
    );
  }
}
