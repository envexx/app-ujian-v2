import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.schoolId) {
      return NextResponse.json({
        success: true,
        data: {
          nama: 'E-Learning System',
          logo: null,
          alamat: null,
          telepon: null,
          email: null,
        },
      });
    }
    
    // Get school info for the logged-in user's school
    const school = await prisma.sekolahInfo.findFirst({
      where: { schoolId: session.schoolId },
      select: {
        namaSekolah: true,
        logo: true,
        alamat: true,
        noTelp: true,
        email: true,
      },
    });

    console.log('School data found:', school);

    if (!school) {
      console.log('No school data found, returning default');
      return NextResponse.json({
        success: true,
        data: {
          nama: 'E-Learning System',
          logo: null,
          alamat: null,
          telepon: null,
          email: null,
        },
      });
    }

    const response = {
      success: true,
      data: {
        nama: school.namaSekolah,
        logo: school.logo,
        alamat: school.alamat,
        telepon: school.noTelp,
        email: school.email,
      },
    };

    console.log('Returning school data:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching school info:', error);
    return NextResponse.json(
      { 
        success: true, 
        error: 'Failed to fetch school info',
        data: {
          nama: 'E-Learning System',
          logo: null,
        },
      },
      { status: 200 }
    );
  }
}
