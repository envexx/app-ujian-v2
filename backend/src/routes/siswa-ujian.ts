import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const siswaUjian = new Hono();

siswaUjian.use('*', authMiddleware, tenantMiddleware);

// Helper: get siswa by userId with schoolId
async function getSiswa(userId: string) {
  const result = await sql`
    SELECT s.*, k.nama as kelas_nama, u."schoolId"
    FROM siswa s
    JOIN users u ON u.id = s."userId"
    LEFT JOIN kelas k ON k.id = s."kelasId"
    WHERE s."userId" = ${userId} LIMIT 1
  `;
  return result[0];
}

// GET /siswa/dashboard - Dashboard data for siswa
siswaUjian.get('/dashboard', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    // Get ujian stats for this siswa's kelas
    const ujianStats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE u.status = 'aktif' AND ${siswa.kelas_nama} = ANY(u.kelas)) as total_ujian,
        COUNT(us.id) FILTER (WHERE us."siswaId" = ${siswa.id}) as ujian_selesai
      FROM ujian u
      LEFT JOIN ujian_submission us ON us."ujianId" = u.id AND us."siswaId" = ${siswa.id}
      WHERE u."schoolId" = ${siswa.schoolId}
    `;

    // Get average nilai from submissions
    const nilaiStats = await sql`
      SELECT AVG(nilai) as rata_rata
      FROM ujian_submission
      WHERE "siswaId" = ${siswa.id} AND nilai IS NOT NULL
    `;

    const stats = ujianStats[0] || {};
    const rataRata = nilaiStats[0]?.rata_rata;

    return c.json({
      success: true,
      data: {
        siswa: {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,
          nisn: siswa.nisn,
          kelas: siswa.kelas_nama,
          foto: siswa.foto,
        },
        stats: {
          totalUjian: parseInt(stats.total_ujian || '0'),
          ujianSelesai: parseInt(stats.ujian_selesai || '0'),
          rataRataNilai: rataRata ? Math.round(parseFloat(rataRata)) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching siswa dashboard:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard' }, 500);
  }
});

// GET /siswa/ujian - List ujian for siswa
siswaUjian.get('/', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    const now = new Date();
    const ujianList = await sql`
      SELECT u.*, m.nama as mapel_nama,
        (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count
      FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u."schoolId" = ${siswa.schoolId} AND u.status = 'aktif'
        AND ${siswa.kelas_nama} = ANY(u.kelas)
      ORDER BY u."startUjian" DESC
    `;

    const ujianWithSubmissions = await Promise.all(ujianList.map(async (u: any) => {
      const sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${u.id} AND "siswaId" = ${siswa.id} LIMIT 1`;
      const submission = sub[0];
      const examStartTime = new Date(u.startUjian);
      const examEndTime = new Date(u.endUjian);

      let examStatus = 'belum_dimulai';
      let canStart = false;
      if (submission?.submittedAt) { examStatus = 'selesai'; }
      else if (now < examStartTime) { examStatus = 'belum_dimulai'; }
      else if (now >= examStartTime && now <= examEndTime) { examStatus = 'berlangsung'; canStart = true; }
      else if (now > examEndTime) { examStatus = 'berakhir'; }

      return {
        id: u.id, judul: u.judul, deskripsi: u.deskripsi, mapel: u.mapel_nama,
        startUjian: u.startUjian, endUjian: u.endUjian, totalSoal: parseInt(u.soal_count || '0'),
        status: u.status, examStatus, canStart, examStartTime, examEndTime,
        submission: submission ? { id: submission.id, submittedAt: submission.submittedAt, nilai: submission.nilai, status: 'sudah' } : null,
      };
    }));

    return c.json({ success: true, data: { ujian: ujianWithSubmissions } });
  } catch (error) {
    console.error('Error fetching ujian:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian' }, 500);
  }
});

