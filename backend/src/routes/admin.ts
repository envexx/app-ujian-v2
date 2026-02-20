import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

const admin = new Hono<HonoEnv>();

// Apply auth middleware
admin.use('*', authMiddleware, tenantMiddleware);

// ============================================
// KELAS ROUTES
// ============================================

admin.get('/kelas', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const kelasList = await sql`
      SELECT k.*, (SELECT COUNT(*) FROM siswa WHERE "kelasId" = k.id) as siswa_count
      FROM kelas k WHERE k."schoolId" = ${user.schoolId} ORDER BY k.nama ASC
    `;
    return c.json({
      success: true,
      data: kelasList.map((k: any) => ({
        id: k.id, nama: k.nama, tingkat: k.tingkat, jurusan: k.jurusan,
        tahunAjaran: k.tahunAjaran, jumlahSiswa: parseInt(k.siswa_count || '0'),
      })),
    });
  } catch (error) {
    console.error('Error fetching kelas:', error);
    return c.json({ success: false, error: 'Failed to fetch kelas' }, 500);
  }
});

const createKelasSchema = z.object({
  nama: z.string().min(1), tingkat: z.string().optional(),
  tahunAjaran: z.string().optional(),
});

admin.post('/kelas', requireRole('ADMIN', 'SUPERADMIN'), zValidator('json', createKelasSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');
    const tierCheck = await sql`
      SELECT t."maxKelas" as max, (SELECT COUNT(*) FROM kelas WHERE "schoolId" = ${user.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${user.schoolId}
    `;
    if (tierCheck[0] && parseInt(tierCheck[0].current) >= tierCheck[0].max) {
      return c.json({ success: false, error: 'Batas maksimal kelas tercapai' }, 403);
    }
    const result = await sql`
      INSERT INTO kelas (id, "schoolId", nama, tingkat, "tahunAjaran", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${body.nama}, ${body.tingkat || null}, ${body.tahunAjaran || null}, NOW(), NOW())
      RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating kelas:', error);
    return c.json({ success: false, error: 'Failed to create kelas' }, 500);
  }
});

admin.put('/kelas/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await sql`
      UPDATE kelas SET nama = ${body.nama}, tingkat = ${body.tingkat || null},
      "tahunAjaran" = ${body.tahunAjaran || null}, "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${user.schoolId} RETURNING *
    `;
    if (!result[0]) return c.json({ success: false, error: 'Kelas tidak ditemukan' }, 404);
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating kelas:', error);
    return c.json({ success: false, error: 'Failed to update kelas' }, 500);
  }
});

admin.delete('/kelas/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await sql`DELETE FROM kelas WHERE id = ${id} AND "schoolId" = ${user.schoolId}`;
    return c.json({ success: true, message: 'Kelas deleted' });
  } catch (error) {
    console.error('Error deleting kelas:', error);
    return c.json({ success: false, error: 'Failed to delete kelas' }, 500);
  }
});

// ============================================
// SISWA ROUTES
// ============================================

admin.get('/siswa', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const kelasId = c.req.query('kelasId');
    let siswaList;
    if (kelasId) {
      siswaList = await sql`
        SELECT s.*, k.nama as kelas_nama, u.email, u."isActive"
        FROM siswa s LEFT JOIN kelas k ON k.id = s."kelasId" LEFT JOIN users u ON u.id = s."userId"
        WHERE s."schoolId" = ${user.schoolId} AND s."kelasId" = ${kelasId} ORDER BY s.nama ASC
      `;
    } else {
      siswaList = await sql`
        SELECT s.*, k.nama as kelas_nama, u.email, u."isActive"
        FROM siswa s LEFT JOIN kelas k ON k.id = s."kelasId" LEFT JOIN users u ON u.id = s."userId"
        WHERE s."schoolId" = ${user.schoolId} ORDER BY s.nama ASC
      `;
    }
    return c.json({
      success: true,
      data: siswaList.map((s: any) => ({
        id: s.id, nis: s.nis, nisn: s.nisn, nama: s.nama, jenisKelamin: s.jenisKelamin,
        kelas: s.kelas_nama, kelasId: s.kelasId, email: s.email, isActive: s.isActive,
      })),
    });
  } catch (error) {
    console.error('Error fetching siswa:', error);
    return c.json({ success: false, error: 'Failed to fetch siswa' }, 500);
  }
});

const createSiswaSchema = z.object({
  nis: z.string().min(1), nisn: z.string().min(1), nama: z.string().min(1),
  kelasId: z.string().min(1), jenisKelamin: z.enum(['L', 'P']),
  tanggalLahir: z.string().optional(), alamat: z.string().optional(),
  noTelp: z.string().optional(), namaWali: z.string().optional(), noTelpWali: z.string().optional(),
});

admin.post('/siswa', requireRole('ADMIN', 'SUPERADMIN'), zValidator('json', createSiswaSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');
    const tierCheck = await sql`
      SELECT t."maxSiswa" as max, (SELECT COUNT(*) FROM siswa WHERE "schoolId" = ${user.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${user.schoolId}
    `;
    if (tierCheck[0] && parseInt(tierCheck[0].current) >= tierCheck[0].max) {
      return c.json({ success: false, error: 'Batas maksimal siswa tercapai' }, 403);
    }
    const existing = await sql`
      SELECT id FROM siswa WHERE ("nis" = ${body.nis} OR "nisn" = ${body.nisn}) AND "schoolId" = ${user.schoolId} LIMIT 1
    `;
    if (existing[0]) return c.json({ success: false, error: 'NIS atau NISN sudah terdaftar' }, 400);

    const autoEmail = `${body.nis}@siswa.local`;
    const defaultPassword = await bcrypt.hash(body.nisn, 10);
    const newUser = await sql`
      INSERT INTO users (id, "schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${autoEmail}, ${defaultPassword}, 'SISWA', true, NOW(), NOW()) RETURNING *
    `;
    const siswa = await sql`
      INSERT INTO siswa (id, "schoolId", "userId", nis, nisn, nama, "kelasId", "jenisKelamin", "tanggalLahir", alamat, "noTelp", "namaWali", "noTelpWali", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${newUser[0].id}, ${body.nis}, ${body.nisn}, ${body.nama}, ${body.kelasId}, ${body.jenisKelamin},
              ${body.tanggalLahir || null}, ${body.alamat || null}, ${body.noTelp || null}, ${body.namaWali || null}, ${body.noTelpWali || null}, NOW(), NOW())
      RETURNING *
    `;
    return c.json({ success: true, data: siswa[0] });
  } catch (error) {
    console.error('Error creating siswa:', error);
    return c.json({ success: false, error: 'Failed to create siswa' }, 500);
  }
});

admin.put('/siswa/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await sql`
      UPDATE siswa SET nis = ${body.nis}, nisn = ${body.nisn}, nama = ${body.nama}, "kelasId" = ${body.kelasId},
      "jenisKelamin" = ${body.jenisKelamin}, "tanggalLahir" = ${body.tanggalLahir || null}, alamat = ${body.alamat || null},
      "noTelp" = ${body.noTelp || null}, "namaWali" = ${body.namaWali || null}, "noTelpWali" = ${body.noTelpWali || null}, "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${user.schoolId} RETURNING *
    `;
    if (!result[0]) return c.json({ success: false, error: 'Siswa tidak ditemukan' }, 404);
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating siswa:', error);
    return c.json({ success: false, error: 'Failed to update siswa' }, 500);
  }
});

admin.delete('/siswa/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const siswa = await sql`SELECT "userId" FROM siswa WHERE id = ${id} AND "schoolId" = ${user.schoolId} LIMIT 1`;
    if (!siswa[0]) return c.json({ success: false, error: 'Siswa not found' }, 404);
    await sql`DELETE FROM siswa WHERE id = ${id}`;
    if (siswa[0].userId) await sql`DELETE FROM users WHERE id = ${siswa[0].userId}`;
    return c.json({ success: true, message: 'Siswa deleted' });
  } catch (error) {
    console.error('Error deleting siswa:', error);
    return c.json({ success: false, error: 'Failed to delete siswa' }, 500);
  }
});

// Siswa import template - Excel format
admin.get('/siswa/template', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    
    // Get kelas list for reference
    const kelasList = await sql`SELECT id, nama FROM kelas WHERE "schoolId" = ${user.schoolId} ORDER BY nama ASC`;
    
    // Create workbook with two sheets
    const wb = XLSX.utils.book_new();
    
    // Main data sheet
    const dataHeaders = ['nis', 'nisn', 'nama', 'kelas', 'jenisKelamin', 'tanggalLahir', 'alamat', 'noTelp', 'namaWali', 'noTelpWali'];
    const exampleRow = ['12345', '1234567890', 'Nama Siswa', kelasList[0]?.nama || 'X-IPA-1', 'L', '2008-01-15', 'Jl. Contoh No. 1', '08123456789', 'Nama Wali', '08987654321'];
    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, exampleRow]);
    XLSX.utils.book_append_sheet(wb, dataSheet, 'Data Siswa');
    
    // Reference sheet for kelas
    const kelasData = [['Nama Kelas (gunakan salah satu)'], ...kelasList.map((k: any) => [k.nama])];
    const kelasSheet = XLSX.utils.aoa_to_sheet(kelasData);
    XLSX.utils.book_append_sheet(wb, kelasSheet, 'Daftar Kelas');
    
    // Instructions sheet
    const instructions = [
      ['PETUNJUK PENGISIAN'],
      [''],
      ['Kolom', 'Keterangan', 'Wajib'],
      ['nis', 'Nomor Induk Siswa (unik)', 'Ya'],
      ['nisn', 'Nomor Induk Siswa Nasional (unik)', 'Ya'],
      ['nama', 'Nama lengkap siswa', 'Ya'],
      ['kelas', 'Nama kelas (lihat sheet Daftar Kelas)', 'Ya'],
      ['jenisKelamin', 'L untuk Laki-laki, P untuk Perempuan', 'Ya'],
      ['tanggalLahir', 'Format: YYYY-MM-DD (contoh: 2008-01-15)', 'Tidak'],
      ['alamat', 'Alamat lengkap', 'Tidak'],
      ['noTelp', 'Nomor telepon siswa', 'Tidak'],
      ['namaWali', 'Nama wali/orang tua', 'Tidak'],
      ['noTelpWali', 'Nomor telepon wali', 'Tidak'],
      [''],
      ['CATATAN:'],
      ['- Hapus baris contoh sebelum import'],
      ['- Password default siswa adalah NISN'],
      ['- Email otomatis: nis@siswa.local'],
    ];
    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, instructionSheet, 'Petunjuk');
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Template_Import_Siswa.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return c.json({ success: false, error: 'Failed to generate template' }, 500);
  }
});

// Siswa import from Excel
admin.post('/siswa/import', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.parseBody();
    const file = body['file'];
    
    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: 'File tidak ditemukan' }, 400);
    }
    
    // Check tier limit
    const tierCheck = await sql`
      SELECT t."maxSiswa" as max, (SELECT COUNT(*) FROM siswa WHERE "schoolId" = ${user.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${user.schoolId}
    `;
    const currentCount = parseInt(tierCheck[0]?.current || '0');
    const maxSiswa = tierCheck[0]?.max || 0;
    
    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet (Data Siswa)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 2) {
      return c.json({ success: false, error: 'File kosong atau tidak ada data' }, 400);
    }
    
    // Get headers (first row)
    const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
    const rows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
    
    // Get kelas mapping
    const kelasList = await sql`SELECT id, nama FROM kelas WHERE "schoolId" = ${user.schoolId}`;
    const kelasMap: Record<string, string> = {};
    for (const k of kelasList) {
      kelasMap[k.nama.toLowerCase()] = k.id;
    }
    
    // Process rows
    const results = { success: 0, failed: 0, errors: [] as string[] };
    let importedCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)
      
      try {
        // Check tier limit
        if (currentCount + importedCount >= maxSiswa) {
          results.errors.push(`Baris ${rowNum}: Batas maksimal siswa tercapai (${maxSiswa})`);
          results.failed++;
          continue;
        }
        
        // Map row to object
        const rowData: Record<string, any> = {};
        headers.forEach((header, idx) => {
          rowData[header] = row[idx];
        });
        
        const nis = String(rowData.nis || '').trim();
        const nisn = String(rowData.nisn || '').trim();
        const nama = String(rowData.nama || '').trim();
        const kelasName = String(rowData.kelas || '').trim().toLowerCase();
        const jenisKelamin = String(rowData.jeniskelamin || rowData['jenis kelamin'] || 'L').trim().toUpperCase();
        const tanggalLahir = rowData.tanggallahir || rowData['tanggal lahir'] || null;
        const alamat = rowData.alamat || null;
        const noTelp = rowData.notelp || rowData['no telp'] || null;
        const namaWali = rowData.namawali || rowData['nama wali'] || null;
        const noTelpWali = rowData.notelpwali || rowData['no telp wali'] || null;
        
        // Validate required fields
        if (!nis) {
          results.errors.push(`Baris ${rowNum}: NIS wajib diisi`);
          results.failed++;
          continue;
        }
        if (!nisn) {
          results.errors.push(`Baris ${rowNum}: NISN wajib diisi`);
          results.failed++;
          continue;
        }
        if (!nama) {
          results.errors.push(`Baris ${rowNum}: Nama wajib diisi`);
          results.failed++;
          continue;
        }
        
        // Get kelasId
        const kelasId = kelasMap[kelasName];
        if (!kelasId) {
          results.errors.push(`Baris ${rowNum}: Kelas "${rowData.kelas}" tidak ditemukan`);
          results.failed++;
          continue;
        }
        
        // Validate jenisKelamin
        if (!['L', 'P'].includes(jenisKelamin)) {
          results.errors.push(`Baris ${rowNum}: Jenis kelamin harus L atau P`);
          results.failed++;
          continue;
        }
        
        // Check duplicate NIS/NISN
        const existing = await sql`
          SELECT id FROM siswa WHERE ("nis" = ${nis} OR "nisn" = ${nisn}) AND "schoolId" = ${user.schoolId} LIMIT 1
        `;
        if (existing[0]) {
          results.errors.push(`Baris ${rowNum}: NIS atau NISN sudah terdaftar`);
          results.failed++;
          continue;
        }
        
        // Create user account
        const autoEmail = `${nis}@siswa.local`;
        const defaultPassword = await bcrypt.hash(nisn, 10);
        
        const newUser = await sql`
          INSERT INTO users (id, "schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.schoolId}, ${autoEmail}, ${defaultPassword}, 'SISWA', true, NOW(), NOW()) RETURNING id
        `;
        
        // Parse tanggal lahir
        let parsedTanggalLahir = null;
        if (tanggalLahir) {
          if (typeof tanggalLahir === 'number') {
            // Excel date serial number
            const date = XLSX.SSF.parse_date_code(tanggalLahir);
            parsedTanggalLahir = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else {
            parsedTanggalLahir = String(tanggalLahir);
          }
        }
        
        // Create siswa
        await sql`
          INSERT INTO siswa (id, "schoolId", "userId", nis, nisn, nama, "kelasId", "jenisKelamin", "tanggalLahir", alamat, "noTelp", "namaWali", "noTelpWali", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${user.schoolId}, ${newUser[0].id}, ${nis}, ${nisn}, ${nama}, ${kelasId}, ${jenisKelamin},
                  ${parsedTanggalLahir}, ${alamat}, ${noTelp}, ${namaWali}, ${noTelpWali}, NOW(), NOW())
        `;
        
        results.success++;
        importedCount++;
      } catch (err: any) {
        console.error(`Error importing row ${rowNum}:`, err);
        results.errors.push(`Baris ${rowNum}: ${err.message || 'Gagal menyimpan data'}`);
        results.failed++;
      }
    }
    
    const message = results.failed === 0 
      ? `Berhasil mengimport ${results.success} siswa`
      : `Import selesai: ${results.success} berhasil, ${results.failed} gagal`;
    
    return c.json({
      success: true,
      message,
      data: results,
    });
  } catch (error) {
    console.error('Error importing siswa:', error);
    return c.json({ success: false, error: 'Gagal mengimport data siswa' }, 500);
  }
});

// ============================================
// GURU ROUTES
// ============================================

admin.get('/guru', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const guruList = await sql`
      SELECT g.*, u.email, u."isActive" FROM guru g LEFT JOIN users u ON u.id = g."userId"
      WHERE g."schoolId" = ${user.schoolId} ORDER BY g.nama ASC
    `;
    const guruWithRelations = await Promise.all(guruList.map(async (g: any) => {
      const mapelData = await sql`SELECT gm."mapelId", m.nama, m.kode FROM guru_mapel gm JOIN mata_pelajaran m ON m.id = gm."mapelId" WHERE gm."guruId" = ${g.id}`;
      const kelasData = await sql`SELECT gk."kelasId", k.nama, k.tingkat FROM guru_kelas gk JOIN kelas k ON k.id = gk."kelasId" WHERE gk."guruId" = ${g.id}`;
      return { 
        id: g.id, nip: g.nipUsername, nama: g.nama, jenisKelamin: g.jenisKelamin, email: g.email, alamat: g.alamat, isActive: g.isActive, 
        mapel: mapelData.map((m: any) => ({ mapelId: m.mapelId, nama: m.nama, kode: m.kode })),
        kelas: kelasData.map((k: any) => ({ kelasId: k.kelasId, nama: k.nama, tingkat: k.tingkat })),
      };
    }));
    return c.json({ success: true, data: guruWithRelations });
  } catch (error) {
    console.error('Error fetching guru:', error);
    return c.json({ success: false, error: 'Failed to fetch guru' }, 500);
  }
});

const createGuruSchema = z.object({
  nip: z.string().min(1), nama: z.string().min(1), email: z.string().email(),
  jenisKelamin: z.enum(['L', 'P']), mapelIds: z.array(z.string()).optional(),
});

admin.post('/guru', requireRole('ADMIN', 'SUPERADMIN'), zValidator('json', createGuruSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');
    const tierCheck = await sql`
      SELECT t."maxGuru" as max, (SELECT COUNT(*) FROM guru WHERE "schoolId" = ${user.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${user.schoolId}
    `;
    if (tierCheck[0] && parseInt(tierCheck[0].current) >= tierCheck[0].max) {
      return c.json({ success: false, error: 'Batas maksimal guru tercapai' }, 403);
    }
    const existingUser = await sql`SELECT id FROM users WHERE email = ${body.email} LIMIT 1`;
    if (existingUser[0]) return c.json({ success: false, error: 'Email sudah terdaftar' }, 400);

    const defaultPassword = await bcrypt.hash('guru123', 10);
    const newUser = await sql`
      INSERT INTO users (id, "schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${body.email}, ${defaultPassword}, 'GURU', true, NOW(), NOW()) RETURNING *
    `;
    const newGuru = await sql`
      INSERT INTO guru (id, "schoolId", "userId", "nipUsername", nama, email, "jenisKelamin", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${newUser[0].id}, ${body.nip}, ${body.nama}, ${body.email}, ${body.jenisKelamin}, true, NOW(), NOW()) RETURNING *
    `;
    if (body.mapelIds) {
      for (const mapelId of body.mapelIds) {
        await sql`INSERT INTO guru_mapel (id, "guruId", "mapelId") VALUES (gen_random_uuid(), ${newGuru[0].id}, ${mapelId})`;
      }
    }
    return c.json({ success: true, data: newGuru[0] });
  } catch (error) {
    console.error('Error creating guru:', error);
    return c.json({ success: false, error: 'Failed to create guru' }, 500);
  }
});

admin.put('/guru/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await sql`
      UPDATE guru SET "nipUsername" = ${body.nip || body.nipUsername}, nama = ${body.nama}, "jenisKelamin" = ${body.jenisKelamin}, 
        alamat = ${body.alamat || null}, "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${user.schoolId} RETURNING *
    `;
    if (!result[0]) return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    
    // Update isActive on user
    if (body.isActive !== undefined) {
      await sql`UPDATE users SET "isActive" = ${body.isActive} WHERE id = ${result[0].userId}`;
    }
    
    // Update mapel relations
    if (body.mapelIds) {
      await sql`DELETE FROM guru_mapel WHERE "guruId" = ${id}`;
      for (const mapelId of body.mapelIds) {
        await sql`INSERT INTO guru_mapel (id, "guruId", "mapelId") VALUES (gen_random_uuid(), ${id}, ${mapelId})`;
      }
    }
    
    // Update kelas relations
    if (body.kelasIds) {
      await sql`DELETE FROM guru_kelas WHERE "guruId" = ${id}`;
      for (const kelasId of body.kelasIds) {
        await sql`INSERT INTO guru_kelas (id, "guruId", "kelasId") VALUES (gen_random_uuid(), ${id}, ${kelasId})`;
      }
    }
    
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating guru:', error);
    return c.json({ success: false, error: 'Failed to update guru' }, 500);
  }
});

admin.delete('/guru/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const guru = await sql`SELECT "userId" FROM guru WHERE id = ${id} AND "schoolId" = ${user.schoolId} LIMIT 1`;
    if (!guru[0]) return c.json({ success: false, error: 'Guru not found' }, 404);
    await sql`DELETE FROM guru_mapel WHERE "guruId" = ${id}`;
    await sql`DELETE FROM guru_kelas WHERE "guruId" = ${id}`;
    await sql`DELETE FROM guru WHERE id = ${id}`;
    if (guru[0].userId) await sql`DELETE FROM users WHERE id = ${guru[0].userId}`;
    return c.json({ success: true, message: 'Guru deleted' });
  } catch (error) {
    console.error('Error deleting guru:', error);
    return c.json({ success: false, error: 'Failed to delete guru' }, 500);
  }
});

// ============================================
// MAPEL ROUTES
// ============================================

admin.get('/mapel', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const mapelList = await sql`
      SELECT m.*, (SELECT COUNT(*) FROM guru_mapel WHERE "mapelId" = m.id) as guru_count
      FROM mata_pelajaran m WHERE m."schoolId" = ${user.schoolId} ORDER BY m.nama ASC
    `;
    return c.json({
      success: true,
      data: mapelList.map((m: any) => ({
        id: m.id, nama: m.nama, kode: m.kode, deskripsi: m.deskripsi, jumlahGuru: parseInt(m.guru_count || '0'),
      })),
    });
  } catch (error) {
    console.error('Error fetching mapel:', error);
    return c.json({ success: false, error: 'Failed to fetch mapel' }, 500);
  }
});

const createMapelSchema = z.object({ nama: z.string().min(1), kode: z.string().optional(), deskripsi: z.string().optional() });

admin.post('/mapel', requireRole('ADMIN', 'SUPERADMIN'), zValidator('json', createMapelSchema), async (c) => {
  try {
    const user = c.get('user');
    const body = c.req.valid('json');
    const tierCheck = await sql`
      SELECT t."maxMapel" as max, (SELECT COUNT(*) FROM mata_pelajaran WHERE "schoolId" = ${user.schoolId}) as current
      FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${user.schoolId}
    `;
    if (tierCheck[0] && parseInt(tierCheck[0].current) >= tierCheck[0].max) {
      return c.json({ success: false, error: 'Batas maksimal mapel tercapai' }, 403);
    }
    const result = await sql`
      INSERT INTO mata_pelajaran (id, "schoolId", nama, kode, deskripsi, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${user.schoolId}, ${body.nama}, ${body.kode || null}, ${body.deskripsi || null}, NOW(), NOW()) RETURNING *
    `;
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error creating mapel:', error);
    return c.json({ success: false, error: 'Failed to create mapel' }, 500);
  }
});

admin.put('/mapel/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await sql`
      UPDATE mata_pelajaran SET nama = ${body.nama}, kode = ${body.kode || null}, deskripsi = ${body.deskripsi || null}, "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${user.schoolId} RETURNING *
    `;
    if (!result[0]) return c.json({ success: false, error: 'Mapel tidak ditemukan' }, 404);
    return c.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Error updating mapel:', error);
    return c.json({ success: false, error: 'Failed to update mapel' }, 500);
  }
});

admin.delete('/mapel/:id', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    await sql`DELETE FROM mata_pelajaran WHERE id = ${id} AND "schoolId" = ${user.schoolId}`;
    return c.json({ success: true, message: 'Mapel deleted' });
  } catch (error) {
    console.error('Error deleting mapel:', error);
    return c.json({ success: false, error: 'Failed to delete mapel' }, 500);
  }
});

// ============================================
// DASHBOARD ROUTES
// ============================================

admin.get('/dashboard/stats', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const [siswaCount, guruCount, kelasCount, ujianCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM siswa WHERE "schoolId" = ${user.schoolId}`,
      sql`SELECT COUNT(*) as count FROM guru WHERE "schoolId" = ${user.schoolId}`,
      sql`SELECT COUNT(*) as count FROM kelas WHERE "schoolId" = ${user.schoolId}`,
      sql`SELECT COUNT(*) as count FROM ujian WHERE "schoolId" = ${user.schoolId} AND status = 'aktif'`,
    ]);
    return c.json({
      success: true,
      data: {
        totalSiswa: parseInt(siswaCount[0]?.count || '0'), totalGuru: parseInt(guruCount[0]?.count || '0'),
        totalKelas: parseInt(kelasCount[0]?.count || '0'), totalUjian: parseInt(ujianCount[0]?.count || '0'),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

admin.get('/dashboard/activity', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const recentUjian = await sql`
      SELECT u.id, u.judul, u.status, u."createdAt", m.nama as mapel_nama, g.nama as guru_nama
      FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId" LEFT JOIN guru g ON g.id = u."guruId"
      WHERE u."schoolId" = ${user.schoolId} ORDER BY u."createdAt" DESC LIMIT 5
    `;
    return c.json({
      success: true,
      data: {
        recentUjian: recentUjian.map((u: any) => ({
          id: u.id, judul: u.judul, mapel: u.mapel_nama, guru: u.guru_nama, status: u.status, createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return c.json({ success: false, error: 'Failed to fetch activity' }, 500);
  }
});

// ============================================
// UJIAN MANAGEMENT (Admin)
// ============================================

// GET /admin/ujian - List all ujian in school
admin.get('/ujian', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const ujianList = await sql`
      SELECT u.*, m.nama as mapel_nama, g.nama as guru_nama,
        (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count,
        (SELECT COUNT(*) FROM ujian_submission WHERE "ujianId" = u.id AND "submittedAt" IS NOT NULL) as submission_count,
        (SELECT COUNT(DISTINCT s.id) FROM siswa s JOIN kelas k ON k.id = s."kelasId" WHERE k.nama = ANY(u.kelas) AND s."schoolId" = u."schoolId") as target_siswa
      FROM ujian u
      LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      LEFT JOIN guru g ON g.id = u."guruId"
      WHERE u."schoolId" = ${user.schoolId}
      ORDER BY u."createdAt" DESC
    `;
    return c.json({
      success: true,
      data: ujianList.map((u: any) => ({
        id: u.id, judul: u.judul, deskripsi: u.deskripsi, mapel: u.mapel_nama, guru: u.guru_nama,
        kelas: u.kelas, startUjian: u.startUjian, endUjian: u.endUjian, status: u.status,
        soalCount: parseInt(u.soal_count || '0'), submissionCount: parseInt(u.submission_count || '0'),
        targetSiswa: parseInt(u.target_siswa || '0'), createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian' }, 500);
  }
});

// GET /admin/ujian/:id/siswa - Get siswa list for an ujian (who has/hasn't taken it)
admin.get('/ujian/:id/siswa', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');

    const ujian = await sql`SELECT * FROM ujian WHERE id = ${ujianId} AND "schoolId" = ${user.schoolId} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian tidak ditemukan' }, 404);

    // Get all siswa in target kelas
    const siswaList = await sql`
      SELECT s.id, s.nama, s.nis, k.nama as kelas_nama,
        us.id as submission_id, us."submittedAt", us.nilai, us."startedAt",
        (SELECT COUNT(*) FROM ujian_susulan WHERE "ujianId" = ${ujianId} AND "siswaId" = s.id AND "isActive" = true) as has_susulan
      FROM siswa s
      JOIN kelas k ON k.id = s."kelasId"
      LEFT JOIN ujian_submission us ON us."ujianId" = ${ujianId} AND us."siswaId" = s.id
      WHERE k.nama = ANY(${ujian[0].kelas}::text[]) AND s."schoolId" = ${user.schoolId}
      ORDER BY k.nama ASC, s.nama ASC
    `;

    return c.json({
      success: true,
      data: {
        ujian: { id: ujian[0].id, judul: ujian[0].judul, startUjian: ujian[0].startUjian, endUjian: ujian[0].endUjian, status: ujian[0].status },
        siswa: siswaList.map((s: any) => ({
          id: s.id, nama: s.nama, nis: s.nis, kelas: s.kelas_nama,
          submissionId: s.submission_id, submittedAt: s.submittedAt, nilai: s.nilai, startedAt: s.startedAt,
          hasSusulan: parseInt(s.has_susulan || '0') > 0,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching ujian siswa:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian siswa' }, 500);
  }
});

// POST /admin/ujian/:id/susulan - Grant susulan access to specific siswa
admin.post('/ujian/:id/susulan', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const body = await c.req.json();
    const { siswaIds, durasiMenit } = body;

    if (!siswaIds || !Array.isArray(siswaIds) || siswaIds.length === 0) {
      return c.json({ success: false, error: 'siswaIds harus diisi' }, 400);
    }

    // Verify ujian exists and has ended
    const ujian = await sql`SELECT * FROM ujian WHERE id = ${ujianId} AND "schoolId" = ${user.schoolId} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian tidak ditemukan' }, 404);

    const now = new Date();
    const endTime = new Date(ujian[0].endUjian);
    if (now < endTime) {
      return c.json({ success: false, error: 'Ujian susulan hanya bisa diberikan untuk ujian yang sudah selesai' }, 400);
    }

    const duration = durasiMenit || 60; // default 60 minutes
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    let successCount = 0;
    for (const siswaId of siswaIds) {
      try {
        // Check if siswa already submitted
        const existing = await sql`SELECT id FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswaId} AND "submittedAt" IS NOT NULL LIMIT 1`;
        if (existing[0]) continue; // skip already submitted

        // Deactivate any existing susulan
        await sql`UPDATE ujian_susulan SET "isActive" = false WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswaId}`;

        // Create susulan record
        await sql`
          INSERT INTO ujian_susulan (id, "ujianId", "siswaId", "schoolId", "grantedBy", "durasiMenit", "expiresAt", "isActive", "createdAt")
          VALUES (gen_random_uuid(), ${ujianId}, ${siswaId}, ${user.schoolId}, ${user.userId}, ${duration}, ${expiresAt.toISOString()}, true, NOW())
        `;
        successCount++;
      } catch (err) {
        console.error('Error granting susulan for siswa:', siswaId, err);
      }
    }

    return c.json({ success: true, message: `Ujian susulan berhasil diberikan ke ${successCount} siswa`, count: successCount });
  } catch (error) {
    console.error('Error granting susulan:', error);
    return c.json({ success: false, error: 'Failed to grant susulan' }, 500);
  }
});

// DELETE /admin/ujian/:ujianId/susulan/:siswaId - Revoke susulan access
admin.delete('/ujian/:ujianId/susulan/:siswaId', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('ujianId');
    const siswaId = c.req.param('siswaId');

    await sql`UPDATE ujian_susulan SET "isActive" = false WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswaId} AND "schoolId" = ${user.schoolId}`;
    return c.json({ success: true, message: 'Akses susulan dicabut' });
  } catch (error) {
    console.error('Error revoking susulan:', error);
    return c.json({ success: false, error: 'Failed to revoke susulan' }, 500);
  }
});

// ============================================
// UJIAN ACCESS CONTROL (Multi-tenant token system)
// ============================================

// GET /admin/ujian-access - Get current token status for this school
admin.get('/ujian-access', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    
    // Get or check existing record for this school
    const result = await sql`SELECT * FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    const accessControl = result[0];
    
    if (!accessControl) {
      return c.json({
        success: true,
        data: {
          isActive: false,
          currentToken: null,
          tokenExpiresAt: null,
          generatedBy: null,
          description: null,
        },
      });
    }
    
    // Check if token is expired
    const now = new Date();
    const isTokenValid = accessControl.tokenExpiresAt && new Date(accessControl.tokenExpiresAt) > now;
    
    return c.json({
      success: true,
      data: {
        isActive: accessControl.isActive && isTokenValid,
        currentToken: isTokenValid ? accessControl.currentToken : null,
        tokenExpiresAt: accessControl.tokenExpiresAt,
        generatedBy: accessControl.generatedBy,
        description: accessControl.description,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian access control:', error);
    return c.json({ success: false, error: 'Failed to fetch access control' }, 500);
  }
});

// POST /admin/ujian-access - Generate new token (active for 30 minutes by default)
admin.post('/ujian-access', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { description, duration } = body;
    
    console.log('Generating token for school:', user.schoolId, 'by user:', user.userId);
    
    // Generate 6-character alphanumeric token
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Set expiry (default 30 minutes)
    const durationMinutes = duration || 30;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    
    console.log('New token:', token, 'duration:', durationMinutes, 'minutes');
    
    // Get or create the record for this school
    // Use PostgreSQL timezone 'Asia/Jakarta' (UTC+7) for Indonesia
    const existing = await sql`SELECT id FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    
    let result;
    if (existing[0]) {
      result = await sql`
        UPDATE ujian_access_control 
        SET "isActive" = true, "currentToken" = ${token}, 
            "tokenGeneratedAt" = (NOW() AT TIME ZONE 'Asia/Jakarta'), 
            "tokenExpiresAt" = (NOW() AT TIME ZONE 'Asia/Jakarta') + INTERVAL '1 minute' * ${durationMinutes}, 
            "generatedBy" = ${user.userId}, 
            description = ${description || null}, "updatedAt" = NOW()
        WHERE "schoolId" = ${user.schoolId} RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO ujian_access_control ("schoolId", "isActive", "currentToken", "tokenGeneratedAt", "tokenExpiresAt", "generatedBy", description, "createdAt", "updatedAt")
        VALUES (${user.schoolId}, true, ${token}, 
                (NOW() AT TIME ZONE 'Asia/Jakarta'), 
                (NOW() AT TIME ZONE 'Asia/Jakarta') + INTERVAL '1 minute' * ${durationMinutes}, 
                ${user.userId}, ${description || null}, NOW(), NOW())
        RETURNING *
      `;
    }
    
    console.log('Token saved, expires at:', result[0]?.tokenExpiresAt);
    
    return c.json({
      success: true,
      data: {
        token,
        expiresAt,
        message: `Token generated successfully. Valid for ${durationMinutes} minutes.`,
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return c.json({ success: false, error: 'Failed to generate token' }, 500);
  }
});

// PUT /admin/ujian-access - Deactivate token
admin.put('/ujian-access', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    
    const existing = await sql`SELECT id FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    
    if (!existing[0]) {
      return c.json({ success: false, error: 'Access control not found' }, 404);
    }
    
    await sql`
      UPDATE ujian_access_control 
      SET "isActive" = false, "currentToken" = NULL, "tokenExpiresAt" = NULL, "updatedAt" = NOW()
      WHERE "schoolId" = ${user.schoolId}
    `;
    
    return c.json({ success: true, message: 'Token deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating token:', error);
    return c.json({ success: false, error: 'Failed to deactivate token' }, 500);
  }
});

// Legacy routes for backward compatibility
admin.get('/ujian/token', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    // EXTRACT(EPOCH) calculates remaining seconds entirely in SQL — no JS Date/timezone issues
    const result = await sql`
      SELECT "isActive", "currentToken",
        EXTRACT(EPOCH FROM ("tokenExpiresAt" - NOW())) as remaining_secs
      FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1
    `;
    const row = result[0];
    if (!row) {
      return c.json({ success: true, data: { isActive: false, currentToken: null, remainingSeconds: 0 } });
    }

    const remainingSecs = row.remaining_secs ? parseFloat(row.remaining_secs) : 0;
    const isActive = row.isActive === true && remainingSecs > 0;

    console.log('Token GET:', { dbIsActive: row.isActive, remainingSecs, isActive });

    // Auto-deactivate if expired
    if (row.isActive === true && remainingSecs <= 0) {
      await sql`UPDATE ujian_access_control SET "isActive" = false WHERE "schoolId" = ${user.schoolId}`;
    }

    return c.json({
      success: true,
      data: {
        isActive,
        currentToken: isActive ? row.currentToken : null,
        remainingSeconds: isActive ? Math.floor(remainingSecs) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching token:', error);
    return c.json({ success: false, error: 'Failed to fetch token' }, 500);
  }
});

admin.post('/ujian/token/generate', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const durationMinutes = body.duration || 5;
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();

    const existing = await sql`SELECT id FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    if (existing[0]) {
      await sql`
        UPDATE ujian_access_control 
        SET "isActive" = true, "currentToken" = ${token}, 
            "tokenExpiresAt" = NOW() + INTERVAL '5 minutes', 
            "updatedAt" = NOW()
        WHERE "schoolId" = ${user.schoolId}
      `;
    } else {
      await sql`
        INSERT INTO ujian_access_control (id, "schoolId", "isActive", "currentToken", "tokenExpiresAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${user.schoolId}, true, ${token}, NOW() + INTERVAL '5 minutes', NOW(), NOW())
      `;
    }

    // Verify what was stored
    const verify = await sql`
      SELECT "tokenExpiresAt", NOW() as server_now,
        EXTRACT(EPOCH FROM ("tokenExpiresAt" - NOW())) as remaining_secs
      FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1
    `;
    console.log('Token GENERATE verify:', JSON.stringify(verify[0]));

    const remainingSeconds = verify[0] ? Math.max(0, Math.floor(parseFloat(verify[0].remaining_secs))) : durationMinutes * 60;

    return c.json({
      success: true,
      data: {
        isActive: true,
        currentToken: token,
        remainingSeconds,
      },
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return c.json({ success: false, error: 'Failed to generate token' }, 500);
  }
});

admin.post('/ujian/token/deactivate', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    await sql`UPDATE ujian_access_control SET "isActive" = false, "updatedAt" = NOW() WHERE "schoolId" = ${user.schoolId}`;
    return c.json({ success: true, message: 'Token deactivated' });
  } catch (error) {
    console.error('Error deactivating token:', error);
    return c.json({ success: false, error: 'Failed to deactivate token' }, 500);
  }
});

// ============================================
// ADMIN PROFILE
// ============================================

// GET /admin/profile - Get admin profile
admin.get('/profile', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const result = await sql`
      SELECT u.id, u.email, u.role, u."isActive", u."createdAt",
        s.nama as "schoolName", si."namaSekolah", si.alamat as "schoolAlamat", si."noTelp" as "schoolNoTelp", si.email as "schoolEmail"
      FROM users u
      LEFT JOIN schools s ON s.id = u."schoolId"
      LEFT JOIN sekolah_info si ON si."schoolId" = u."schoolId"
      WHERE u.id = ${user.userId}
      LIMIT 1
    `;
    if (!result[0]) return c.json({ success: false, error: 'User not found' }, 404);

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM siswa WHERE "schoolId" = ${user.schoolId}) as "totalSiswa",
        (SELECT COUNT(*) FROM guru WHERE "schoolId" = ${user.schoolId}) as "totalGuru",
        (SELECT COUNT(*) FROM kelas WHERE "schoolId" = ${user.schoolId}) as "totalKelas",
        (SELECT COUNT(*) FROM ujian WHERE "schoolId" = ${user.schoolId}) as "totalUjian"
    `;

    return c.json({
      success: true,
      data: {
        id: result[0].id,
        email: result[0].email,
        role: result[0].role,
        schoolName: result[0].namaSekolah || result[0].schoolName || '',
        schoolAlamat: result[0].schoolAlamat || '',
        schoolNoTelp: result[0].schoolNoTelp || '',
        schoolEmail: result[0].schoolEmail || '',
        createdAt: result[0].createdAt,
        stats: {
          totalSiswa: parseInt(stats[0]?.totalSiswa || '0'),
          totalGuru: parseInt(stats[0]?.totalGuru || '0'),
          totalKelas: parseInt(stats[0]?.totalKelas || '0'),
          totalUjian: parseInt(stats[0]?.totalUjian || '0'),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return c.json({ success: false, error: 'Failed to fetch profile' }, 500);
  }
});

// PUT /admin/profile - Update admin profile (school info)
admin.put('/profile', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Update school info
    const existing = await sql`SELECT id FROM sekolah_info WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    if (existing[0]) {
      await sql`
        UPDATE sekolah_info SET 
          "namaSekolah" = COALESCE(${body.schoolName || null}, "namaSekolah"),
          alamat = COALESCE(${body.schoolAlamat || null}, alamat),
          "noTelp" = COALESCE(${body.schoolNoTelp || null}, "noTelp"),
          email = COALESCE(${body.schoolEmail || null}, email),
          "updatedAt" = NOW()
        WHERE "schoolId" = ${user.schoolId}
      `;
    }

    // Update school name
    if (body.schoolName) {
      await sql`UPDATE schools SET nama = ${body.schoolName}, "updatedAt" = NOW() WHERE id = ${user.schoolId}`;
    }

    return c.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return c.json({ success: false, error: 'Failed to update profile' }, 500);
  }
});

// PUT /admin/profile/password - Change admin password
admin.put('/profile/password', requireRole('ADMIN', 'SUPERADMIN'), async (c) => {
  try {
    const user = c.get('user');
    const { oldPassword, newPassword } = await c.req.json();

    if (!oldPassword || !newPassword) {
      return c.json({ success: false, error: 'Password lama dan baru harus diisi' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ success: false, error: 'Password minimal 6 karakter' }, 400);
    }

    const userResult = await sql`SELECT password FROM users WHERE id = ${user.userId} LIMIT 1`;
    if (!userResult[0]) return c.json({ success: false, error: 'User not found' }, 404);

    const isMatch = await bcrypt.compare(oldPassword, userResult[0].password);
    if (!isMatch) {
      return c.json({ success: false, error: 'Password lama tidak cocok' }, 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password = ${hashedPassword}, "updatedAt" = NOW() WHERE id = ${user.userId}`;

    return c.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Error changing password:', error);
    return c.json({ success: false, error: 'Failed to change password' }, 500);
  }
});

export default admin;
