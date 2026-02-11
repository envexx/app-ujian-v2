/**
 * Script untuk membersihkan User orphan (User tanpa Guru/Siswa)
 * Jalankan dengan: npx tsx scripts/cleanup-orphan-users.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanUsers() {
  try {
    console.log('🔍 Mencari User orphan...\n');

    // Find all users
    const allUsers = await prisma.user.findMany({
      include: {
        guru: true,
        siswa: true,
      },
    });

    const orphanUsers = allUsers.filter(
      (user) => !user.guru && !user.siswa && user.role !== 'ADMIN'
    );

    if (orphanUsers.length === 0) {
      console.log('✅ Tidak ada User orphan yang ditemukan.');
      return;
    }

    console.log(`⚠️  Ditemukan ${orphanUsers.length} User orphan:\n`);
    
    orphanUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Delete orphan users
    console.log('🗑️  Menghapus User orphan...\n');
    
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: {
          in: orphanUsers.map((u) => u.id),
        },
      },
    });

    console.log(`✅ Berhasil menghapus ${deleteResult.count} User orphan.`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanUsers();
