import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import type { TipeSoal, SoalData } from '@/types/soal';

// PUT - Update soal
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; soalId: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ujianId, soalId } = await params;
    const body = await request.json();
    const { tipe, pertanyaan, poin, data } = body as {
      tipe?: TipeSoal;
      pertanyaan?: string;
      poin?: number;
      data?: SoalData;
    };

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

    // Verify soal belongs to this ujian
    const existingSoal = await prisma.soal.findFirst({
      where: {
        id: soalId,
        ujianId,
      },
    });

    if (!existingSoal) {
      return NextResponse.json(
        { success: false, error: 'Soal not found' },
        { status: 404 }
      );
    }

    // Update soal
    const updatedSoal = await prisma.soal.update({
      where: { id: soalId },
      data: {
        ...(tipe && { tipe }),
        ...(pertanyaan && { pertanyaan }),
        ...(poin !== undefined && { poin }),
        ...(data && { data: data as any }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSoal,
      message: 'Soal berhasil diupdate',
    });
  } catch (error) {
    console.error('Error updating soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update soal' },
      { status: 500 }
    );
  }
}

// DELETE - Delete soal
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; soalId: string }> }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: ujianId, soalId } = await params;

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

    // Verify soal belongs to this ujian
    const existingSoal = await prisma.soal.findFirst({
      where: {
        id: soalId,
        ujianId,
      },
    });

    if (!existingSoal) {
      return NextResponse.json(
        { success: false, error: 'Soal not found' },
        { status: 404 }
      );
    }

    // Delete soal
    await prisma.soal.delete({
      where: { id: soalId },
    });

    // Reorder remaining soal
    const remainingSoal = await prisma.soal.findMany({
      where: { ujianId },
      orderBy: { urutan: 'asc' },
    });

    const updatePromises = remainingSoal.map((soal, index) =>
      prisma.soal.update({
        where: { id: soal.id },
        data: { urutan: index + 1 },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Soal berhasil dihapus',
    });
  } catch (error) {
    console.error('Error deleting soal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete soal' },
      { status: 500 }
    );
  }
}
