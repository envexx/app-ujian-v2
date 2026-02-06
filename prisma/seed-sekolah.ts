import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false // Coolify database doesn't support SSL
});
const adapter = new PrismaPg(pool);

/**
 * FIX: Using 'as any' to bypass TypeScript strict checking
 * due to version mismatch between @prisma/adapter-pg v7 and @prisma/client v6
 */
const prisma = new PrismaClient({ adapter } as any);

async function seedSekolahInfo() {
  console.log('🌱 Seeding school information...');

  // Check if school info already exists
  const existing = await prisma.sekolahInfo.findFirst();

  if (existing) {
    console.log('ℹ️  School information already exists. Skipping seed.');
    return;
  }

  // Create default school information
  const sekolahInfo = await prisma.sekolahInfo.create({
    data: {
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
    await pool.end();
  }
}

main();
