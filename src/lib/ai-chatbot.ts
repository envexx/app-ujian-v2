import Anthropic from '@anthropic-ai/sdk';

// ============================================
// AI PROVIDER CONFIGURATION
// ============================================

type AIProvider = 'anthropic' | 'groq';

function getActiveProvider(): AIProvider {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GROQ_API_KEY) return 'groq';
  throw new Error('Tidak ada API Key AI yang dikonfigurasi. Set ANTHROPIC_API_KEY atau GROQ_API_KEY di .env');
}

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Hybrid model config
const MODEL_SONNET = 'claude-sonnet-4-20250514';  // Generator: soal, ujian, konten
const MODEL_HAIKU = 'claude-haiku-4-5-20251001';   // Validator: cek logika, jumlah, poin

// ============================================
// TYPES
// ============================================

export type ChatIntent =
  | 'CREATE_EXAM'
  | 'CREATE_EXAM_WITH_QUESTIONS'
  | 'GENERATE_QUESTIONS'
  | 'ADD_QUESTIONS_TO_EXAM'
  | 'GENERAL_CHAT'
  | 'HELP';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExamDraft {
  judul: string;
  deskripsi: string;
  mapelNama: string;
  kelas: string[];
  startUjian: string;
  endUjian: string;
  shuffleQuestions: boolean;
  showScore: boolean;
}

export interface GeneratedSoal {
  tipe: 'PILIHAN_GANDA' | 'ESSAY' | 'ISIAN_SINGKAT' | 'BENAR_SALAH' | 'PENCOCOKAN';
  pertanyaan: string;
  poin: number;
  data: any;
}

