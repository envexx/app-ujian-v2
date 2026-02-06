import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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

async function seedInfoMasuk() {
  console.log('🌱 Seeding Info Masuk & Pulang...\n');

  // Data default untuk jam masuk dan pulang
  const infoMasukData = [
    { hari: 'Senin', jamMasuk: '07:00', jamPulang: '14:00' },
    { hari: 'Selasa', jamMasuk: '07:00', jamPulang: '14:00' },
    { hari: 'Rabu', jamMasuk: '07:00', jamPulang: '14:00' },
    { hari: 'Kamis', jamMasuk: '07:00', jamPulang: '14:00' },
    { hari: 'Jumat', jamMasuk: '07:00', jamPulang: '13:00' }, // Jumat biasanya pulang lebih awal
    { hari: 'Sabtu', jamMasuk: '07:00', jamPulang: '12:00' }, // Sabtu biasanya setengah hari
    { hari: 'Minggu', jamMasuk: '08:00', jamPulang: '12:00' }, // Minggu biasanya tidak ada sekolah, tapi tetap diisi
  ];

  console.log('📅 Creating info masuk untuk setiap hari...');
  
  for (const data of infoMasukData) {
    try {
      const infoMasuk = await prisma.infoMasuk.upsert({
        where: { hari: data.hari },
        update: {
          jamMasuk: data.jamMasuk,
          jamPulang: data.jamPulang,
        },
        create: {
          hari: data.hari,
          jamMasuk: data.jamMasuk,
          jamPulang: data.jamPulang,
        },
      });
      
      console.log(`  ✅ ${data.hari}: Masuk ${data.jamMasuk}, Pulang ${data.jamPulang}`);
    } catch (error: any) {
      console.error(`  ❌ Error creating ${data.hari}:`, error.message);
    }
  }

  console.log('\n✅ Info Masuk berhasil di-seed!');
}

async function main() {
  try {
    await seedInfoMasuk();
  } catch (error) {
    console.error('❌ Error seeding info masuk:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

