import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentDateIndonesia, getStartOfDayIndonesia, formatIndonesiaDate } from '@/lib/date-utils';

// Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
function getHariIndonesia(): string {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = new Date();
  return hari[today.getDay()];
}

// Fungsi untuk menentukan apakah jam masuk atau jam pulang
async function getTipePresensi(schoolId: string): Promise<'masuk' | 'pulang'> {
  const hari = getHariIndonesia();
  const sekarang = getCurrentDateIndonesia();
  const jamSekarang = sekarang.getHours();
  const menitSekarang = sekarang.getMinutes();
  const waktuSekarang = `${String(jamSekarang).padStart(2, '0')}:${String(menitSekarang).padStart(2, '0')}`;

  // Ambil info masuk untuk hari ini (scoped to school)
  const infoMasuk = await prisma.infoMasuk.findFirst({
    where: { schoolId, hari },
  });

  if (!infoMasuk) {
    // Default: jika tidak ada info, anggap jam masuk sebelum 12:00
    return jamSekarang < 12 ? 'masuk' : 'pulang';
  }

  // Parse jam masuk dan jam pulang
  const [jamMasukHour, jamMasukMin] = infoMasuk.jamMasuk.split(':').map(Number);
  const [jamPulangHour, jamPulangMin] = infoMasuk.jamPulang.split(':').map(Number);

  const waktuMasuk = jamMasukHour * 60 + jamMasukMin;
  const waktuPulang = jamPulangHour * 60 + jamPulangMin;
  const waktuSekarangMinutes = jamSekarang * 60 + menitSekarang;

  // Jika waktu sekarang lebih dekat ke jam pulang, berarti pulang
  // Ambil tengah-tengah antara jam masuk dan jam pulang sebagai batas
  const tengahHari = (waktuMasuk + waktuPulang) / 2;

  return waktuSekarangMinutes < tengahHari ? 'masuk' : 'pulang';
}

// Fungsi untuk membuat pesan WhatsApp
function createWhatsAppMessage(siswa: any, tipe: 'masuk' | 'pulang', waktu: string): string {
  if (tipe === 'masuk') {
    return `Assalamu'alaikum Bapak/Ibu Wali ${siswa.namaWali || 'Orang Tua'},

Ananda *${siswa.nama}* (${siswa.kelas.nama}) sudah absensi masuk pada pukul ${waktu}.

Terima kasih.`;
  } else {
    return `Assalamu'alaikum Bapak/Ibu Wali ${siswa.namaWali || 'Orang Tua'},

Ananda *${siswa.nama}* (${siswa.kelas.nama}) sudah pulang pada pukul ${waktu}.

Terima kasih.`;
  }
}

export async function POST(request: Request) {
  try {
    const { nisn, type = 'hadir' } = await request.json();
    
    if (!nisn) {
      return NextResponse.json(
        { success: false, error: 'NISN diperlukan' },
        { status: 400 }
      );
    }

    // Find siswa by NISN dengan data lengkap termasuk nomor ortu
    const siswa = await prisma.siswa.findFirst({
      where: { nisn },
      select: {
        id: true,
        schoolId: true,
        nisn: true,
        nama: true,
        kelasId: true,
        namaWali: true,
        noTelpWali: true,
        kelas: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    if (!siswa) {
      return NextResponse.json(
        { success: false, error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // Tentukan tipe presensi (masuk atau pulang)
    const tipe = await getTipePresensi(siswa.schoolId);

    // Use Indonesian timezone for accurate date checking
    const todayIndonesia = getStartOfDayIndonesia();

    // Check if already checked in today dengan tipe yang sama
    const existingPresensi = await prisma.presensi.findFirst({
      where: {
        siswaId: siswa.id,
        tanggal: {
          gte: todayIndonesia,
        },
        tipe: tipe,
      },
    });

    if (existingPresensi) {
      return NextResponse.json({
        success: false,
        error: `Siswa sudah melakukan presensi ${tipe} hari ini`,
        data: {
          siswa,
          presensi: existingPresensi,
        },
      });
    }

    // Create new presensi record with Indonesian timezone
    const waktuSekarang = getCurrentDateIndonesia();
    const waktuFormatted = formatIndonesiaDate(waktuSekarang, 'HH:mm');
    
    const presensi = await prisma.presensi.create({
      data: {
        siswaId: siswa.id,
        tanggal: waktuSekarang,
        status: type, // 'hadir', 'izin', 'sakit', 'alpha'
        tipe: tipe,
        keterangan: `Scan QR Code ${tipe === 'masuk' ? 'Masuk' : 'Pulang'} - ${type}`,
      },
      include: {
        siswa: {
          select: {
            nisn: true,
            nama: true,
            kelas: {
              select: {
                nama: true,
              },
            },
          },
        },
      },
    });

    // Kirim pesan WhatsApp ke orang tua jika ada nomor
    if (siswa.noTelpWali) {
      try {
        const message = createWhatsAppMessage(siswa, tipe, waktuFormatted);
        
        // Tambahkan ke antrian WhatsApp
        try {
          const { addToQueue } = await import('@/lib/whatsapp-queue');
          await addToQueue(siswa.noTelpWali, message);
        } catch (error) {
          console.error('Error adding WhatsApp message to queue:', error);
          // Jangan gagalkan presensi jika WhatsApp gagal
        }
      } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
        // Jangan gagalkan presensi jika WhatsApp gagal
      }
    }

    return NextResponse.json({
      success: true,
      message: `Presensi ${tipe} ${type} berhasil dicatat`,
      data: {
        ...presensi,
        tipe: tipe,
        waktu: waktuFormatted,
      },
    });
  } catch (error) {
    console.error('Error scanning presensi:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses presensi' },
      { status: 500 }
    );
  }
}
