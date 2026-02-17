import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const kelasId = searchParams.get('kelasId');
    const mapelId = searchParams.get('mapelId');

    // Get guru data
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
      include: {
        mapel: {
          include: {
            mapel: true,
          },
        },
      },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Get kelas list that this guru teaches
    const kelasList = await prisma.kelas.findMany({
      where: {
        guru: {
          some: {
            guruId: guru.id,
          },
        },
      },
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        nama: 'asc',
      },
    });

    // Get mapel list for this guru
    const mapelList = guru.mapel.map((gm) => ({
      id: gm.mapel.id,
      nama: gm.mapel.nama,
    }));

    // If no filters, return empty nilai with lists
    if (!kelasId || !mapelId) {
      return NextResponse.json({
        success: true,
        data: {
          nilai: [],
          kelasList,
          mapelList,
        },
      });
    }

    // Get siswa in selected kelas (same school)
    const siswa = await prisma.siswa.findMany({
      where: {
        schoolId: guru.schoolId,
        kelasId: kelasId,
      },
      include: {
        tugasSubmission: {
          include: {
            tugas: {
              select: {
                mapelId: true,
              },
            },
          },
        },
        ujianSubmission: {
          include: {
            ujian: {
              select: {
                mapelId: true,
                judul: true,
              },
            },
          },
        },
      },
      orderBy: {
        nama: 'asc',
      },
    });

    // Format data and calculate averages from submissions
    const nilaiData = siswa.map((s: any) => {
      const nilai = s.nilai[0] || null;
      
      // Calculate average tugas for this mapel
      const tugasForMapel = s.tugasSubmission.filter(
        (ts: any) => ts.tugas.mapelId === mapelId && ts.nilai !== null
      );
      
      const avgTugas = tugasForMapel.length > 0
        ? Math.round(
            tugasForMapel.reduce((sum: number, ts: any) => sum + (ts.nilai || 0), 0) / tugasForMapel.length
          )
        : null;

      // Get ujian scores for this mapel (calculate average of all ujian)
      const ujianForMapel = s.ujianSubmission.filter(
        (us: any) => us.ujian.mapelId === mapelId && us.nilai !== null
      );
      
      // For now, we'll use the average of all ujian as both UTS and UAS
      // In the future, you can differentiate by checking ujian.judul contains "UTS" or "UAS"
      const avgUjian = ujianForMapel.length > 0
        ? Math.round(
            ujianForMapel.reduce((sum: number, us: any) => sum + (us.nilai || 0), 0) / ujianForMapel.length
          )
        : null;

      // Calculate final grade if all components exist
      let nilaiAkhir = null;
      if (avgTugas !== null && avgUjian !== null) {
        // Tugas 30%, Ujian 70% (since we don't differentiate UTS/UAS yet)
        nilaiAkhir = Math.round(avgTugas * 0.3 + avgUjian * 0.7);
      }

      return {
        id: nilai?.id || null,
        siswaId: s.id,
        nisn: s.nisn,
        nama: s.nama,
        kelas: kelasId,
        tugas: avgTugas,
        uts: avgUjian, // Using average ujian for now
        uas: avgUjian, // Using average ujian for now
        nilaiAkhir: nilaiAkhir,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        nilai: nilaiData,
        kelasList,
        mapelList,
      },
    });
  } catch (error) {
    console.error('Error fetching nilai:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nilai' },
      { status: 500 }
    );
  }
}

// TODO: Implement Nilai model in Prisma schema before enabling this endpoint
// export async function POST(request: Request) {
//   try {
//     const session = await getSession();

//     if (!session.isLoggedIn || session.role !== 'GURU') {
//       return NextResponse.json(
//         { success: false, error: 'Unauthorized' },
//         { status: 401 }
//       );
//     }

//     const body = await request.json();
//     const { siswaId, mapelId, tugas, uts, uas, nilaiAkhir, semester, tahunAjaran } = body;

//     // Get guru data
//     const guru = await prisma.guru.findFirst({
//       where: { userId: session.userId },
//     });

//     if (!guru) {
//       return NextResponse.json(
//         { success: false, error: 'Guru not found' },
//         { status: 404 }
//       );
//     }

//     // Upsert nilai
//     const nilai = await prisma.nilai.upsert({
//       where: {
//         siswaId_mapelId_semester_tahunAjaran: {
//           siswaId,
//           mapelId,
//           semester: semester || 'Ganjil',
//           tahunAjaran: tahunAjaran || '2024/2025',
//         },
//       },
//       update: {
//         tugas,
//         uts,
//         uas,
//         nilaiAkhir,
//       },
//       create: {
//         siswaId,
//         mapelId,
//         guruId: guru.id,
//         tugas,
//         uts,
//         uas,
//         nilaiAkhir,
//         semester: semester || 'Ganjil',
//         tahunAjaran: tahunAjaran || '2024/2025',
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       data: nilai,
//       message: 'Nilai berhasil disimpan',
//     });
//   } catch (error) {
//     console.error('Error saving nilai:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to save nilai' },
//       { status: 500 }
//     );
//   }
// }
