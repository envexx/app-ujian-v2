import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
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

    // Create 4 soal pilihan ganda (unified Soal model)
    const soalData = [
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Berapakah hasil dari 15 + 27?',
        poin: 25,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '40' },
            { id: 'B', teks: '42' },
            { id: 'C', teks: '44' },
            { id: 'D', teks: '45' },
          ],
          kunciJawaban: 'B',
        }),
        urutan: 1,
      },
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Jika persegi panjang P=8 L=5, berapa luasnya?',
        poin: 25,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '35 cm²' },
            { id: 'B', teks: '40 cm²' },
            { id: 'C', teks: '45 cm²' },
            { id: 'D', teks: '50 cm²' },
          ],
          kunciJawaban: 'B',
        }),
        urutan: 2,
      },
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Berapakah hasil dari 144 ÷ 12?',
        poin: 25,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '10' },
            { id: 'B', teks: '11' },
            { id: 'C', teks: '12' },
            { id: 'D', teks: '13' },
          ],
          kunciJawaban: 'C',
        }),
        urutan: 3,
      },
      {
        ujianId: ujian.id,
        tipe: 'PILIHAN_GANDA',
        pertanyaan: 'Jika x = 5, berapakah nilai dari 3x + 7?',
        poin: 25,
        data: JSON.stringify({
          opsi: [
            { id: 'A', teks: '20' },
            { id: 'B', teks: '22' },
            { id: 'C', teks: '24' },
            { id: 'D', teks: '26' },
          ],
          kunciJawaban: 'B',
        }),
        urutan: 4,
      },
    ];

    await (prisma as any).soal.createMany({
      data: soalData,
    });

    console.log(`✅ Created ${soalData.length} soal pilihan ganda`);
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