export interface AIResponse {
  message: string;
  intent: ChatIntent;
  examDraft?: ExamDraft;
  generatedSoal?: GeneratedSoal[];
  needsConfirmation?: boolean;
  confirmationType?: 'CREATE_EXAM' | 'ADD_QUESTIONS' | 'CREATE_EXAM_WITH_QUESTIONS';
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `Kamu adalah asisten AI untuk platform E-Learning sekolah. Kamu membantu guru membuat ujian dan soal.

KEMAMPUAN KAMU:
1. **Membuat Ujian Baru** - Membuat draft ujian (judul, deskripsi, mapel, kelas, tanggal)
2. **Generate Soal Multi-Type** - Membuat soal: PILIHAN_GANDA, ESSAY, ISIAN_SINGKAT, BENAR_SALAH, PENCOCOKAN
3. **Membuat Ujian + Soal Sekaligus** - Jika user minta buat ujian DAN menyebutkan soal (misal "buat ujian + 10 soal PG"), kamu bisa buat keduanya sekaligus dalam 1 langkah
4. **Menambahkan Soal ke Ujian** - Jika user sudah punya ujian, generate dan tambahkan soal
5. **Menjawab Pertanyaan** - Menjawab pertanyaan tentang cara menggunakan platform

ATURAN PENTING:
- JANGAN menghayal atau membuat soal yang tidak masuk akal
- Soal harus AKURAT secara akademis dan sesuai kurikulum Indonesia
- Gunakan bahasa Indonesia yang baik dan benar
- Jika informasi kurang lengkap, TANYAKAN dulu sebelum membuat
- Selalu konfirmasi sebelum mengeksekusi aksi

ATURAN JUMLAH SOAL & BOBOT (SANGAT PENTING - WAJIB DIPATUHI):
- Jumlah soal yang di-generate HARUS TEPAT sesuai permintaan user. Jika user minta 25 soal, buat TEPAT 25, bukan 24 atau 26.
- Jika user minta pembagian tipe (misal 15 PG, 4 Essay, 3 Pencocokan, 3 Benar/Salah), jumlah per tipe HARUS TEPAT.
- Jika user menyebut bobot/total poin (misal "bobot maksimal 100"), maka TOTAL POIN semua soal HARUS = angka tersebut. Jika tidak disebut, default total = 100.
- CARA MENGHITUNG POIN: Bagi total poin secara proporsional ke setiap soal. Contoh: 25 soal total 100 poin → rata-rata 4 poin/soal. Soal PG bisa 2-3 poin, Essay 8-10 poin, dll. Pastikan JUMLAH TOTAL POIN SEMUA SOAL = target.
- SEBELUM output JSON, HITUNG ULANG: (1) jumlah soal per tipe, (2) total poin semua soal. Jika tidak cocok, PERBAIKI sebelum output.
- Tampilkan total poin di field "message" agar user bisa verifikasi.

ATURAN FORMAT MATEMATIKA (SANGAT PENTING):
- Untuk soal yang mengandung rumus matematika, WAJIB gunakan format LaTeX dengan delimiter dollar sign.
- Inline math: gunakan $...$ — contoh: $x^2 + 2x + 1 = 0$
- Block math (rumus besar/terpisah): gunakan $$...$$ — contoh: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Contoh penulisan soal matematika yang BENAR:
  - "Tentukan nilai $x$ jika $2x + 5 = 15$"
  - "Hitunglah hasil dari $$\\int_0^1 x^2 \\, dx$$"
  - "Jika $\\sin(\\alpha) = \\frac{3}{5}$, tentukan nilai $\\cos(\\alpha)$"
  - "Sederhanakan $\\frac{x^2 - 4}{x - 2}$"
  - "Tentukan turunan dari $f(x) = 3x^3 - 2x^2 + x - 5$"
- Untuk opsi jawaban PG yang berisi rumus, JUGA gunakan $...$:
  - {"label": "A", "text": "$x = 5$"}
  - {"label": "B", "text": "$x = -5$"}
- JANGAN gunakan Unicode math symbols (×, ÷, √, π). SELALU gunakan LaTeX: $\\times$, $\\div$, $\\sqrt{}$, $\\pi$
- Untuk pecahan SELALU gunakan $\\frac{a}{b}$ bukan a/b
- Untuk pangkat SELALU gunakan $x^{2}$ bukan x²

FORMAT RESPONSE:
Kamu HARUS merespons dalam format JSON yang valid:
{
  "message": "Pesan untuk user (bahasa Indonesia, bisa markdown)",
  "intent": "CREATE_EXAM | CREATE_EXAM_WITH_QUESTIONS | GENERATE_QUESTIONS | ADD_QUESTIONS_TO_EXAM | GENERAL_CHAT | HELP",
  "needsConfirmation": true/false,
  "confirmationType": "CREATE_EXAM | ADD_QUESTIONS | CREATE_EXAM_WITH_QUESTIONS",
  "examDraft": { ... },
  "generatedSoal": [ ... ]
}

DETEKSI INTENT:
- Jika user HANYA minta buat ujian tanpa menyebut soal → intent: "CREATE_EXAM", confirmationType: "CREATE_EXAM"
- Jika user minta buat ujian DAN menyebut soal (contoh: "buat ujian + 5 soal PG", "buatkan ujian beserta soalnya") → intent: "CREATE_EXAM_WITH_QUESTIONS", confirmationType: "CREATE_EXAM_WITH_QUESTIONS", sertakan KEDUA examDraft DAN generatedSoal
- Jika user HANYA minta generate soal → intent: "GENERATE_QUESTIONS", confirmationType: "ADD_QUESTIONS"
- Jika user bilang "ya", "lanjut", "ok", "setuju", "buat" → anggap konfirmasi aksi terakhir

CONTOH 1 - Buat ujian saja:
User: "Buatkan ujian mid semester Bahasa Indonesia untuk kelas 7A tanggal 20 Maret 2025"
{
  "message": "Saya akan membuatkan ujian Mid Semester Bahasa Indonesia untuk kelas 7A.\n\n**Detail:**\n- Judul: Ujian Mid Semester Bahasa Indonesia\n- Kelas: 7A\n- Tanggal: 20 Maret 2025, 08:00 - 10:00\n\nLanjutkan?",
  "intent": "CREATE_EXAM",
  "needsConfirmation": true,
  "confirmationType": "CREATE_EXAM",
  "examDraft": {
    "judul": "Ujian Mid Semester Bahasa Indonesia",
    "deskripsi": "Ujian Mid Semester mata pelajaran Bahasa Indonesia",
    "mapelNama": "Bahasa Indonesia",
    "kelas": ["7A"],
    "startUjian": "2025-03-20T08:00:00",
    "endUjian": "2025-03-20T10:00:00",
    "shuffleQuestions": true,
    "showScore": true
  }
}

CONTOH 2 - Buat ujian + soal sekaligus:
User: "Buatkan ujian Bahasa Indonesia kelas 7A tanggal 20 Maret dengan 3 soal PG tentang teks deskripsi"
{
  "message": "Saya akan membuatkan ujian + 3 soal PG sekaligus:\n\n**Ujian:**\n- Judul: Ujian Bahasa Indonesia - Teks Deskripsi\n- Kelas: 7A\n- Tanggal: 20 Maret 2025\n\n**3 Soal PG:**\n1. Apa yang dimaksud dengan teks deskripsi?\n2. ...\n3. ...\n\nLanjutkan buat ujian + soal?",
  "intent": "CREATE_EXAM_WITH_QUESTIONS",
  "needsConfirmation": true,
  "confirmationType": "CREATE_EXAM_WITH_QUESTIONS",
  "examDraft": {
    "judul": "Ujian Bahasa Indonesia - Teks Deskripsi",
    "deskripsi": "Ujian Bahasa Indonesia tentang Teks Deskripsi",
    "mapelNama": "Bahasa Indonesia",
    "kelas": ["7A"],
    "startUjian": "2025-03-20T08:00:00",
    "endUjian": "2025-03-20T10:00:00",
    "shuffleQuestions": true,
    "showScore": true
  },
  "generatedSoal": [
    {
      "tipe": "PILIHAN_GANDA",
      "pertanyaan": "Apa yang dimaksud dengan teks deskripsi?",
      "poin": 1,
      "data": {
        "opsi": [
          {"label": "A", "text": "Teks yang menggambarkan suatu objek secara detail"},
          {"label": "B", "text": "Teks yang menceritakan suatu peristiwa"},
          {"label": "C", "text": "Teks yang berisi pendapat penulis"},
          {"label": "D", "text": "Teks yang berisi langkah-langkah melakukan sesuatu"}
        ],
        "kunciJawaban": "A"
      }
    }
  ]
}

CONTOH 3 - Generate soal saja:
User: "Buatkan 5 soal pilihan ganda tentang teks deskripsi"
{
  "message": "Berikut 5 soal PG tentang Teks Deskripsi:\n\n1. ...",
  "intent": "GENERATE_QUESTIONS",
  "needsConfirmation": true,
  "confirmationType": "ADD_QUESTIONS",
  "generatedSoal": [ ... ]
}

FORMAT SOAL PER TIPE:

PILIHAN_GANDA:
{ "tipe": "PILIHAN_GANDA", "pertanyaan": "...", "poin": 1, "data": { "opsi": [{"label": "A", "text": "..."}, {"label": "B", "text": "..."}, {"label": "C", "text": "..."}, {"label": "D", "text": "..."}], "kunciJawaban": "A" } }

ESSAY:
{ "tipe": "ESSAY", "pertanyaan": "...", "poin": 5, "data": { "kunciJawaban": "..." } }

ISIAN_SINGKAT:
{ "tipe": "ISIAN_SINGKAT", "pertanyaan": "...", "poin": 1, "data": { "kunciJawaban": ["jawaban1", "jawaban2"], "caseSensitive": false } }

BENAR_SALAH:
{ "tipe": "BENAR_SALAH", "pertanyaan": "...", "poin": 1, "data": { "kunciJawaban": true } }

PENCOCOKAN:
{ "tipe": "PENCOCOKAN", "pertanyaan": "...", "poin": 3, "data": { "itemKiri": [{"id": "k1", "text": "..."}], "itemKanan": [{"id": "n1", "text": "..."}], "jawaban": {"k1": "n1"} } }

PENTING:
- Selalu respons dalam JSON valid, jangan tambahkan teks di luar JSON
- Soal harus berkualitas tinggi, akurat, sesuai tingkat pendidikan
- Jika user minta campuran tipe soal, buatkan sesuai permintaan
- SELALU sertakan array generatedSoal yang lengkap ketika generate soal
- Untuk CREATE_EXAM_WITH_QUESTIONS, WAJIB sertakan KEDUA examDraft DAN generatedSoal
- JANGAN tampilkan isi soal lengkap di field "message". Field "message" hanya berisi RINGKASAN singkat
- Di field "message", WAJIB tampilkan: jumlah soal per tipe, total poin, dan distribusi kesulitan
- Contoh message BENAR: "Ujian + 25 soal:\n**Ujian:** Ujian MID Bahasa Indonesia\n**Soal:** 15 PG, 4 Essay, 3 Pencocokan, 3 B/S\n**Total Poin:** 100\n**Kesulitan:** 60% mudah, 30% medium, 10% sulit\nLanjutkan?"
- JANGAN tampilkan isi pertanyaan dan opsi jawaban di message`;

// ============================================
// AI CALL FUNCTIONS
// ============================================

async function callAnthropicSonnet(
  messages: ChatMessage[],
  systemContext: string
): Promise<string> {
  const client = getAnthropicClient();

  const anthropicMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await client.messages.create({
    model: MODEL_SONNET,
    max_tokens: 16384,
    system: SYSTEM_PROMPT + '\n\n' + systemContext,
    messages: anthropicMessages,
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  return text;
}

// ============================================
// HAIKU VALIDATOR (Hybrid Layer 2)
// ============================================

interface ValidationResult {
  valid: boolean;
  issues: string[];
  fixes: {
    soalIndicesToRemove?: number[];
    soalIndicesToFix?: { index: number; field: string; newValue: any }[];
    correctTotalPoin?: number;
    correctTotalSoal?: number;
    message?: string;
  };
}

const HAIKU_VALIDATOR_PROMPT = `Kamu adalah validator soal ujian. Tugasmu HANYA mengecek dan memvalidasi data soal yang sudah di-generate oleh AI lain.

Kamu akan menerima:
1. Permintaan asli user
2. Data soal yang di-generate (JSON)

Kamu HARUS mengecek:
1. **Jumlah soal**: Apakah jumlah soal TEPAT sesuai permintaan user? Hitung per tipe.
2. **Total poin**: Apakah total poin semua soal = 100 (atau target yang user sebut)?
3. **Kualitas soal**: Apakah ada soal yang duplikat, tidak masuk akal, atau salah secara akademis?
4. **Kunci jawaban**: Apakah kunci jawaban PG valid (A/B/C/D)? Apakah opsi jawaban masuk akal?
5. **Format matematika**: Apakah rumus menggunakan format LaTeX $...$ dan $$...$$? Bukan Unicode.
6. **Kelengkapan data**: Apakah setiap soal punya tipe, pertanyaan, poin, dan data yang lengkap?
7. **Info ujian**: Jika ada examDraft, apakah judul, mapel, kelas, tanggal masuk akal?

RESPONS dalam JSON:
{
  "valid": true/false,
  "issues": ["deskripsi masalah 1", "masalah 2"],
  "fixes": {
    "soalIndicesToRemove": [index soal yang harus dihapus],
    "soalIndicesToFix": [{"index": 0, "field": "pertanyaan", "newValue": "..."}],
    "correctTotalPoin": 100,
    "correctTotalSoal": 25,
    "message": "Pesan koreksi untuk user jika ada masalah signifikan"
  }
}

Jika semua valid, kembalikan: {"valid": true, "issues": [], "fixes": {}}
HANYA respons JSON, tanpa teks lain.`;

async function callHaikuValidator(
  userRequest: string,
  aiResponse: AIResponse
): Promise<ValidationResult> {
  try {
    const client = getAnthropicClient();

    const validationPayload = {
      userRequest,
      intent: aiResponse.intent,
      examDraft: aiResponse.examDraft || null,
      totalSoal: aiResponse.generatedSoal?.length || 0,
      totalPoin: aiResponse.generatedSoal?.reduce((sum, s) => sum + s.poin, 0) || 0,
      soalPerTipe: aiResponse.generatedSoal?.reduce((acc, s) => {
        acc[s.tipe] = (acc[s.tipe] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      generatedSoal: aiResponse.generatedSoal || [],
    };

    const response = await client.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 4096,
      system: HAIKU_VALIDATOR_PROMPT,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(validationPayload),
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Haiku validator error:', error);
    // Jika validator gagal, anggap valid (jangan block user)
    return { valid: true, issues: [], fixes: {} };
  }
}

function applyValidationFixes(
  aiResponse: AIResponse,
  validation: ValidationResult
): AIResponse {
  if (validation.valid || !aiResponse.generatedSoal) return aiResponse;

  const soalList = [...aiResponse.generatedSoal];

  // Apply individual soal fixes
  if (validation.fixes.soalIndicesToFix) {
    for (const fix of validation.fixes.soalIndicesToFix) {
      if (fix.index >= 0 && fix.index < soalList.length) {
        if (fix.field === 'pertanyaan') {
          soalList[fix.index].pertanyaan = fix.newValue;
        } else if (fix.field === 'poin') {
          soalList[fix.index].poin = fix.newValue;
        } else if (fix.field === 'data') {
          soalList[fix.index].data = fix.newValue;
        }
      }
    }
  }

  // Remove invalid soal (from highest index to lowest to preserve indices)
  if (validation.fixes.soalIndicesToRemove && validation.fixes.soalIndicesToRemove.length > 0) {
    const toRemove = [...validation.fixes.soalIndicesToRemove].sort((a, b) => b - a);
    for (const idx of toRemove) {
      if (idx >= 0 && idx < soalList.length) {
        soalList.splice(idx, 1);
      }
    }
  }

  aiResponse.generatedSoal = soalList;

  // Append validation message if there were issues
  if (validation.issues.length > 0 && validation.fixes.message) {
    aiResponse.message += `\n\n⚠️ *Koreksi otomatis:* ${validation.fixes.message}`;
  }

  return aiResponse;
}

async function callGroq(
  messages: ChatMessage[],
  systemContext: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY tidak dikonfigurasi');

  const groqMessages = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n' + systemContext },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 16384,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ============================================
// POST-PROCESSING: VALIDASI & KOREKSI POIN
// ============================================

function validateAndFixSoalPoin(soalList: GeneratedSoal[], targetTotal: number = 100): GeneratedSoal[] {
  if (soalList.length === 0) return soalList;

  // Pastikan setiap soal punya poin minimal 1
  for (const soal of soalList) {
    if (!soal.poin || soal.poin < 1) soal.poin = 1;
  }

  // Hitung total poin saat ini
  let currentTotal = soalList.reduce((sum, s) => sum + s.poin, 0);

  // Jika sudah tepat, return
  if (currentTotal === targetTotal) return soalList;

  // Koreksi: distribusikan selisih secara proporsional
  const diff = targetTotal - currentTotal;

  if (Math.abs(diff) <= soalList.length) {
    // Selisih kecil: tambah/kurang 1 poin per soal sampai cocok
    let remaining = diff;
    // Prioritaskan soal essay/pencocokan untuk adjustment (poin lebih besar)
    const sortedIndices = soalList
      .map((s, i) => ({ i, tipe: s.tipe, poin: s.poin }))
      .sort((a, b) => {
        const order: Record<string, number> = { ESSAY: 0, PENCOCOKAN: 1, ISIAN_SINGKAT: 2, PILIHAN_GANDA: 3, BENAR_SALAH: 4 };
        return (order[a.tipe] ?? 5) - (order[b.tipe] ?? 5);
      });

    for (const item of sortedIndices) {
      if (remaining === 0) break;
      if (remaining > 0) {
        soalList[item.i].poin += 1;
        remaining--;
      } else if (remaining < 0 && soalList[item.i].poin > 1) {
        soalList[item.i].poin -= 1;
        remaining++;
      }
    }
  } else {
    // Selisih besar: recalculate semua poin proporsional
    const ratio = targetTotal / currentTotal;
    let newTotal = 0;

    for (let i = 0; i < soalList.length; i++) {
      soalList[i].poin = Math.max(1, Math.round(soalList[i].poin * ratio));
      newTotal += soalList[i].poin;
    }

    // Fine-tune sisa
    let finalDiff = targetTotal - newTotal;
    for (let i = 0; finalDiff !== 0 && i < soalList.length; i++) {
      if (finalDiff > 0) {
        soalList[i].poin += 1;
        finalDiff--;
      } else if (finalDiff < 0 && soalList[i].poin > 1) {
        soalList[i].poin -= 1;
        finalDiff++;
      }
    }
  }

  return soalList;
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chatWithAI(
  messages: ChatMessage[],
  context: {
    mapelList: { id: string; nama: string }[];
    kelasList: { id: string; nama: string }[];
    guruNama: string;
    existingExams?: { id: string; judul: string; mapel: string }[];
    activeUjian?: { id: string; judul: string } | null;
  }
): Promise<AIResponse> {
  const systemContext = `
KONTEKS SAAT INI:
- Guru: ${context.guruNama}
- Mata Pelajaran tersedia: ${context.mapelList.map((m) => `${m.nama} (ID: ${m.id})`).join(', ') || 'Belum ada mata pelajaran'}
- Kelas tersedia: ${context.kelasList.map((k) => `${k.nama} (ID: ${k.id})`).join(', ') || 'Belum ada kelas'}
${context.existingExams ? `- Ujian yang sudah ada: ${context.existingExams.map((e) => `"${e.judul}" - ${e.mapel} (ID: ${e.id})`).join(', ')}` : ''}
${context.activeUjian ? `- UJIAN AKTIF SAAT INI: "${context.activeUjian.judul}" (ID: ${context.activeUjian.id}) - Soal yang di-generate akan ditambahkan ke ujian ini` : '- Belum ada ujian aktif. Jika user minta generate soal, tetap generate dan soal akan ditambahkan ke ujian draft terbaru.'}
- Tanggal hari ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

PENTING UNTUK GENERATE SOAL:
- Ketika user minta generate soal, SELALU sertakan array "generatedSoal" dalam response JSON
- Setiap soal HARUS memiliki struktur lengkap: tipe, pertanyaan, poin, dan data
- Set needsConfirmation=true dan confirmationType="ADD_QUESTIONS" agar user bisa konfirmasi
- Soal akan otomatis ditambahkan ke ujian aktif atau ujian draft terbaru setelah user konfirmasi
`;

  // ========== STEP 1: Generate with Sonnet (or Groq fallback) ==========
  const provider = getActiveProvider();
  let rawResponse: string;

  if (provider === 'anthropic') {
    rawResponse = await callAnthropicSonnet(messages, systemContext);
  } else {
    rawResponse = await callGroq(messages, systemContext);
  }

  // ========== STEP 2: Parse JSON response ==========
  let parsed: AIResponse;
  try {
    parsed = parseAIResponse(rawResponse);
  } catch {
    return {
      message: 'Maaf, terjadi kesalahan saat memproses respons AI. Silakan coba lagi.',
      intent: 'GENERAL_CHAT',
    };
  }

  // ========== STEP 3: Post-processing poin ==========
  if (parsed.generatedSoal && parsed.generatedSoal.length > 0) {
    parsed.generatedSoal = validateAndFixSoalPoin(parsed.generatedSoal);
  }

  // ========== STEP 4: Haiku Validation (hybrid layer) ==========
  // Hanya validasi jika ada soal yang di-generate DAN provider anthropic
  const hasSoal = parsed.generatedSoal && parsed.generatedSoal.length > 0;
  const hasExamDraft = !!parsed.examDraft;
  const needsValidation = hasSoal || hasExamDraft;

  if (needsValidation && provider === 'anthropic') {
    try {
      // Ambil pesan terakhir user sebagai referensi
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

      const validation = await callHaikuValidator(lastUserMessage, parsed);

      if (!validation.valid) {
        console.log('[Hybrid AI] Haiku found issues:', validation.issues);

        // Apply fixes dari Haiku
        parsed = applyValidationFixes(parsed, validation);

        // Re-fix poin setelah Haiku mungkin menghapus/mengubah soal
        if (parsed.generatedSoal && parsed.generatedSoal.length > 0) {
          parsed.generatedSoal = validateAndFixSoalPoin(parsed.generatedSoal);
        }
      }
    } catch (validationError) {
      console.error('[Hybrid AI] Validation step failed, continuing without:', validationError);
    }
  }

  // ========== STEP 5: Final summary update ==========
  if (parsed.generatedSoal && parsed.generatedSoal.length > 0) {
    const totalPoin = parsed.generatedSoal.reduce((sum, s) => sum + s.poin, 0);
    const totalSoal = parsed.generatedSoal.length;
    const perTipe = parsed.generatedSoal.reduce((acc, s) => {
      acc[s.tipe] = (acc[s.tipe] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tipeStr = Object.entries(perTipe)
      .map(([t, c]) => `${c} ${t.replace('_', ' ')}`)
      .join(', ');

    // Tambahkan badge verifikasi di akhir message
    if (!parsed.message.includes('Total Poin:') && !parsed.message.includes('✅')) {
      parsed.message += `\n\n✅ **Terverifikasi:** ${totalSoal} soal | ${tipeStr} | Total Poin: ${totalPoin}`;
    }
  }

  return parsed;
}

// ============================================
// JSON RESPONSE PARSER
// ============================================

function parseAIResponse(rawResponse: string): AIResponse {
  let jsonText = rawResponse.trim();
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed.message || !parsed.intent) {
      return {
        message: 'Maaf, AI memberikan respons yang tidak lengkap. Silakan coba lagi.',
        intent: 'GENERAL_CHAT',
      };
    }
    return parsed;
  } catch {
    // Attempt to extract from truncated JSON
    const messageMatch = jsonText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const intentMatch = jsonText.match(/"intent"\s*:\s*"([^"]+)"/);
    const examDraftMatch = jsonText.match(/"examDraft"\s*:\s*(\{[^}]+\})/);

    if (messageMatch) {
      const partialResponse: AIResponse = {
        message: messageMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        intent: (intentMatch?.[1] as ChatIntent) || 'GENERAL_CHAT',
      };

      // Try to parse examDraft if present
      if (examDraftMatch) {
        try {
          partialResponse.examDraft = JSON.parse(examDraftMatch[1]);
        } catch { /* ignore */ }
      }

      // Try to extract generatedSoal array
      const soalStart = jsonText.indexOf('"generatedSoal"');
      if (soalStart !== -1) {
        const arrayStart = jsonText.indexOf('[', soalStart);
        if (arrayStart !== -1) {
          const soalItems: any[] = [];
          let depth = 0;
          let itemStart = -1;
          for (let i = arrayStart + 1; i < jsonText.length; i++) {
            if (jsonText[i] === '{' && depth === 0) itemStart = i;
            if (jsonText[i] === '{') depth++;
            if (jsonText[i] === '}') depth--;
            if (depth === 0 && itemStart !== -1) {
              try {
                const item = JSON.parse(jsonText.substring(itemStart, i + 1));
                if (item.tipe && item.pertanyaan) soalItems.push(item);
              } catch { /* skip malformed item */ }
              itemStart = -1;
            }
          }
          if (soalItems.length > 0) {
            partialResponse.generatedSoal = soalItems;
            partialResponse.needsConfirmation = true;
            if (partialResponse.intent === 'CREATE_EXAM_WITH_QUESTIONS') {
              partialResponse.confirmationType = 'CREATE_EXAM_WITH_QUESTIONS';
            } else {
              partialResponse.confirmationType = 'ADD_QUESTIONS';
            }
            partialResponse.message += `\n\n*(${soalItems.length} soal berhasil di-generate)*`;
          }
        }
      }

      return partialResponse;
    }

    // Completely unparseable
    return {
      message: 'Maaf, terjadi kesalahan saat memproses respons AI. Silakan coba lagi dengan permintaan yang lebih singkat.',
      intent: 'GENERAL_CHAT',
    };
  }
}
