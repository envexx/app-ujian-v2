import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
console.log('🔗 Connecting to database...');

const pool = new Pool({ 
  connectionString,
  ssl: false
});

const adapter = new PrismaPg(pool);
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

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
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
