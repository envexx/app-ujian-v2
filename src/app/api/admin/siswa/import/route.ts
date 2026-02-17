import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      return NextResponse.json(
        { success: false, error: 'File harus berformat Excel (.xlsx atau .xls)' },
        { status: 400 }
      );
    }

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'File Excel kosong' },
        { status: 400 }
      );
    }

    // Get all kelas for validation (scoped to this school)
    const kelasList = await prisma.kelas.findMany({
      where: { schoolId: session.schoolId! },
      select: { id: true, nama: true },
    });
    const kelasMap = new Map(kelasList.map(k => [k.nama, k.id]));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Validate required fields
        const nis = String(row['NIS'] || row['nis'] || '').trim();
        const nisn = String(row['NISN'] || row['nisn'] || '').trim();
        const nama = String(row['Nama'] || row['nama'] || '').trim();
        const kelasNama = String(row['Kelas'] || row['kelas'] || '').trim();
        const jenisKelamin = String(row['Jenis Kelamin'] || row['Jenis Kelamin'] || row['jenis_kelamin'] || 'L').trim().toUpperCase();
        const tanggalLahir = row['Tanggal Lahir'] || row['tanggal_lahir'] || row['TanggalLahir'];
        const alamat = String(row['Alamat'] || row['alamat'] || '').trim();
        const noTelp = String(row['No. Telepon'] || row['No Telepon'] || row['no_telepon'] || row['NoTelepon'] || '').trim();
        const namaWali = String(row['Nama Wali'] || row['Nama Wali'] || row['nama_wali'] || row['NamaWali'] || '').trim();
        const noTelpWali = String(row['No. Telepon Wali'] || row['No Telepon Wali'] || row['no_telepon_wali'] || row['NoTeleponWali'] || '').trim();

        // Validation
        if (!nis || !nisn || !nama || !kelasNama) {
          results.failed++;
          results.errors.push(`Baris ${rowNumber}: Data tidak lengkap (NIS, NISN, Nama, Kelas wajib diisi)`);
          continue;
        }

        // Validate jenis kelamin
        if (jenisKelamin !== 'L' && jenisKelamin !== 'P') {
          results.failed++;
          results.errors.push(`Baris ${rowNumber}: Jenis Kelamin harus L atau P`);
          continue;
        }

        // Validate kelas
        const kelasId = kelasMap.get(kelasNama);
        if (!kelasId) {
          results.failed++;
          results.errors.push(`Baris ${rowNumber}: Kelas "${kelasNama}" tidak ditemukan`);
          continue;
        }

        // Parse tanggal lahir (optional)
        let tanggalLahirDate: Date | undefined;
        if (tanggalLahir) {
          if (typeof tanggalLahir === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            tanggalLahirDate = new Date(excelEpoch.getTime() + tanggalLahir * 24 * 60 * 60 * 1000);
          } else if (typeof tanggalLahir === 'string') {
            tanggalLahirDate = new Date(tanggalLahir);
          } else {
            tanggalLahirDate = new Date(tanggalLahir);
          }
          if (isNaN(tanggalLahirDate.getTime())) {
            tanggalLahirDate = undefined;
          }
        }

        // Check if siswa already exists
        const existingSiswa = await prisma.siswa.findFirst({
          where: {
            OR: [
              { nis },
              { nisn },
            ],
          },
        });

        if (existingSiswa) {
          results.failed++;
          results.errors.push(`Baris ${rowNumber}: Siswa dengan NIS/NISN sudah ada`);
          continue;
        }

        // Auto-generate email for User record
        const autoEmail = `${nis}@siswa.local`;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: autoEmail },
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`Baris ${rowNumber}: Akun dengan NIS ${nis} sudah ada`);
          continue;
        }

        // Create user and siswa in transaction
        await prisma.$transaction(async (tx) => {
          const defaultPassword = await bcrypt.hash(nisn, 10);
          const user = await tx.user.create({
            data: {
              schoolId: session.schoolId!,
              email: autoEmail,
              password: defaultPassword,
              role: 'SISWA',
              isActive: true,
            },
          });

          const siswaData: any = {
            schoolId: session.schoolId!,
            userId: user.id,
            nis,
            nisn,
            nama,
            kelasId,
            jenisKelamin,
          };
          if (tanggalLahirDate) siswaData.tanggalLahir = tanggalLahirDate;
          if (alamat) siswaData.alamat = alamat;
          if (noTelp) siswaData.noTelp = noTelp;
          if (namaWali) siswaData.namaWali = namaWali;
          if (noTelpWali) siswaData.noTelpWali = noTelpWali;

          await tx.siswa.create({ data: siswaData });
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Baris ${rowNumber}: ${error.message || 'Terjadi kesalahan'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${results.success} berhasil, ${results.failed} gagal`,
      data: {
        success: results.success,
        failed: results.failed,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error('Error importing siswa:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan saat import' },
      { status: 500 }
    );
  }
}
