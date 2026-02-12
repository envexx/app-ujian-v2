import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { refreshSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // Use refreshSession to keep session alive when browsing ujian list (rolling session)
    const session = await refreshSession();

    if (!session.isLoggedIn || session.role !== 'SISWA') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get siswa data
    const siswa = await prisma.siswa.findFirst({
      where: { userId: session.userId },
      include: {
        kelas: true,
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa not found' },
        { status: 404 }
      );
    }

    // Check global access control
    const now = new Date();
    let accessControl = null;
    let isAccessActive = false;
    
    try {
      // @ts-ignore - Prisma client might not have loaded new model yet
      accessControl = await prisma.ujianAccessControl?.findFirst();
      
      // Check if access control is active and token is valid
      isAccessActive = !!(accessControl && 
                            accessControl.isActive && 
                            accessControl.tokenExpiresAt && 
                            accessControl.tokenExpiresAt > now);
    } catch (error) {
      // If ujianAccessControl table doesn't exist yet, allow access temporarily
      console.log('UjianAccessControl not available yet, allowing access');
      isAccessActive = true;
    }

    // Note: We don't return empty array here
    // Access control only affects starting NEW exams, not viewing completed ones

    // Get ujian for siswa's kelas
    // SECURITY: Use select to prevent sending jawabanBenar to client
    const ujian = await prisma.ujian.findMany({
      where: {
        kelas: {
          has: siswa.kelas.nama,
        },
        status: 'aktif', // Only show active exams
      },
      include: {
        mapel: true,
        soal: {
          select: {
            id: true,
            // SECURITY: Don't send data (contains answer keys) to prevent cheating
          },
        },
        submissions: {
          where: {
            siswaId: siswa.id,
          },
        },
      },
      orderBy: {
        startUjian: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ujian: ujian.map(u => {
          const submission = u.submissions[0];
          
          // Parse exam start and end time from database
          const examStartTime = new Date(u.startUjian);
          const examEndTime = new Date(u.endUjian);
          
          // Determine exam status
          let examStatus = 'belum_dimulai'; // not started yet
          let canStart = false;
          
          if (submission) {
            examStatus = 'selesai'; // already submitted
            canStart = false; // Already completed, no need to start again
          } else if (now < examStartTime) {
            examStatus = 'belum_dimulai'; // not started yet
            canStart = false;
          } else if (now >= examStartTime && now <= examEndTime) {
            examStatus = 'berlangsung'; // exam is ongoing
            // Ujian hanya bisa dimulai pada waktu yang ditentukan (tidak perlu access control)
            canStart = true;
          } else if (now > examEndTime) {
            examStatus = 'berakhir'; // exam time has passed
            canStart = false;
          }
          
          return {
            id: u.id,
            judul: u.judul,
            deskripsi: u.deskripsi,
            mapel: u.mapel.nama,
            startUjian: u.startUjian,
            endUjian: u.endUjian,
            totalSoal: u.soal.length,
            status: u.status,
            examStatus, // belum_dimulai, berlangsung, berakhir, selesai
            canStart, // boolean - can student start this exam now
            examStartTime,
            examEndTime,
            submission: submission ? {
              id: submission.id,
              submittedAt: submission.submittedAt,
              nilai: submission.nilai,
              status: 'sudah',
            } : null,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ujian' },
      { status: 500 }
    );
  }
}
