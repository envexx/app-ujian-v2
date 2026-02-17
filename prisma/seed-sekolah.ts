import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter } as any);

async function seedSekolahInfo() {
  console.log('🌱 Seeding school information...');

  // Check if school info already exists
  const existing = await prisma.sekolahInfo.findFirst();

  if (existing) {
    console.log('ℹ️  School information already exists. Skipping seed.');
    return;
  }

  // Find first school
  const school = await prisma.school.findFirst();
  if (!school) {
    console.error('❌ No school found. Run main seed first.');
    return;
  }

  // Create default school information
  const sekolahInfo = await prisma.sekolahInfo.create({
    data: {
      schoolId: school.id,
      namaSekolah: 'SMP Negeri 1 Jakarta',
      alamat: 'Jl. Pendidikan No. 123, Jakarta Pusat, DKI Jakarta 10110',
      noTelp: '(021) 1234-5678',
      email: 'info@smpn1jakarta.sch.id',
      website: 'www.smpn1jakarta.sch.id',
      logo: null, // Will be uploaded later
      namaKepsek: 'Dr. Budi Santoso, M.Pd',
      nipKepsek: '196501011990031001',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil',
    },
  });

  console.log('✅ School information created:', sekolahInfo.namaSekolah);
}

async function main() {
  try {
    await seedSekolahInfo();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
