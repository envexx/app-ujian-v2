import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function resetAllPasswords() {
  console.log('🔐 Resetting all user passwords to bcrypt format...');
  
  // Get all users
  const users = await sql`SELECT id, email, role, password FROM users`;
  
  console.log(`� Found ${users.length} users`);
  
  for (const user of users) {
    // Check if password is already bcrypt (starts with $2a$ or $2b$)
    if (user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$')) {
      console.log(`✓ ${user.email} (${user.role}) - already bcrypt`);
      continue;
    }
    
    // Set default password based on role
    let newPassword = 'password123';
    if (user.role === 'ADMIN') newPassword = 'admin123';
    else if (user.role === 'GURU') newPassword = 'guru123';
    else if (user.role === 'SISWA') newPassword = 'siswa123';
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${user.id}`;
    console.log(`✅ ${user.email} (${user.role}) - reset to "${newPassword}"`);
  }
  
  console.log('\n🎉 Done!');
}

resetAllPasswords().catch(console.error);