// GET /siswa/ujian/raport - Get raport (all ujian submissions with nilai, grouped by mapel)
// IMPORTANT: This route must be defined BEFORE /:id to avoid being matched as an id
siswaUjian.get('/raport', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    // Get all submissions with ujian info
    const submissions = await sql`
      SELECT us.id, us."ujianId", us."submittedAt", us.nilai,
             u.judul, u."startUjian", u."endUjian",
             m.nama as mapel_nama
      FROM ujian_submission us
      JOIN ujian u ON u.id = us."ujianId"
      LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE us."siswaId" = ${siswa.id} AND us."submittedAt" IS NOT NULL
      ORDER BY m.nama ASC, us."submittedAt" DESC
    `;

    // Group by mapel
    const mapelMap: Record<string, any[]> = {};
    for (const s of submissions) {
      const mapelName = s.mapel_nama || 'Lainnya';
      if (!mapelMap[mapelName]) {
        mapelMap[mapelName] = [];
      }
      mapelMap[mapelName].push({
        id: s.ujianId,
        judul: s.judul,
        tanggal: s.submittedAt,
        nilai: s.nilai,
      });
    }

    // Build raport array grouped by mapel
    const raport = Object.entries(mapelMap).map(([mapel, ujianList]) => {
      const nilaiList = ujianList.filter(u => u.nilai !== null).map(u => u.nilai);
      const rataRata = nilaiList.length > 0 
        ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length) 
        : 0;
      return {
        mapel,
        totalUjian: ujianList.length,
        rataRata,
        ujian: ujianList,
      };
    });

    // Calculate overall stats
    const allNilai = submissions.filter((s: any) => s.nilai !== null).map((s: any) => s.nilai);
    const rataRataKeseluruhan = allNilai.length > 0 
      ? Math.round(allNilai.reduce((a: number, b: number) => a + b, 0) / allNilai.length) 
      : 0;

    return c.json({
      success: true,
      data: {
        siswa: {
          nama: siswa.nama,
          nis: siswa.nis,
          nisn: siswa.nisn,
          kelas: siswa.kelas_nama,
        },
        raport,
        rataRataKeseluruhan,
        totalUjianDinilai: submissions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching raport:', error);
    return c.json({ success: false, error: 'Failed to fetch raport' }, 500);
  }
});

