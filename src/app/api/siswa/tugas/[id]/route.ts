import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    const tugas = await prisma.tugas.findFirst({
      where: { id, schoolId: siswa.schoolId },
      include: {
        mapel: true,
        submissions: {
          where: {
            siswaId: siswa.id,
          },
        },
      },
    });

    if (!tugas) {
      return NextResponse.json(
        { success: false, error: 'Tugas not found' },
        { status: 404 }
      );
    }

    const submission = tugas.submissions[0];

    return NextResponse.json({
      success: true,
      data: {
        tugas: {
          id: tugas.id,
          judul: tugas.judul,
          deskripsi: tugas.deskripsi,
          instruksi: tugas.instruksi,
          mapel: tugas.mapel.nama,
          deadline: tugas.deadline,
          fileUrl: tugas.fileUrl,
          status: tugas.status,
        },
        submission: submission ? {
          id: submission.id,
          fileUrl: submission.fileUrl,
          fileUpload: submission.fileUpload,
          catatan: submission.catatan,
          submittedAt: submission.submittedAt,
          nilai: submission.nilai,
          feedback: submission.feedback,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching tugas detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tugas detail' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fileUrl, fileUpload, catatan } = body;

    // Validate: at least one file method must be provided (and not empty)
    const hasFileUrl = fileUrl && fileUrl.trim().length > 0;
    const hasFileUpload = fileUpload && fileUpload.trim().length > 0;
    
    if (!hasFileUrl && !hasFileUpload) {
      return NextResponse.json(
        { success: false, error: 'Harap isi URL file atau upload file' },
        { status: 400 }
      );
    }

    // Check if tugas exists (same school)
    const tugas = await prisma.tugas.findFirst({
      where: { id, schoolId: siswa.schoolId },
    });

    if (!tugas) {
      return NextResponse.json(
        { success: false, error: 'Tugas not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.tugasSubmission.findFirst({
      where: {
        tugasId: id,
        siswaId: siswa.id,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'Tugas sudah dikerjakan' },
        { status: 400 }
      );
    }

    // Create submission
    const submission = await prisma.tugasSubmission.create({
      data: {
        tugas: {
          connect: { id },
        },
        siswa: {
          connect: { id: siswa.id },
        },
        fileUrl: fileUrl || null,
        fileUpload: fileUpload || null,
        catatan: catatan || null,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Tugas berhasil dikumpulkan',
    });
  } catch (error) {
    console.error('Error submitting tugas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit tugas' },
      { status: 500 }
    );
  }
}
