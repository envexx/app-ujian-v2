import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

const admin = new Hono();

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
  jurusan: z.string().optional(), tahunAjaran: z.string().optional(),
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
      INSERT INTO kelas ("schoolId", nama, tingkat, jurusan, "tahunAjaran", "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${body.nama}, ${body.tingkat || null}, ${body.jurusan || null}, ${body.tahunAjaran || null}, NOW(), NOW())
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
      UPDATE kelas SET nama = ${body.nama}, tingkat = ${body.tingkat || null}, jurusan = ${body.jurusan || null},
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
      INSERT INTO users ("schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${autoEmail}, ${defaultPassword}, 'SISWA', true, NOW(), NOW()) RETURNING *
    `;
    const siswa = await sql`
      INSERT INTO siswa ("schoolId", "userId", nis, nisn, nama, "kelasId", "jenisKelamin", "tanggalLahir", alamat, "noTelp", "namaWali", "noTelpWali", "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${newUser[0].id}, ${body.nis}, ${body.nisn}, ${body.nama}, ${body.kelasId}, ${body.jenisKelamin},
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
          INSERT INTO users ("schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
          VALUES (${user.schoolId}, ${autoEmail}, ${defaultPassword}, 'SISWA', true, NOW(), NOW()) RETURNING id
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
          INSERT INTO siswa ("schoolId", "userId", nis, nisn, nama, "kelasId", "jenisKelamin", "tanggalLahir", alamat, "noTelp", "namaWali", "noTelpWali", "createdAt", "updatedAt")
          VALUES (${user.schoolId}, ${newUser[0].id}, ${nis}, ${nisn}, ${nama}, ${kelasId}, ${jenisKelamin},
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
    const guruWithMapel = await Promise.all(guruList.map(async (g: any) => {
      const mapelList = await sql`SELECT m.nama FROM guru_mapel gm JOIN mata_pelajaran m ON m.id = gm."mapelId" WHERE gm."guruId" = ${g.id}`;
      return { id: g.id, nip: g.nipUsername, nama: g.nama, jenisKelamin: g.jenisKelamin, email: g.email, isActive: g.isActive, mapel: mapelList.map((m: any) => m.nama) };
    }));
    return c.json({ success: true, data: guruWithMapel });
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
      INSERT INTO users ("schoolId", email, password, role, "isActive", "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${body.email}, ${defaultPassword}, 'GURU', true, NOW(), NOW()) RETURNING *
    `;
    const newGuru = await sql`
      INSERT INTO guru ("schoolId", "userId", "nipUsername", nama, email, "jenisKelamin", "isActive", "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${newUser[0].id}, ${body.nip}, ${body.nama}, ${body.email}, ${body.jenisKelamin}, true, NOW(), NOW()) RETURNING *
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
      UPDATE guru SET "nipUsername" = ${body.nip || body.nipUsername}, nama = ${body.nama}, "jenisKelamin" = ${body.jenisKelamin}, "updatedAt" = NOW()
      WHERE id = ${id} AND "schoolId" = ${user.schoolId} RETURNING *
    `;
    if (!result[0]) return c.json({ success: false, error: 'Guru tidak ditemukan' }, 404);
    if (body.mapelIds) {
      await sql`DELETE FROM guru_mapel WHERE "guruId" = ${id}`;
      for (const mapelId of body.mapelIds) {
        await sql`INSERT INTO guru_mapel (id, "guruId", "mapelId") VALUES (gen_random_uuid(), ${id}, ${mapelId})`;
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
      INSERT INTO mata_pelajaran ("schoolId", nama, kode, deskripsi, "createdAt", "updatedAt")
      VALUES (${user.schoolId}, ${body.nama}, ${body.kode || null}, ${body.deskripsi || null}, NOW(), NOW()) RETURNING *
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
    const result = await sql`SELECT * FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    return c.json({
      success: true,
      data: result[0] || { isActive: false, currentToken: null, tokenExpiresAt: null },
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
    const duration = body.duration || 60;
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const existing = await sql`SELECT id FROM ujian_access_control WHERE "schoolId" = ${user.schoolId} LIMIT 1`;
    let result;
    if (existing[0]) {
      result = await sql`
        UPDATE ujian_access_control SET "isActive" = true, "currentToken" = ${token}, "tokenExpiresAt" = ${expiresAt.toISOString()}, "updatedAt" = NOW()
        WHERE "schoolId" = ${user.schoolId} RETURNING *
      `;
    } else {
      result = await sql`
        INSERT INTO ujian_access_control ("schoolId", "isActive", "currentToken", "tokenExpiresAt", "createdAt", "updatedAt")
        VALUES (${user.schoolId}, true, ${token}, ${expiresAt.toISOString()}, NOW(), NOW()) RETURNING *
      `;
    }
    return c.json({ success: true, data: result[0] });
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

export default admin;
