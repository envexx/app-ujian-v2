import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import bcrypt from 'bcryptjs';

const publicRoutes = new Hono();

// GET /public/tiers
publicRoutes.get('/tiers', async (c) => {
  try {
    const tiers = await sql`SELECT * FROM tiers ORDER BY price ASC`;
    return c.json({ success: true, data: tiers });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return c.json({ success: false, error: 'Failed to fetch tiers' }, 500);
  }
});

// POST /public/register - Register new school
const registerSchema = z.object({
  namaSekolah: z.string().min(1), email: z.string().email(),
  password: z.string().min(6), namaAdmin: z.string().min(1),
  alamat: z.string().optional(), noTelp: z.string().optional(),
});

publicRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const existingUser = await sql`SELECT id FROM users WHERE email = ${body.email} LIMIT 1`;
    if (existingUser[0]) return c.json({ success: false, error: 'Email sudah terdaftar' }, 400);

    const freeTier = await sql`SELECT id FROM tiers WHERE price = 0 LIMIT 1`;
    if (!freeTier[0]) return c.json({ success: false, error: 'Free tier not found' }, 500);

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const school = await sql`
      INSERT INTO schools (nama, "tierId", "isActive", "createdAt", "updatedAt")
      VALUES (${body.namaSekolah}, ${freeTier[0].id}, true, NOW(), NOW()) RETURNING *
    `;
    const newUser = await sql`
      INSERT INTO users ("schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (${school[0].id}, ${body.email}, ${hashedPassword}, 'ADMIN', true, NOW(), NOW()) RETURNING *
    `;
    await sql`
      INSERT INTO sekolah_info ("schoolId", "namaSekolah", alamat, "noTelp", email, "createdAt", "updatedAt")
      VALUES (${school[0].id}, ${body.namaSekolah}, ${body.alamat || null}, ${body.noTelp || null}, ${body.email}, NOW(), NOW())
    `;

    return c.json({ success: true, message: 'Registrasi berhasil', data: { schoolId: school[0].id, email: newUser[0].email } });
  } catch (error) {
    console.error('Error registering:', error);
    return c.json({ success: false, error: 'Failed to register' }, 500);
  }
});

// GET /public/landing-media
publicRoutes.get('/landing-media', async (c) => {
  try {
    const media = await sql`SELECT * FROM landing_media WHERE "isActive" = true ORDER BY "order" ASC`;
    return c.json({ success: true, data: media });
  } catch (error) {
    console.error('Error fetching landing media:', error);
    return c.json({ success: false, error: 'Failed to fetch landing media' }, 500);
  }
});

export default publicRoutes;
