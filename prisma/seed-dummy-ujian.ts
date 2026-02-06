import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ 
  connectionString,
  ssl: false // Coolify database doesn't support SSL
});

const adapter = new PrismaPg(pool);

/**
 * FIX: Kita menggunakan 'as any' di sini untuk melewati pengecekan strict TypeScript 
 * saat build di environment CI/Docker jika engine prisma belum ter-generate sempurna.
 */
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🎯 Creating dummy ujian...\n');

  try {
    // Find first guru
    const guru = await (prisma as any).guru.findFirst({
      include: {
        user: true,
      },
    });

    if (!guru) {
      console.error('❌ No guru found. Please run seed.ts first.');
      return;
    }

    // Find first mapel (Matematika)
    const mapel = await (prisma as any).mataPelajaran.findFirst({
      where: {
        nama: {
          contains: 'Matematika',
        },
      },
    });

    if (!mapel) {
      console.error('❌ No mata pelajaran found. Please run seed.ts first.');
      return;
    }

    // Find first kelas
    const kelas = await (prisma as any).kelas.findFirst();
    if (!kelas) {
      console.error('❌ No kelas found. Please run seed.ts first.');
      return;
    }

    // Create dummy ujian
    const today = new Date();
    // Gunakan UTC agar aman di server
    const start = new Date(today);
    start.setHours(start.getHours() + 1); // Mulai 1 jam lagi
    const end = new Date(start);
    end.setHours(end.getHours() + 2);   // Durasi 2 jam

    const ujian = await (prisma as any).ujian.create({
      data: {
        judul: 'Ujian Dummy - Matematika Dasar',
        deskripsi: 'Ujian dummy untuk testing pengalaman user.',
        mapelId: mapel.id,
        guruId: guru.id,
        kelas: [kelas.nama],
        startUjian: start,
        endUjian: end,
        shuffleQuestions: false,
        showScore: true,
        status: 'aktif',
      },
    });

    console.log('✅ Created ujian:', ujian.judul);

    // Create 4 soal pilihan ganda
    const soalPG = [
      {
        ujianId: ujian.id,
        pertanyaan: 'Berapakah hasil dari 15 + 27?',
        opsiA: '40', opsiB: '42', opsiC: '44', opsiD: '45',
        jawabanBenar: 'B',
        urutan: 1,
      },
      {
        ujianId: ujian.id,
        pertanyaan: 'Jika persegi panjang P=8 L=5, berapa luasnya?',
        opsiA: '35 cm²', opsiB: '40 cm²', opsiC: '45 cm²', opsiD: '50 cm²',
        jawabanBenar: 'B',
        urutan: 2,
      },
      {
        ujianId: ujian.id,
        pertanyaan: 'Berapakah hasil dari 144 ÷ 12?',
        opsiA: '10', opsiB: '11', opsiC: '12', opsiD: '13',
        jawabanBenar: 'C',
        urutan: 3,
      },
      {
        ujianId: ujian.id,        pertanyaan: 'Jika x = 5, berapakah nilai dari 3x + 7?',
        opsiA: '20', opsiB: '22', opsiC: '24', opsiD: '26',
        jawabanBenar: 'B',
        urutan: 4,
      },
    ];

    await (prisma as any).soalPilihanGanda.createMany({
      data: soalPG,
    });

    console.log(`✅ Created ${soalPG.length} soal pilihan ganda`);
    console.log('\n✅ DUMMY UJIAN CREATED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Error creating dummy ujian:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });