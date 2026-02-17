import { NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Use refreshSession to automatically refresh the session on each check (rolling session)
    const session = await refreshSession();

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({
        success: false,
        isLoggedIn: false,
        data: null,
      });
    }

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        siswa: {
          include: {
            kelas: true,
          },
        },
        guru: {
          include: {
            mapel: {
              include: {
                mapel: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        isLoggedIn: false,
        data: null,
      });
    }

    // Build profile data based on role
    let profileData = null;
    if (user.role === 'SISWA' && user.siswa) {
      profileData = {
        id: user.siswa.id,
        nama: user.siswa.nama,
        nis: user.siswa.nis,
        nisn: user.siswa.nisn,
        kelasId: user.siswa.kelasId,
        kelas: user.siswa.kelas,
        jenisKelamin: user.siswa.jenisKelamin,
        foto: user.siswa.foto,
        email: user.siswa.email,
      };
    } else if (user.role === 'GURU' && user.guru) {
      profileData = {
        id: user.guru.id,
        nama: user.guru.nama,
        nip: user.guru.nipUsername,
        email: user.guru.email,
        foto: user.guru.foto,
        mapel: user.guru.mapel.map((gm) => ({
          id: gm.mapel.id,
          nama: gm.mapel.nama,
          kode: gm.mapel.kode,
        })),
      };
    } else if (user.role === 'ADMIN') {
      profileData = {
        email: user.email,
        role: 'ADMIN',
        foto: user.profilePhoto,
      };
    }

    return NextResponse.json({
      success: true,
      isLoggedIn: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({
      success: false,
      isLoggedIn: false,
      data: null,
    });
  }
}
