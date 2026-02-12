import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
console.log('🔗 Connecting to database...');

const pool = new Pool({ 
  connectionString,
  ssl: false // Coolify database doesn't support SSL
});

const adapter = new PrismaPg(pool);

/**
 * FIX: Using 'as any' to bypass TypeScript strict checking
 * due to version mismatch between @prisma/adapter-pg v7 and @prisma/client v6
 */
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Cleaning existing data...');
  await prisma.gradeConfig.deleteMany();
  await prisma.presensi.deleteMany();
  await prisma.kartuPelajar.deleteMany();
  await prisma.tugasSubmission.deleteMany();
  await prisma.tugas.deleteMany();
  await prisma.jawabanSoal.deleteMany();
  await prisma.ujianSubmission.deleteMany();
  await prisma.soal.deleteMany();
  await prisma.ujian.deleteMany();
  await prisma.materi.deleteMany();
  await prisma.jadwal.deleteMany();
  await prisma.guruMapel.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.guru.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.mataPelajaran.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      profilePhoto: '/uploads/profiles/admin.jpg',
    },
  });
  console.log('✅ Admin created:', adminUser.email);

  // ============================================
  // 2. CREATE MATA PELAJARAN
  // ============================================
  console.log('\n📚 Creating mata pelajaran...');
  const matematika = await prisma.mataPelajaran.create({
    data: {
      nama: 'Matematika',
      kode: 'MAT',
      jenis: 'wajib',
      jamPerMinggu: 4,
    },
  });

  const bahasaIndonesia = await prisma.mataPelajaran.create({
    data: {
      nama: 'Bahasa Indonesia',
      kode: 'BIN',
      jenis: 'wajib',
      jamPerMinggu: 4,
    },
  });

  const ipa = await prisma.mataPelajaran.create({
    data: {
      nama: 'IPA',
      kode: 'IPA',
      jenis: 'wajib',
      jamPerMinggu: 4,
    },
  });

  const bahasaInggris = await prisma.mataPelajaran.create({
    data: {
      nama: 'Bahasa Inggris',
      kode: 'BING',
      jenis: 'wajib',
      jamPerMinggu: 3,
    },
  });

  console.log('✅ Created 4 mata pelajaran');

  // ============================================
  // 3. CREATE KELAS
  // ============================================
  console.log('\n🏫 Creating kelas...');
  const kelas7A = await prisma.kelas.create({
    data: {
      nama: '7A',
      tingkat: '7',
      tahunAjaran: '2024/2025',
    },
  });

  const kelas7B = await prisma.kelas.create({
    data: {
      nama: '7B',
      tingkat: '7',
      tahunAjaran: '2024/2025',
    },
  });

  const kelas8A = await prisma.kelas.create({
    data: {
      nama: '8A',
      tingkat: '8',
      tahunAjaran: '2024/2025',
    },
  });

  console.log('✅ Created 3 kelas');

  // ============================================
  // 4. CREATE GURU (3 GURU)
  // ============================================
  console.log('\n👨‍🏫 Creating guru...');
  
  const guru1User = await prisma.user.create({
    data: {
      email: 'budi.hartono@school.com',
      password: await bcrypt.hash('guru123', 10),
      role: 'GURU',
      profilePhoto: '/uploads/profiles/guru1.jpg',
      guru: {
        create: {
          nipUsername: '196501011990031001',
          nama: 'Dr. Budi Hartono, M.Pd',
          email: 'budi.hartono@school.com',
          alamat: 'Jl. Pendidikan No. 10, Jakarta',
          jenisKelamin: 'L',
          foto: '/uploads/profiles/guru1.jpg',
        },
      },
    },
    include: { guru: true },
  });

  const guru2User = await prisma.user.create({
    data: {
      email: 'siti.nurhaliza@school.com',
      password: await bcrypt.hash('guru123', 10),
      role: 'GURU',
      profilePhoto: '/uploads/profiles/guru2.jpg',
      guru: {
        create: {
          nipUsername: '197003151995122001',
          nama: 'Siti Nurhaliza, S.Pd',
          email: 'siti.nurhaliza@school.com',
          alamat: 'Jl. Guru No. 15, Jakarta',
          jenisKelamin: 'P',
          foto: '/uploads/profiles/guru2.jpg',
        },
      },
    },
    include: { guru: true },
  });

  const guru3User = await prisma.user.create({
    data: {
      email: 'ahmad.fauzi@school.com',
      password: await bcrypt.hash('guru123', 10),
      role: 'GURU',
      profilePhoto: '/uploads/profiles/guru3.jpg',
      guru: {
        create: {
          nipUsername: '198505202010011002',
          nama: 'Ahmad Fauzi, S.Si',
          email: 'ahmad.fauzi@school.com',
          alamat: 'Jl. Ilmu No. 20, Jakarta',
          jenisKelamin: 'L',
          foto: '/uploads/profiles/guru3.jpg',
        },
      },
    },
    include: { guru: true },
  });

  console.log('✅ Created 3 guru');

  // Link guru to mapel
  await prisma.guruMapel.createMany({
    data: [
      { guruId: guru1User.guru!.id, mapelId: matematika.id },
      { guruId: guru2User.guru!.id, mapelId: bahasaIndonesia.id },
      { guruId: guru3User.guru!.id, mapelId: ipa.id },
    ],
  });

  // Update kelas with wali kelas
  await prisma.kelas.update({
    where: { id: kelas7A.id },
    data: { waliKelasId: guru1User.guru!.id },
  });

  // ============================================
  // 5. CREATE SISWA (7 SISWA)
  // ============================================
  console.log('\n👨‍🎓 Creating siswa...');

  const siswaData = [
    {
      email: 'ahmad.rizki@student.com',
      nama: 'Ahmad Rizki',
      nisn: '0012345678',
      nis: '2024001',
      kelasId: kelas7A.id,
      jenisKelamin: 'L',
      tanggalLahir: new Date('2010-05-15'),
      alamat: 'Jl. Merdeka No. 123, Jakarta',
      namaWali: 'Bapak Rizki',
      noTelpWali: '081234560001',
    },
    {
      email: 'siti.aisyah@student.com',
      nama: 'Siti Aisyah',
      nisn: '0012345679',
      nis: '2024002',
      kelasId: kelas7A.id,
      jenisKelamin: 'P',
      tanggalLahir: new Date('2010-08-20'),
      alamat: 'Jl. Sudirman No. 456, Jakarta',
      namaWali: 'Ibu Aisyah',
      noTelpWali: '081234560002',
    },
    {
      email: 'budi.santoso@student.com',
      nama: 'Budi Santoso',
      nisn: '0012345680',
      nis: '2024003',
      kelasId: kelas7A.id,
      jenisKelamin: 'L',
      tanggalLahir: new Date('2010-03-10'),
      alamat: 'Jl. Gatot Subroto No. 789, Jakarta',
      namaWali: 'Bapak Santoso',
      noTelpWali: '081234560003',
    },
    {
      email: 'dewi.lestari@student.com',
      nama: 'Dewi Lestari',
      nisn: '0012345681',
      nis: '2024004',
      kelasId: kelas7B.id,
      jenisKelamin: 'P',
      tanggalLahir: new Date('2010-11-25'),
      alamat: 'Jl. Thamrin No. 321, Jakarta',
      namaWali: 'Ibu Lestari',
      noTelpWali: '081234560004',
    },
    {
      email: 'eko.prasetyo@student.com',
      nama: 'Eko Prasetyo',
      nisn: '0012345682',
      nis: '2024005',
      kelasId: kelas7B.id,
      jenisKelamin: 'L',
      tanggalLahir: new Date('2010-07-18'),
      alamat: 'Jl. Kuningan No. 654, Jakarta',
      namaWali: 'Bapak Prasetyo',
      noTelpWali: '081234560005',
    },
    {
      email: 'fitri.handayani@student.com',
      nama: 'Fitri Handayani',
      nisn: '0012345683',
      nis: '2024006',
      kelasId: kelas8A.id,
      jenisKelamin: 'P',
      tanggalLahir: new Date('2009-12-05'),
      alamat: 'Jl. Senayan No. 987, Jakarta',
      namaWali: 'Ibu Handayani',
      noTelpWali: '081234560006',
    },
    {
      email: 'hendra.wijaya@student.com',
      nama: 'Hendra Wijaya',
      nisn: '0012345684',
      nis: '2024007',
      kelasId: kelas8A.id,
      jenisKelamin: 'L',
      tanggalLahir: new Date('2009-09-30'),
      alamat: 'Jl. Menteng No. 147, Jakarta',
      namaWali: 'Bapak Wijaya',
      noTelpWali: '081234560007',
    },
  ];

  for (const data of siswaData) {
    await prisma.user.create({
      data: {
        email: data.email,
        password: await bcrypt.hash('siswa123', 10),
        role: 'SISWA',
        profilePhoto: `/uploads/profiles/${data.nis}.jpg`,
        siswa: {
          create: {
            ...data,
            foto: `/uploads/profiles/${data.nis}.jpg`,
          },
        },
      },
    });
  }

  console.log('✅ Created 7 siswa');

  // ============================================
  // 6. CREATE KARTU PELAJAR
  // ============================================
  console.log('\n🎫 Creating kartu pelajar...');
  const allSiswa = await prisma.siswa.findMany();
  
  for (const siswa of allSiswa) {
    await prisma.kartuPelajar.create({
      data: {
        siswaId: siswa.id,
        tanggalTerbit: new Date('2024-01-15'),
        tanggalKadaluarsa: new Date('2027-01-15'),
        status: 'aktif',
      },
    });
  }

  console.log(`✅ Created ${allSiswa.length} kartu pelajar`);

  // ============================================
  // 7. CREATE PRESENSI (Sample for today)
  // ============================================
  console.log('\n📝 Creating presensi...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const presensiData = [
    { siswaId: allSiswa[0].id, status: 'hadir' },
    { siswaId: allSiswa[1].id, status: 'hadir' },
    { siswaId: allSiswa[2].id, status: 'izin', keterangan: 'Sakit demam' },
    { siswaId: allSiswa[3].id, status: 'hadir' },
    { siswaId: allSiswa[4].id, status: 'alpha' },
    { siswaId: allSiswa[5].id, status: 'hadir' },
    { siswaId: allSiswa[6].id, status: 'hadir' },
  ];

  for (const data of presensiData) {
    await prisma.presensi.create({
      data: {
        ...data,
        tanggal: today,
      },
    });
  }

  console.log('✅ Created presensi for today');

  // ============================================
  // 8. CREATE TUGAS
  // ============================================
  console.log('\n📋 Creating tugas...');
  await prisma.tugas.create({
    data: {
      judul: 'Latihan Soal Aljabar',
      deskripsi: 'Kerjakan soal latihan aljabar halaman 45-50',
      instruksi: 'Kerjakan dengan rapi dan jelas. Upload dalam format PDF.',
      mapelId: matematika.id,
      guruId: guru1User.guru!.id,
      kelas: ['7A', '7B'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'aktif',
    },
  });

  console.log('✅ Created 1 tugas');

  // ============================================
  // 9. CREATE UJIAN
  // ============================================
  console.log('\n📝 Creating ujian...');
  const ujian = await prisma.ujian.create({
    data: {
      judul: 'Ujian Tengah Semester Matematika',
      deskripsi: 'UTS Matematika Kelas 7',
      mapelId: matematika.id,
      guruId: guru1User.guru!.id,
      kelas: ['7A', '7B'],
      startUjian: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 14 days from now at 08:00
      endUjian: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 14 days from now at 09:30 (90 menit)
      shuffleQuestions: false,
      showScore: true,
      status: 'aktif',
    },
  });

  // Add sample questions (unified Soal model)
  await prisma.soal.createMany({
    data: [
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Berapakah hasil dari 2 + 2?',
        poin: 40,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '3' },
            { id: 'B', teks: '4' },
            { id: 'C', teks: '5' },
            { id: 'D', teks: '6' },
          ],
          kunciJawaban: 'B',
        }),
        urutan: 1,
      },
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Berapakah hasil dari 5 x 3?',
        poin: 40,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '10' },
            { id: 'B', teks: '12' },
            { id: 'C', teks: '15' },
            { id: 'D', teks: '18' },
          ],
          kunciJawaban: 'C',
        }),
        urutan: 2,
      },
      {
        ujianId: ujian.id,
        tipe: 'ESSAY',
        pertanyaan: 'Jelaskan pengertian aljabar dan berikan contohnya!',
        poin: 20,
        data: JSON.stringify({
          kunciJawaban: 'Aljabar adalah cabang matematika yang menggunakan simbol dan huruf untuk mewakili angka.',
        }),
        urutan: 3,
      },
    ],
  });

  console.log('✅ Created 1 ujian with 3 soal');

  // ============================================
  // 9. NILAI - REMOVED
  // ============================================
  // Nilai sekarang dihitung otomatis dari UjianSubmission
  // menggunakan bobot PG & Essay dari GradeConfig
  console.log('ℹ️  Nilai will be calculated from ujian submissions\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n✅ ============================================');
  console.log('✅ DATABASE SEEDING COMPLETED!');
  console.log('✅ ============================================\n');
  console.log('📊 Summary:');
  console.log('   - 1 Admin user');
  console.log('   - 3 Guru users');
  console.log('   - 7 Siswa users');
  console.log('   - 4 Mata pelajaran');
  console.log('   - 3 Kelas');
  console.log('   - 7 Kartu pelajar');
  console.log('   - 7 Presensi (today)');
  console.log('   - 1 Tugas');
  console.log('   - 1 Ujian (with 3 soal)');
  console.log('\n🔑 Login Credentials:');
  console.log('   Admin: admin@school.com / admin123');
  console.log('   Guru: budi.hartono@school.com / guru123');
  console.log('   Siswa: ahmad.rizki@student.com / siswa123');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
