import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log('🔗 Connecting to Neon database...');

const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Creating admin user only...\n');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', existingAdmin.email);
    console.log('   Skipping admin creation.\n');
    return;
  }

  // Find or create school
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { nama: 'SMP Negeri 1 Jakarta', isActive: true },
    });
  }

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: 'admin@school.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      profilePhoto: '/uploads/profiles/admin.jpg',
    },
  });

  console.log('✅ Admin created successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 1 Admin user created');
  console.log('\n🔑 Login Credentials:');
  console.log('   Email: admin@school.com');
  console.log('   Password: admin123');
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
