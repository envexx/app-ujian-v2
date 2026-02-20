import { Hono } from 'hono';
import type { HonoEnv } from '../env';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql, getJakartaNow } from '../lib/db';
import { authMiddleware, requireRole, tenantMiddleware } from '../middleware/auth';

const siswaUjian = new Hono<HonoEnv>();

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

    const ujianList = await sql`
      SELECT u.*, m.nama as mapel_nama,
        (SELECT COUNT(*) FROM soal WHERE "ujianId" = u.id) as soal_count
      FROM ujian u LEFT JOIN mata_pelajaran m ON m.id = u."mapelId"
      WHERE u."schoolId" = ${siswa.schoolId} AND u.status = 'aktif'
        AND ${siswa.kelas_nama} = ANY(u.kelas)
      ORDER BY u."startUjian" DESC
    `;

    const now = getJakartaNow();
    const ujianWithSubmissions = await Promise.all(ujianList.map(async (u: any) => {
      const sub = await sql`SELECT * FROM ujian_submission WHERE "ujianId" = ${u.id} AND "siswaId" = ${siswa.id} LIMIT 1`;
      const submission = sub[0];
      const examStartTime = new Date(u.startUjian);
      const examEndTime = new Date(u.endUjian);

      let examStatus = 'belum_dimulai';
      let canStart = false;
      let isSusulan = false;
      if (submission?.submittedAt) { examStatus = 'selesai'; }
      else if (now < examStartTime) { examStatus = 'belum_dimulai'; }
      else if (now >= examStartTime && now <= examEndTime) { examStatus = 'berlangsung'; canStart = true; }
      else if (now > examEndTime) {
        // Check for susulan access
        const susulan = await sql`SELECT * FROM ujian_susulan WHERE "ujianId" = ${u.id} AND "siswaId" = ${siswa.id} AND "isActive" = true AND "expiresAt" > NOW() AT TIME ZONE 'Asia/Jakarta' LIMIT 1`;
        if (susulan[0]) {
          examStatus = 'susulan';
          canStart = true;
          isSusulan = true;
        } else {
          examStatus = 'berakhir';
        }
      }

      return {
        id: u.id, judul: u.judul, deskripsi: u.deskripsi, mapel: u.mapel_nama,
        startUjian: u.startUjian, endUjian: u.endUjian, totalSoal: parseInt(u.soal_count || '0'),
        status: u.status, examStatus, canStart, isSusulan, examStartTime, examEndTime,
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

    const now = getJakartaNow();
    const examStartTime = new Date(ujian.startUjian);
    const examEndTime = new Date(ujian.endUjian);

    let canStart = false;
    let accessMessage = '';
    let isSusulan = false;
    let susulanExpiresAt: Date | null = null;
    if (submission?.submittedAt) { accessMessage = 'Anda sudah mengerjakan ujian ini'; }
    else if (now < examStartTime) { accessMessage = 'Ujian belum dimulai'; }
    else if (now > examEndTime) {
      // Check for susulan access
      const susulan = await sql`SELECT * FROM ujian_susulan WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} AND "isActive" = true AND "expiresAt" > NOW() AT TIME ZONE 'Asia/Jakarta' LIMIT 1`;
      if (susulan[0]) {
        canStart = true;
        isSusulan = true;
        susulanExpiresAt = new Date(susulan[0].expiresAt);
      } else {
        accessMessage = 'Waktu ujian sudah berakhir';
      }
    }
    else { canStart = true; }

    let timeRemaining = 0;
    if (submission?.startedAt && !submission.submittedAt) {
      const elapsed = Math.floor((now.getTime() - new Date(submission.startedAt).getTime()) / 1000);
      if (isSusulan && susulanExpiresAt) {
        timeRemaining = Math.max(0, Math.floor((susulanExpiresAt.getTime() - now.getTime()) / 1000));
      } else {
        const duration = Math.floor((examEndTime.getTime() - examStartTime.getTime()) / 1000);
        timeRemaining = Math.max(0, duration - elapsed);
      }
    } else if (canStart) {
      if (isSusulan && susulanExpiresAt) {
        timeRemaining = Math.max(0, Math.floor((susulanExpiresAt.getTime() - now.getTime()) / 1000));
      } else {
        timeRemaining = Math.floor((examEndTime.getTime() - now.getTime()) / 1000);
      }
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
        ujian: { id: ujian.id, judul: ujian.judul, deskripsi: ujian.deskripsi, mapel: ujian.mapel_nama, startUjian: ujian.startUjian, endUjian: ujian.endUjian, shuffleQuestions: ujian.shuffleQuestions, showScore: ujian.showScore, jumlahSoal: soalList.length },
        soal: sanitizedSoal, canStart, isSusulan, accessMessage, timeRemaining,
        examStatus: submission?.submittedAt ? 'selesai' : (canStart ? (isSusulan ? 'susulan' : 'berlangsung') : (now > examEndTime ? 'berakhir' : 'belum_dimulai')),
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

    // Use EXTRACT(EPOCH) to check token expiry entirely in SQL — no timezone issues
    const ac = await sql`
      SELECT "isActive", "currentToken",
        EXTRACT(EPOCH FROM ("tokenExpiresAt" - NOW())) as remaining_secs
      FROM ujian_access_control WHERE "schoolId" = ${siswa.schoolId} LIMIT 1
    `;
    
    if (!ac[0]) {
      return c.json({ success: false, error: 'Token akses belum diaktifkan oleh admin' }, 400);
    }

    if (!ac[0].isActive) {
      return c.json({ success: false, error: 'Token tidak aktif' }, 400);
    }

    // Case-insensitive token comparison
    if (!ac[0].currentToken || ac[0].currentToken.toUpperCase() !== token.toUpperCase()) {
      return c.json({ success: false, error: 'Token tidak valid' }, 400);
    }
    
    // Check expiry using EXTRACT(EPOCH) — computed entirely in DB, no timezone mismatch possible
    const remainingSecs = ac[0].remaining_secs ? parseFloat(ac[0].remaining_secs) : 0;
    console.log('Token validation: remainingSecs =', remainingSecs);
    
    if (remainingSecs <= 0) {
      await sql`UPDATE ujian_access_control SET "isActive" = false WHERE "schoolId" = ${siswa.schoolId}`;
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
    const now = getJakartaNow();
    const examEndTime = new Date(ujian[0].endUjian);
    
    // Check for susulan access
    const susulan = await sql`SELECT * FROM ujian_susulan WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} AND "isActive" = true AND "expiresAt" > NOW() AT TIME ZONE 'Asia/Jakarta' LIMIT 1`;
    const effectiveEndTime = susulan[0] ? new Date(susulan[0].expiresAt) : examEndTime;
    
    // If no submission or already submitted, return special status
    if (!sub[0]?.startedAt) {
      const timeRemaining = Math.max(0, Math.floor((effectiveEndTime.getTime() - now.getTime()) / 1000));
      return c.json({ success: true, data: { timeRemaining, isExpired: timeRemaining <= 0, notStarted: true } });
    }
    
    if (sub[0].submittedAt) {
      return c.json({ success: true, data: { timeRemaining: 0, isExpired: true, alreadySubmitted: true } });
    }
    
    const timeRemaining = Math.max(0, Math.floor((effectiveEndTime.getTime() - now.getTime()) / 1000));
    const isExpired = timeRemaining <= 0;
    return c.json({ success: true, data: { timeRemaining, isExpired, notStarted: false, alreadySubmitted: false } });
  } catch (error) {
    console.error('Error getting time remaining:', error);
    return c.json({ success: false, error: 'Failed to get time remaining' }, 500);
  }
});

// GET /siswa/ujian/:id/answers - Get existing answers for in-progress exam
siswaUjian.get('/:id/answers', requireRole('SISWA'), async (c) => {
  try {
    const user = c.get('user');
    const ujianId = c.req.param('id');
    const siswa = await getSiswa(user.userId);
    if (!siswa) return c.json({ success: false, error: 'Siswa not found' }, 404);

    const sub = await sql`SELECT id FROM ujian_submission WHERE "ujianId" = ${ujianId} AND "siswaId" = ${siswa.id} LIMIT 1`;
    if (!sub[0]) return c.json({ success: true, data: { answers: {} } });

    const jawabanList = await sql`SELECT "soalId", jawaban FROM ujian_jawaban WHERE "submissionId" = ${sub[0].id}`;
    const answers: Record<string, any> = {};
    for (const j of jawabanList) {
      answers[j.soalId] = j.jawaban;
    }
    return c.json({ success: true, data: { answers } });
  } catch (error) {
    console.error('Error fetching answers:', error);
    return c.json({ success: false, error: 'Failed to fetch answers' }, 500);
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

    // Store jawaban as-is in JSONB — any valid JSON value works (string, boolean, object, null)
    const jawabanJson = JSON.stringify(jawaban);
    
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
        // Store jawaban as-is — no wrapping in {value: x}
        const jawabanJson = JSON.stringify(jawaban);
        
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

    let totalNilaiAutoGrade = 0;
    let totalPoinAutoGrade = 0;
    let hasEssay = false;

    // Helper: deeply extract the actual answer value from JSONB wrappers
    // DB stores: {value: "A"} or {jawaban: "A"} or {text:"...", photos:[...]} or direct value
    function extractJawabanValue(raw: any): any {
      if (raw === null || raw === undefined) return raw;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return raw; }
      }
      // Unwrap {value: x} or {jawaban: x} — but NOT complex objects like {text, photos} or matching maps
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        const keys = Object.keys(raw);
        if (keys.length === 1 && keys[0] === 'value') return raw.value;
        if (keys.length === 1 && keys[0] === 'jawaban') return raw.jawaban;
      }
      return raw;
    }

    for (const soal of soalList) {
      const jawaban = jawabanList.find((j: any) => j.soalId === soal.id);
      const data = typeof soal.data === 'string' ? JSON.parse(soal.data) : soal.data;

      if (soal.tipe === 'ESSAY') {
        // Essay is NEVER auto-graded — mark as pending for guru review
        hasEssay = true;
        if (jawaban) {
          await sql`UPDATE ujian_jawaban SET "isCorrect" = null, nilai = null WHERE id = ${jawaban.id}`;
        }
        continue;
      }

      // Auto-gradable types count toward auto-score
      totalPoinAutoGrade += soal.poin;

      if (!jawaban) continue;

      const jawabanValue = extractJawabanValue(jawaban.jawaban);
      console.log(`Scoring soal ${soal.id} (${soal.tipe}): jawabanValue =`, jawabanValue);

      if (soal.tipe === 'PILIHAN_GANDA') {
        // Guru stores: { opsi: [{label:'A', text:'...'}, ...], kunciJawaban: 'A' }
        // OR legacy: { options: [{id, text, isCorrect}] }
        let correctAnswer: string | null = null;
        if (data.kunciJawaban !== undefined) {
          correctAnswer = String(data.kunciJawaban);
        } else if (data.options) {
          const correctOpt = data.options.find((opt: any) => opt.isCorrect);
          correctAnswer = correctOpt ? String(correctOpt.id) : null;
        }

        const siswaJawab = String(jawabanValue);
        console.log('PG kunci:', correctAnswer, 'siswa:', siswaJawab);

        if (correctAnswer !== null && siswaJawab === correctAnswer) {
          totalNilaiAutoGrade += soal.poin;
          await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
        } else {
          await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
        }
      } else if (soal.tipe === 'BENAR_SALAH') {
        const correctAnswer = data.kunciJawaban === true || data.kunciJawaban === 'true';

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

        console.log('BS kunci:', correctAnswer, 'siswa:', siswaJawab);

        if (correctAnswer === siswaJawab) {
          totalNilaiAutoGrade += soal.poin;
          await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
        } else {
          await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
        }
      } else if (soal.tipe === 'ISIAN_SINGKAT') {
        const correctAnswers = data.kunciJawaban || [];
        const jawabanStr = String(jawabanValue).toLowerCase().trim();
        const caseSensitive = data.caseSensitive === true;

        let isCorrect = false;
        if (caseSensitive) {
          isCorrect = correctAnswers.some((ans: string) => String(ans).trim() === String(jawabanValue).trim());
        } else {
          isCorrect = correctAnswers.some((ans: string) => String(ans).toLowerCase().trim() === jawabanStr);
        }

        console.log('Isian kunci:', correctAnswers, 'siswa:', jawabanStr, 'correct:', isCorrect);

        if (isCorrect) {
          totalNilaiAutoGrade += soal.poin;
          await sql`UPDATE ujian_jawaban SET "isCorrect" = true, nilai = ${soal.poin} WHERE id = ${jawaban.id}`;
        } else {
          await sql`UPDATE ujian_jawaban SET "isCorrect" = false, nilai = 0 WHERE id = ${jawaban.id}`;
        }
      } else if (soal.tipe === 'PENCOCOKAN') {
        const correctMapping = data.jawaban || {};
        let siswaMapping = jawabanValue;
        if (typeof siswaMapping === 'string') {
          try { siswaMapping = JSON.parse(siswaMapping); } catch { siswaMapping = {}; }
        }
        if (siswaMapping?.value && typeof siswaMapping.value === 'object') siswaMapping = siswaMapping.value;

        // Normalize: both kunci and siswa can be {kiriId: "kananId"} or {kiriId: ["kananId"]}
        const normalizePair = (v: any): string => Array.isArray(v) ? v[0] || '' : String(v || '');

        let correctCount = 0;
        const totalPairs = Object.keys(correctMapping).length;

        for (const [kiriId, kananVal] of Object.entries(correctMapping)) {
          const correctKanan = normalizePair(kananVal);
          const siswaKanan = siswaMapping ? normalizePair(siswaMapping[kiriId]) : '';
          if (correctKanan && siswaKanan === correctKanan) correctCount++;
        }

        const poinPerPair = totalPairs > 0 ? soal.poin / totalPairs : 0;
        const nilaiPencocokan = Math.round(correctCount * poinPerPair);
        totalNilaiAutoGrade += nilaiPencocokan;

        const isAllCorrect = correctCount === totalPairs;
        await sql`UPDATE ujian_jawaban SET "isCorrect" = ${isAllCorrect}, nilai = ${nilaiPencocokan} WHERE id = ${jawaban.id}`;
      }
    }

    // If there are essays, set nilai = null (pending guru review)
    // Otherwise calculate final score from auto-gradable types only
    const finalNilai = hasEssay ? null : (totalPoinAutoGrade > 0 ? Math.round((totalNilaiAutoGrade / totalPoinAutoGrade) * 100) : 0);
    await sql`UPDATE ujian_submission SET "submittedAt" = NOW(), nilai = ${finalNilai} WHERE id = ${sub[0].id}`;

    return c.json({ 
      success: true, 
      message: hasEssay ? 'Ujian berhasil dikumpulkan. Nilai essay akan dinilai oleh guru.' : 'Ujian berhasil dikumpulkan', 
      data: { nilai: finalNilai, hasEssay } 
    });
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
      SELECT u.id, u.judul, u."showScore", u.kelas, u."startUjian", u."endUjian", m.nama as mapel_nama
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
    
    // Helper: extract actual value from JSONB wrapper ({value:x}, {jawaban:x})
    function extractValue(raw: any): any {
      if (raw === null || raw === undefined) return raw;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch { return raw; }
      }
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
        const keys = Object.keys(raw);
        if (keys.length === 1 && keys[0] === 'value') return raw.value;
        if (keys.length === 1 && keys[0] === 'jawaban') return raw.jawaban;
      }
      return raw;
    }

    // Re-score all jawaban on the fly to fix old data scored with bugs
    // This ensures old submissions display correctly without needing re-submission
    let totalNilaiAuto = 0;
    let totalPoinAuto = 0;
    let hasEssay = false;

    for (const s of soalList) {
      const data = typeof s.data === 'string' ? JSON.parse(s.data) : s.data;
      const j = jawabanList.find((jj: any) => jj.soalId === s.id);

      if (s.tipe === 'ESSAY') {
        hasEssay = true;
        // Essay: if guru already graded (has feedback or explicit nilai), keep it; otherwise mark pending
        if (j && (j.feedback || (j.nilai !== null && j.nilai !== undefined && j.isCorrect !== null && j.isCorrect !== false))) {
          // Guru has graded — keep existing nilai
        } else if (j) {
          // Not graded yet — fix old data that wrongly set isCorrect=false
          if (j.isCorrect === false && !j.feedback) {
            await sql`UPDATE ujian_jawaban SET "isCorrect" = null, nilai = null WHERE id = ${j.id}`;
            j.isCorrect = null;
            j.nilai = null;
          }
        }
        continue;
      }

      totalPoinAuto += s.poin;
      if (!j) continue;

      const val = extractValue(j.jawaban);
      let isCorrect = false;
      let poin = 0;

      if (s.tipe === 'PILIHAN_GANDA') {
        let correctAnswer: string | null = null;
        if (data.kunciJawaban !== undefined) {
          correctAnswer = String(data.kunciJawaban);
        } else if (data.options) {
          const co = data.options.find((o: any) => o.isCorrect);
          correctAnswer = co ? String(co.id) : null;
        }
        if (correctAnswer !== null && String(val) === correctAnswer) {
          isCorrect = true;
          poin = s.poin;
        }
      } else if (s.tipe === 'BENAR_SALAH') {
        const correct = data.kunciJawaban === true || data.kunciJawaban === 'true';
        let siswa: boolean;
        if (typeof val === 'boolean') siswa = val;
        else if (typeof val === 'string') siswa = val.toLowerCase() === 'true';
        else siswa = false;
        if (correct === siswa) { isCorrect = true; poin = s.poin; }
      } else if (s.tipe === 'ISIAN_SINGKAT') {
        const correctAnswers = data.kunciJawaban || [];
        const jawabanStr = String(val).toLowerCase().trim();
        const caseSensitive = data.caseSensitive === true;
        if (caseSensitive) {
          isCorrect = correctAnswers.some((a: string) => String(a).trim() === String(val).trim());
        } else {
          isCorrect = correctAnswers.some((a: string) => String(a).toLowerCase().trim() === jawabanStr);
        }
        if (isCorrect) poin = s.poin;
      } else if (s.tipe === 'PENCOCOKAN') {
        const correctMapping = data.jawaban || {};
        let siswaMapping = val;
        if (typeof siswaMapping === 'string') { try { siswaMapping = JSON.parse(siswaMapping); } catch { siswaMapping = {}; } }
        if (siswaMapping?.value && typeof siswaMapping.value === 'object') siswaMapping = siswaMapping.value;
        // Normalize: both kunci and siswa can be {kiriId: "kananId"} or {kiriId: ["kananId"]}
        const normPair = (v: any): string => Array.isArray(v) ? v[0] || '' : String(v || '');
        let correctCount = 0;
        const totalPairs = Object.keys(correctMapping).length;
        for (const [k, kVal] of Object.entries(correctMapping)) {
          const correctK = normPair(kVal);
          const siswaK = siswaMapping ? normPair(siswaMapping[k]) : '';
          if (correctK && siswaK === correctK) correctCount++;
        }
        const poinPerPair = totalPairs > 0 ? s.poin / totalPairs : 0;
        poin = Math.round(correctCount * poinPerPair);
        isCorrect = correctCount === totalPairs;
      }

      totalNilaiAuto += poin;

      // Update DB if scoring changed
      if (j.isCorrect !== isCorrect || j.nilai !== poin) {
        await sql`UPDATE ujian_jawaban SET "isCorrect" = ${isCorrect}, nilai = ${poin} WHERE id = ${j.id}`;
        j.isCorrect = isCorrect;
        j.nilai = poin;
      }
    }

    // Recalculate final score
    // Check if all essays have been graded
    let allEssaysGraded = true;
    let totalEssayNilai = 0;
    let totalEssayPoin = 0;
    for (const s of soalList) {
      if (s.tipe === 'ESSAY') {
        totalEssayPoin += s.poin;
        const j = jawabanList.find((jj: any) => jj.soalId === s.id);
        if (j && j.isCorrect !== null && j.isCorrect !== undefined) {
          totalEssayNilai += j.nilai || 0;
        } else {
          allEssaysGraded = false;
        }
      }
    }

    let newNilai: number | null;
    if (hasEssay && !allEssaysGraded) {
      newNilai = null; // Still pending essay grading
    } else {
      const totalPoin = totalPoinAuto + totalEssayPoin;
      const totalNilai = totalNilaiAuto + totalEssayNilai;
      newNilai = totalPoin > 0 ? Math.round((totalNilai / totalPoin) * 100) : 0;
    }
    if (sub[0].nilai !== newNilai) {
      await sql`UPDATE ujian_submission SET nilai = ${newNilai} WHERE id = ${sub[0].id}`;
      sub[0].nilai = newNilai;
    }

    // Build response
    const jawabanDetails: Record<string, any> = {};
    const answers: Record<string, any> = {};
    let hasEssayPending = false;
    
    for (const j of jawabanList) {
      const extracted = extractValue(j.jawaban);
      jawabanDetails[j.soalId] = {
        id: j.id,
        jawaban: extracted,
        nilai: j.nilai,
        isCorrect: j.isCorrect,
        feedback: j.feedback,
      };
      answers[j.soalId] = extracted;
    }

    for (const s of soalList) {
      if (s.tipe === 'ESSAY') {
        const detail = jawabanDetails[s.id];
        if (!detail || detail.isCorrect === null || detail.isCorrect === undefined) {
          hasEssayPending = true;
          break;
        }
      }
    }

    return c.json({
      success: true,
      data: {
        ujian: { id: ujian[0].id, judul: ujian[0].judul, mapel: ujian[0].mapel_nama, kelas: ujian[0].kelas, startUjian: ujian[0].startUjian, endUjian: ujian[0].endUjian, showScore: ujian[0].showScore },
        submission: { 
          id: sub[0].id, 
          submittedAt: sub[0].submittedAt, 
          startedAt: sub[0].startedAt,
          nilai: ujian[0].showScore ? sub[0].nilai : null,
          status: sub[0].submittedAt ? 'submitted' : 'in_progress',
          hasEssayPending,
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