// GET /siswa/ujian/:id - Get ujian detail
siswaUjian.get('/:id', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    const ujianResult = await sql`
      SELECT u.*, m.nama as mapel_nama FROM ujian u
      LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u.id = ${ujianId} AND u."schoolId" = ${siswa.schoolId}
        AND ${siswa.kelas_nama} = ANY(u.kelas) LIMIT 1
    `;
    if (!ujianResult[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);
    const ujian = ujianResult[0];

    const soalList = await sql`
      SELECT id, tipe, pertanyaan, poin, data, urutan FROM soal WHERE "ujianId" = ${ujianId} ORDER BY urutan ASC
    `;

    const subResult = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    const submission = subResult[0];

    const now = new Date();
    const examStartTime = new Date(ujian.startUjian);
    const examEndTime = new Date(ujian.endUjian);

    let canStart = false;
    let accessMessage = '';
    if (submission?.submittedAt) { accessMessage = 'Anda sudah mengerjakan ujian ini'; }
    else if (now < examStartTime) { accessMessage = 'Ujian belum dimulai'; }
    else if (now > examEndTime) { accessMessage = 'Waktu ujian sudah berakhir'; }
    else { canStart = true; }

    let timeRemaining = 0;
    if (submission?.startedAt && !submission.submittedAt) {
      const elapsed = Math.floor((now.getTime() - new Date(submission.startedAt).getTime()) / 1000);
      const duration = Math.floor((examEndTime.getTime() - examStartTime.getTime()) / 1000);
      timeRemaining = Math.max(0, duration - elapsed);
    } else if (canStart) {
      timeRemaining = Math.floor((examEndTime.getTime() - now.getTime()) / 1000);
    }

    // Remove answer keys from soal data for security
    const sanitizedSoal = soalList.map((s: any) => {
      const data = typeof s.data === 'string' ? JSON.parse(s.data) : s.data;
      if (s.tipe === 'PILIHAN_GANDA' && data?.options) {
        return { ...s, data: { ...data, options: data.options.map((opt: any) => ({ id: opt.id, text: opt.text })) } };
      }
      if (s.tipe === 'PENCOCOKAN' && data) {
        return { ...s, data: { itemKiri: data.itemKiri, itemKanan: data.itemKanan } };
      }
      if (s.tipe === 'BENAR_SALAH') { return { ...s, data: {} }; }
      return s;
    });

    return c.json({
      success: true,
      data: {
        ujian: { id: ujian.id, judul: ujian.judul, deskripsi: ujian.deskripsi, mapel: ujian.mapel_nama, startUjian: ujian.startUjian, endUjian: ujian.endUjian, shuffleQuestions: ujian.shuffleQuestions, showScore: ujian.showScore },
        soal: sanitizedSoal, canStart, accessMessage, timeRemaining,
        submission: submission ? { id: submission.id, startedAt: submission.startedAt, submittedAt: submission.submittedAt, nilai: submission.nilai } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching ujian detail:', error);
    return c.json({ success: false, error: 'Failed to fetch ujian' }, 500);
  }
});

// POST /siswa/ujian/validate-token
siswaUjian.post('/validate-token', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const { token } = await c.req.json();
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    console.log('Validating token for school:', siswa.schoolId, 'token:', token);

    const ac = await sql`SELECT * FROM ujian_access_control WHERE "schoolId" = ${siswa.schoolId} LIMIT 1`;
    
    if (!ac[0]) {
      console.log('No access control record found for school:', siswa.schoolId);
      return c.json({ success: false, error: 'Token akses belum diaktifkan oleh admin' }, 400);
    }
    
    console.log('Access control found:', { 
      isActive: ac[0].isActive, 
      currentToken: ac[0].currentToken, 
      tokenExpiresAt: ac[0].tokenExpiresAt 
    });

    // Case-insensitive token comparison
    if (!ac[0].currentToken || ac[0].currentToken.toUpperCase() !== token.toUpperCase()) {
      return c.json({ success: false, error: 'Token tidak valid' }, 400);
    }

    if (!ac[0].isActive) {
      return c.json({ success: false, error: 'Token tidak aktif' }, 400);
    }
    
    // Get current time in Indonesia timezone from database
    const nowResult = await sql`SELECT (NOW() AT TIME ZONE 'Asia/Jakarta') as now_jakarta`;
    const nowJakarta = new Date(nowResult[0].now_jakarta);
    const tokenExpires = new Date(ac[0].tokenExpiresAt);
    
    console.log('Time comparison - Now (Jakarta):', nowJakarta.toISOString(), 'Token expires:', tokenExpires.toISOString());
    
    if (!ac[0].tokenExpiresAt || tokenExpires < nowJakarta) {
      return c.json({ success: false, error: 'Token sudah kadaluarsa' }, 400);
    }
    
    return c.json({ success: true, message: 'Token valid' });
  } catch (error) {
    console.error('Error validating token:', error);
    return c.json({ success: false, error: 'Failed to validate token' }, 500);
  }
});

// GET /siswa/ujian/:id/time-remaining
siswaUjian.get('/:id/time-remaining', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    const ujian = await sql`SELECT * FROM ujian WHERE id = ${ujianId} AND "schoolId" = ${siswa.schoolId} LIMIT 1`;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    const now = new Date();
    const examEndTime = new Date(ujian[0].endUjian);
    
    // If no submission or already submitted, return special status
    if (!sub[0]?.startedAt) {
      // Calculate time remaining from exam schedule (not started yet)
      const timeRemaining = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));
      return c.json({ success: true, data: { timeRemaining, isExpired: false, notStarted: true } });
    }
    
    if (sub[0].submittedAt) {
      return c.json({ success: true, data: { timeRemaining: 0, isExpired: true, alreadySubmitted: true } });
    }
    
    const timeRemaining = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));
    const isExpired = timeRemaining <= 0;
    return c.json({ success: true, data: { timeRemaining, isExpired, notStarted: false, alreadySubmitted: false } });
  } catch (error) {
    console.error('Error getting time remaining:', error);
    return c.json({ success: false, error: 'Failed to get time remaining' }, 500);
  }
});

