// Script to create the first super admin
// Run with: node scripts/create-superadmin.js

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

async function createSuperAdmin() {
  try {
    // Check if any super admin exists
    const existing = await sql`SELECT COUNT(*) as count FROM super_admins`;
    const count = parseInt(existing[0].count);
    
    console.log('Current super admin count:', count);
    
    if (count > 0) {
      console.log('Super admin already exists. Listing all:');
      const admins = await sql`SELECT id, email, nama, "isActive" FROM super_admins`;
      console.table(admins);
      return;
    }
    
    // Create default super admin
    const email = process.argv[2] || 'superadmin@platform.com';
    const password = process.argv[3] || 'superadmin123';
    const nama = process.argv[4] || 'Super Admin';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await sql`
      INSERT INTO super_admins (id, email, password, nama, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${email}, ${hashedPassword}, ${nama}, true, NOW(), NOW())
      RETURNING id, email, nama
    `;
    
    console.log('✅ Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Data:', result[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if table exists
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  Table super_admins does not exist. Run migrations first:');
      console.log('   npx prisma migrate deploy');
    }
  }
  
  process.exit(0);
}

createSuperAdmin();