// POST /siswa/ujian/:id/jawab - Submit answer
siswaUjian.post('/:id/jawab', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const { soalId, jawaban } = await c.req.json();
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    // Multi-tenant security: Verify ujian belongs to same school as siswa
    const ujianCheck = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "schoolId" = ${siswa.schoolId} LIMIT 1`;
    if (!ujianCheck[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    // Get or create submission
    let sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    if (!sub[0]) {
      sub = await sql`
        INSERT INTO ujian_submission (id, "ujianId", "siswaId", "startedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${ujianId}, ${siswa.id}, NOW(), NOW(), NOW()) RETURNING *
      `;
    }
    if (sub[0].submittedAt) return c.json({ success: false, error: 'Ujian sudah dikumpulkan' }, 400);

    // Ensure jawaban is always valid JSON for JSONB column
    let jawabanJson: string;
    if (typeof jawaban === 'string') {
      // If it's a plain string (like URL), wrap it in an object
      jawabanJson = JSON.stringify({ value: jawaban });
    } else if (typeof jawaban === 'object' && jawaban !== null) {
      jawabanJson = JSON.stringify(jawaban);
    } else {
      jawabanJson = JSON.stringify({ value: jawaban });
    }
    
    // Upsert jawaban
    const existing = await sql`SELECT id FROM ujian_jawaban WHERE "submissionId" = ${sub[0].id} AND "soalId" = ${soalId} LIMIT 1`;
    if (existing[0]) {
      await sql`UPDATE ujian_jawaban SET jawaban = ${jawabanJson}::jsonb, "updatedAt" = NOW() WHERE id = ${existing[0].id}`;
    } else {
      await sql`INSERT INTO ujian_jawaban (id, "submissionId", "soalId", jawaban, "createdAt", "updatedAt") VALUES (gen_random_uuid(), ${sub[0].id}, ${soalId}, ${jawabanJson}::jsonb, NOW(), NOW())`;
    }
    return c.json({ success: true, message: 'Jawaban tersimpan' });
  } catch (error) {
    console.error('Error saving answer:', error);
    return c.json({ success: false, error: 'Failed to save answer' }, 500);
  }
});

// POST /siswa/ujian/:id/submit - Submit ujian
siswaUjian.post('/:id/submit', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const { answers } = await c.req.json();
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    // Multi-tenant security: Verify ujian belongs to same school as siswa
    const ujianCheck = await sql`SELECT id FROM ujian WHERE id = ${ujianId} AND "schoolId" = ${siswa.schoolId} LIMIT 1`;
    if (!ujianCheck[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    let sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    if (!sub[0]) {
      sub = await sql`INSERT INTO ujian_submission (id, "ujianId", "siswaId", "startedAt", "createdAt", "updatedAt") VALUES (gen_random_uuid(), ${ujianId}, ${siswa.id}, NOW(), NOW(), NOW()) RETURNING *`;
    }
    if (sub[0].submittedAt) return c.json({ success: false, error: 'Ujian sudah dikumpulkan' }, 400);

    // Save remaining answers using upsert (ON CONFLICT)
    if (answers) {
      for (const [soalId, jawaban] of Object.entries(answers)) {
        // Ensure jawaban is always valid JSON for JSONB column
        let jawabanJson: string;
        if (typeof jawaban === 'string') {
          jawabanJson = JSON.stringify({ value: jawaban });
        } else if (typeof jawaban === 'object' && jawaban !== null) {
          jawabanJson = JSON.stringify(jawaban);
        } else {
          jawabanJson = JSON.stringify({ value: jawaban });
        }
        
        await sql`
          INSERT INTO ujian_jawaban (id, "submissionId", "soalId", jawaban, "createdAt", "updatedAt") 
          VALUES (gen_random_uuid(), ${sub[0].id}, ${soalId}, ${jawabanJson}::jsonb, NOW(), NOW())
          ON CONFLICT ("submissionId", "soalId") 
          DO UPDATE SET jawaban = ${jawabanJson}::jsonb, "updatedAt" = NOW()
        `;
      }
    }

    // Calculate score
    const soalList = await sql`SELECT * FROM soal WHERE "ujianId" = ${ujianId}`;
    const jawabanList = await sql`SELECT * FROM ujian_jawaban WHERE "submissionId" = ${sub[0].id}`;

    let totalNilai = 0;
    let totalPoin = 0;

    for (const soal of soalList) {
      totalPoin += soal.poin;
      const jawaban = jawabanList.find((j: any) => j.soalId === soal.id);
      if (jawaban) {
        const data = typeof soal.data === 'string' ? JSON.parse(soal.data) : soal.data;
        
        // Extract actual answer value from JSONB - could be { jawaban: "..." }, { value: "..." }, or direct value
        let jawabanRaw = jawaban.jawaban;
        if (typeof jawabanRaw === 'string') {
          try { jawabanRaw = JSON.parse(jawabanRaw); } catch (e) { /* keep as string */ }
        }
        const jawabanValue = jawabanRaw?.jawaban ?? jawabanRaw?.value ?? jawabanRaw;
        
        console.log(`Scoring soal ${soal.id} (${soal.tipe}): jawaban =`, jawabanValue, 'raw =', jawabanRaw);

        if (soal.tipe === 'PILIHAN_GANDA') {
          const correctOption = data.options?.find((opt: any) => opt.isCorrect);
          console.log('PG correct option:', correctOption?.id, 'siswa jawab:', jawabanValue);
          if (correctOption && String(jawabanValue) === String(correctOption.id)) {
            totalNilai += soal.poin;
            await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
          } else {
            await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
          }
        } else if (soal.tipe === 'BENAR_SALAH') {
          // Kunci jawaban disimpan di data.kunciJawaban (boolean)
          const correctAnswer = data.kunciJawaban === true || data.kunciJawaban === 'true';
          
          // Siswa jawaban could be: true, false, 'true', 'false', 1, 0, or inside object
          let siswaJawab: boolean;
          if (typeof jawabanValue === 'boolean') {
            siswaJawab = jawabanValue;
          } else if (typeof jawabanValue === 'string') {
            siswaJawab = jawabanValue.toLowerCase() === 'true';
          } else if (typeof jawabanValue === 'number') {
            siswaJawab = jawabanValue === 1;
          } else {
            siswaJawab = false;
          }
          
          console.log('BS kunci jawaban:', data.kunciJawaban, 'correct:', correctAnswer, 'siswa jawab:', siswaJawab, 'raw:', jawabanValue);
          
          if (correctAnswer === siswaJawab) {
            totalNilai += soal.poin;
            await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
          } else {
            await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
          }
        } else if (soal.tipe === 'ISIAN_SINGKAT') {
          // Kunci jawaban disimpan di data.kunciJawaban (array of strings)
          const correctAnswers = data.kunciJawaban || [];
          const jawabanStr = String(jawabanValue).toLowerCase().trim();
          const caseSensitive = data.caseSensitive === true;
          
          let isCorrect = false;
          if (caseSensitive) {
            isCorrect = correctAnswers.some((ans: string) => String(ans).trim() === String(jawabanValue).trim());
          } else {
            isCorrect = correctAnswers.some((ans: string) => String(ans).toLowerCase().trim() === jawabanStr);
          }
          
          console.log('Isian kunci jawaban:', correctAnswers, 'siswa jawab:', jawabanStr, 'caseSensitive:', caseSensitive, 'isCorrect:', isCorrect);
          
          if (isCorrect) {
            totalNilai += soal.poin;
            await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
          } else {
            await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
          }
        } else if (soal.tipe === 'PENCOCOKAN') {
          // Kunci jawaban disimpan di data.jawaban (mapping { kiriId: kananId })
          const correctMapping = data.jawaban || {};
          let siswaMapping = jawabanValue;
          if (typeof siswaMapping === 'string') {
            try { siswaMapping = JSON.parse(siswaMapping); } catch (e) { siswaMapping = {}; }
          }
          
          let correctCount = 0;
          let totalPairs = Object.keys(correctMapping).length;
          
          console.log('Pencocokan kunci:', correctMapping, 'siswa jawab:', siswaMapping);
          
          for (const [kiriId, kananId] of Object.entries(correctMapping)) {
            if (siswaMapping && siswaMapping[kiriId] === kananId) {
              correctCount++;
            }
          }
          
          console.log('Pencocokan correct:', correctCount, '/', totalPairs);
          
          // Partial scoring for pencocokan
          const poinPerPair = totalPairs > 0 ? soal.poin / totalPairs : 0;
          const nilaiPencocokan = Math.round(correctCount * poinPerPair);
          totalNilai += nilaiPencocokan;
          
          const isAllCorrect = correctCount === totalPairs;
          await sql`UPDATE ujian_jawaban SET "isCorrect" = ${isAllCorrect}, nilai = ${nilaiPencocokan} WHERE id = ${jawaban.id}`;
        }
        // ESSAY tidak di-auto grade
      }
    }

    const finalNilai = totalPoin > 0 ? Math.round((totalNilai / totalPoin) * 100) : 0;
    await sql`UPDATE ujian_submission SET "submittedAt" = NOW(), nilai = ${finalNilai} WHERE id = ${sub[0].id}`;

    return c.json({ success: true, message: 'Ujian berhasil dikumpulkan', data: { nilai: finalNilai } });
  } catch (error) {
    console.error('Error submitting ujian:', error);
    return c.json({ success: false, error: 'Failed to submit ujian' }, 500);
  }
});

// GET /siswa/ujian/:id/hasil - Get ujian result with soal and jawaban details
siswaUjian.get('/:id/hasil', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    // Multi-tenant security: Verify ujian belongs to same school as siswa
    const ujian = await sql`
      SELECT u.id, u.judul, u."showScore", m.nama as mapel_nama
      FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u.id = ${ujianId} AND u."schoolId" = ${siswa.schoolId} LIMIT 1
    `;
    if (!ujian[0]) return c.json({ success: false, error: 'Ujian not found' }, 404);

    const sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    if (!sub[0]) return c.json({ success: false, error: 'Submission not found' }, 404);
    
    // Get all soal for this ujian
    const soalList = await sql`
      SELECT id, tipe, pertanyaan, poin, data, urutan 
      FROM soal WHERE "ujianId" = ${ujianId} ORDER BY urutan ASC
    `;
    
    // Get all jawaban for this submission
    const jawabanList = await sql`
      SELECT id, "soalId", jawaban, nilai, "isCorrect", feedback 
      FROM ujian_jawaban WHERE "submissionId" = ${sub[0].id}
    `;
    
    // Build jawaban details map
    const jawabanDetails: Record<string, any> = {};
    const answers: Record<string, any> = {};
    
    for (const j of jawabanList) {
      jawabanDetails[j.soalId] = {
        id: j.id,
        jawaban: j.jawaban,
        nilai: j.nilai,
        isCorrect: j.isCorrect,
        feedback: j.feedback,
      };
      answers[j.soalId] = j.jawaban;
    }

    return c.json({
      success: true,
      data: {
        ujian: { id: ujian[0].id, judul: ujian[0].judul, mapel: ujian[0].mapel_nama, showScore: ujian[0].showScore },
        submission: { 
          id: sub[0].id, 
          submittedAt: sub[0].submittedAt, 
          nilai: ujian[0].showScore ? sub[0].nilai : null,
          status: sub[0].submittedAt ? 'submitted' : 'in_progress',
        },
        soal: soalList.map((s: any) => ({
          id: s.id,
          tipe: s.tipe,
          pertanyaan: s.pertanyaan,
          poin: s.poin,
          data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data,
          urutan: s.urutan,
        })),
        answers,
        jawabanDetails,
        totalSoal: soalList.length,
        totalDijawab: jawabanList.length,
      },
    });
  } catch (error) {
    console.error('Error fetching hasil:', error);
    return c.json({ success: false, error: 'Failed to fetch hasil' }, 500);
  }
});

export default siswaUjian;
