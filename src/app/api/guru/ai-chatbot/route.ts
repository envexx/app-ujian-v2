import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { chatWithAI, type ChatMessage, type AIResponse } from '@/lib/ai-chatbot';

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || session.role !== 'GURU') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messages, action, actionData, currentUjianId } = body as {
      messages: ChatMessage[];
      action?: 'CONFIRM_CREATE_EXAM' | 'CONFIRM_ADD_QUESTIONS' | 'CONFIRM_CREATE_EXAM_WITH_QUESTIONS';
      actionData?: any;
      currentUjianId?: string | null;
    };

    // Get guru data with relations
    const guru = await prisma.guru.findFirst({
      where: { userId: session.userId },
      include: {
        mapel: { include: { mapel: true } },
        kelas: { include: { kelas: true } },
      },
    });

    if (!guru) {
      return NextResponse.json(
        { success: false, error: 'Guru not found' },
        { status: 404 }
      );
    }

    // Get existing exams for context
    const existingExams = await prisma.ujian.findMany({
      where: { guruId: guru.id },
      include: { mapel: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // ============================================
    // HANDLE CONFIRMED ACTIONS
    // ============================================

    if (action === 'CONFIRM_CREATE_EXAM' && actionData?.examDraft) {
      return await handleCreateExam(guru, actionData.examDraft);
    }

    if (action === 'CONFIRM_CREATE_EXAM_WITH_QUESTIONS' && actionData?.examDraft && actionData?.soalList) {
      return await handleCreateExamWithQuestions(guru, actionData.examDraft, actionData.soalList);
    }

    if (action === 'CONFIRM_ADD_QUESTIONS' && actionData?.soalList) {
      // If ujianId provided, use it. Otherwise find the most recent draft exam.
      let targetUjianId = actionData.ujianId;
      if (!targetUjianId) {
        const latestDraft = await prisma.ujian.findFirst({
          where: { guruId: guru.id, status: 'draft' },
          orderBy: { createdAt: 'desc' },
        });
        if (latestDraft) {
          targetUjianId = latestDraft.id;
        } else {
          return NextResponse.json({
            success: true,
            data: {
              message: 'Belum ada ujian draft. Silakan buat ujian terlebih dahulu, lalu minta saya generate soal.',
              intent: 'GENERAL_CHAT',
              actionResult: { success: false, error: 'No draft exam found' },
            },
          });
        }
      }
      return await handleAddQuestions(guru, targetUjianId, actionData.soalList);
    }

    // ============================================
    // NORMAL CHAT - Send to AI
    // ============================================

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Find the active/target ujian for context
    let activeUjian: { id: string; judul: string } | null = null;
    if (currentUjianId) {
      const found = existingExams.find((e) => e.id === currentUjianId);
      if (found) activeUjian = { id: found.id, judul: found.judul };
    }

    const context = {
      guruNama: guru.nama,
      mapelList: guru.mapel.map((gm) => ({
        id: gm.mapel.id,
        nama: gm.mapel.nama,
      })),
      kelasList: guru.kelas.map((gk) => ({
        id: gk.kelas.id,
        nama: gk.kelas.nama,
      })),
      existingExams: existingExams.map((e) => ({
        id: e.id,
        judul: e.judul,
        mapel: e.mapel.nama,
      })),
      activeUjian,
    };

    const aiResponse: AIResponse = await chatWithAI(messages, context);

    return NextResponse.json({
      success: true,
      data: aiResponse,
    });
  } catch (error: any) {
    console.error('Error in AI chatbot:', error);

    if (error.message?.includes('API Key')) {
      return NextResponse.json(
        { success: false, error: 'API Key AI belum dikonfigurasi. Hubungi administrator.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan pada AI chatbot' },
      { status: 500 }
    );
  }
}

// ============================================
// ACTION HANDLERS
// ============================================

async function handleCreateExam(guru: any, examDraft: any) {
  try {
    // Find mapel by name
    const mapel = await prisma.mataPelajaran.findFirst({
      where: {
        nama: { contains: examDraft.mapelNama, mode: 'insensitive' },
      },
    });

    if (!mapel) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Mata pelajaran "${examDraft.mapelNama}" tidak ditemukan. Pastikan nama mata pelajaran sudah benar dan terdaftar di sistem.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Mapel not found' },
        },
      });
    }

    // Validasi: mapel harus diajar oleh guru ini
    const guruMapel = await prisma.guruMapel.findFirst({
      where: { guruId: guru.id, mapelId: mapel.id },
    });
    if (!guruMapel) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Anda tidak mengajar mata pelajaran "${mapel.nama}". Silakan pilih mata pelajaran yang Anda ajar.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Mapel not assigned to guru' },
        },
      });
    }

    // Validate kelas
    const validKelas = await prisma.kelas.findMany({
      where: {
        nama: { in: examDraft.kelas },
      },
    });

    const validKelasNames = validKelas.map((k) => k.nama);
    const invalidKelas = examDraft.kelas.filter(
      (k: string) => !validKelasNames.includes(k)
    );

    if (validKelasNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Kelas ${examDraft.kelas.join(', ')} tidak ditemukan di sistem. Pastikan nama kelas sudah benar.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Kelas not found' },
        },
      });
    }

    // Validasi: kelas harus diajar oleh guru ini
    const guruKelasRecords = await prisma.guruKelas.findMany({
      where: { guruId: guru.id },
      include: { kelas: true },
    });
    const guruKelasNames = guruKelasRecords.map((gk) => gk.kelas.nama);
    const allowedKelas = validKelasNames.filter((k) => guruKelasNames.includes(k));
    const notAllowedKelas = validKelasNames.filter((k) => !guruKelasNames.includes(k));

    if (allowedKelas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Anda tidak mengajar di kelas ${validKelasNames.join(', ')}. Kelas yang Anda ajar: ${guruKelasNames.join(', ') || 'belum ada'}.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Kelas not assigned to guru' },
        },
      });
    }

    // Create the exam (hanya kelas yang diizinkan)
    const ujian = await prisma.ujian.create({
      data: {
        schoolId: guru.schoolId,
        judul: examDraft.judul,
        deskripsi: examDraft.deskripsi || '',
        mapelId: mapel.id,
        guruId: guru.id,
        kelas: allowedKelas,
        startUjian: new Date(examDraft.startUjian),
        endUjian: new Date(examDraft.endUjian),
        shuffleQuestions: examDraft.shuffleQuestions || false,
        showScore: examDraft.showScore !== false,
        status: 'draft',
      },
      include: { mapel: true },
    });

    let message = `✅ **Ujian berhasil dibuat!**\n\n`;
    message += `📝 **${ujian.judul}**\n`;
    message += `- Mata Pelajaran: ${ujian.mapel.nama}\n`;
    message += `- Kelas: ${allowedKelas.join(', ')}\n`;
    message += `- Mulai: ${new Date(ujian.startUjian).toLocaleString('id-ID')}\n`;
    message += `- Selesai: ${new Date(ujian.endUjian).toLocaleString('id-ID')}\n`;
    message += `- Status: Draft\n\n`;

    if (invalidKelas.length > 0) {
      message += `⚠️ Kelas berikut tidak ditemukan dan dilewati: ${invalidKelas.join(', ')}\n\n`;
    }

    if (notAllowedKelas.length > 0) {
      message += `⚠️ Kelas berikut bukan kelas Anda dan dilewati: ${notAllowedKelas.join(', ')}\n\n`;
    }

    message += `Ujian masih berstatus **draft**. Anda bisa:\n`;
    message += `1. Minta saya untuk **generate soal** untuk ujian ini\n`;
    message += `2. Edit ujian di halaman [Kelola Ujian](/guru/ujian/${ujian.id}/edit)\n`;
    message += `3. Tambahkan soal secara manual\n\n`;
    message += `Mau saya buatkan soal untuk ujian ini?`;

    return NextResponse.json({
      success: true,
      data: {
        message,
        intent: 'CREATE_EXAM',
        actionResult: {
          success: true,
          ujianId: ujian.id,
          ujianJudul: ujian.judul,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json({
      success: true,
      data: {
        message: `❌ Gagal membuat ujian: ${error.message}`,
        intent: 'GENERAL_CHAT',
        actionResult: { success: false, error: error.message },
      },
    });
  }
}

async function handleAddQuestions(guru: any, ujianId: string, soalList: any[]) {
  try {
    // Verify ujian belongs to this guru
    const ujian = await prisma.ujian.findFirst({
      where: { id: ujianId, guruId: guru.id },
      include: { soal: { orderBy: { urutan: 'desc' }, take: 1 } },
    });

    if (!ujian) {
      return NextResponse.json({
        success: true,
        data: {
          message: '❌ Ujian tidak ditemukan atau Anda tidak memiliki akses.',
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Ujian not found' },
        },
      });
    }

    let startUrutan = ujian.soal.length > 0 ? ujian.soal[0].urutan + 1 : 1;
    const createdSoal = [];

    for (const soal of soalList) {
      const created = await prisma.soal.create({
        data: {
          ujianId,
          tipe: soal.tipe,
          urutan: startUrutan++,
          pertanyaan: soal.pertanyaan,
          poin: soal.poin || 1,
          data: soal.data,
        },
      });
      createdSoal.push(created);
    }

    let message = `✅ **${createdSoal.length} soal berhasil ditambahkan ke ujian!**\n\n`;
    message += `📊 **Ringkasan soal yang ditambahkan:**\n`;

    const tipeCounts: Record<string, number> = {};
    for (const s of soalList) {
      tipeCounts[s.tipe] = (tipeCounts[s.tipe] || 0) + 1;
    }

    const tipeLabels: Record<string, string> = {
      PILIHAN_GANDA: 'Pilihan Ganda',
      ESSAY: 'Essay',
      ISIAN_SINGKAT: 'Isian Singkat',
      BENAR_SALAH: 'Benar/Salah',
      PENCOCOKAN: 'Pencocokan',
    };

    for (const [tipe, count] of Object.entries(tipeCounts)) {
      message += `- ${tipeLabels[tipe] || tipe}: ${count} soal\n`;
    }

    message += `\nAnda bisa melihat dan mengedit soal di halaman [Edit Ujian](/guru/ujian/${ujianId}/edit).\n`;
    message += `\nMau saya buatkan soal tambahan?`;

    return NextResponse.json({
      success: true,
      data: {
        message,
        intent: 'ADD_QUESTIONS_TO_EXAM',
        actionResult: {
          success: true,
          ujianId,
          addedCount: createdSoal.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error adding questions:', error);
    return NextResponse.json({
      success: true,
      data: {
        message: `❌ Gagal menambahkan soal: ${error.message}`,
        intent: 'GENERAL_CHAT',
        actionResult: { success: false, error: error.message },
      },
    });
  }
}

async function handleCreateExamWithQuestions(guru: any, examDraft: any, soalList: any[]) {
  try {
    // 1. Cari mata pelajaran
    const mapel = await prisma.mataPelajaran.findFirst({
      where: {
        nama: { contains: examDraft.mapelNama, mode: 'insensitive' },
      },
    });

    if (!mapel) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Mata pelajaran "${examDraft.mapelNama}" tidak ditemukan di sistem. Pastikan nama mata pelajaran sudah benar.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Mapel not found' },
        },
      });
    }

    // 1b. Validasi: mapel harus diajar oleh guru ini
    const guruMapel = await prisma.guruMapel.findFirst({
      where: { guruId: guru.id, mapelId: mapel.id },
    });
    if (!guruMapel) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Anda tidak mengajar mata pelajaran "${mapel.nama}". Silakan pilih mata pelajaran yang Anda ajar.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Mapel not assigned to guru' },
        },
      });
    }

    // 2. Validasi kelas
    const validKelas = await prisma.kelas.findMany({
      where: { nama: { in: examDraft.kelas } },
    });

    const validKelasNames = validKelas.map((k) => k.nama);
    if (validKelasNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Kelas ${examDraft.kelas.join(', ')} tidak ditemukan di sistem.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Kelas not found' },
        },
      });
    }

    // 2b. Validasi: kelas harus diajar oleh guru ini
    const guruKelasRecords = await prisma.guruKelas.findMany({
      where: { guruId: guru.id },
      include: { kelas: true },
    });
    const guruKelasNames = guruKelasRecords.map((gk) => gk.kelas.nama);
    const allowedKelas = validKelasNames.filter((k) => guruKelasNames.includes(k));

    if (allowedKelas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: `Anda tidak mengajar di kelas ${validKelasNames.join(', ')}. Kelas yang Anda ajar: ${guruKelasNames.join(', ') || 'belum ada'}.`,
          intent: 'GENERAL_CHAT',
          actionResult: { success: false, error: 'Kelas not assigned to guru' },
        },
      });
    }

    // 3. Buat ujian (hanya kelas yang diizinkan)
    const ujian = await prisma.ujian.create({
      data: {
        schoolId: guru.schoolId,
        judul: examDraft.judul,
        deskripsi: examDraft.deskripsi || '',
        mapelId: mapel.id,
        guruId: guru.id,
        kelas: allowedKelas,
        startUjian: new Date(examDraft.startUjian),
        endUjian: new Date(examDraft.endUjian),
        shuffleQuestions: examDraft.shuffleQuestions || false,
        showScore: examDraft.showScore !== false,
        status: 'draft',
      },
      include: { mapel: true },
    });

    // 4. Tambahkan semua soal ke ujian
    let urutan = 1;
    const createdSoal = [];

    for (const soal of soalList) {
      const created = await prisma.soal.create({
        data: {
          ujianId: ujian.id,
          tipe: soal.tipe,
          urutan: urutan++,
          pertanyaan: soal.pertanyaan,
          poin: soal.poin || 1,
          data: soal.data,
        },
      });
      createdSoal.push(created);
    }

    // 5. Buat ringkasan
    const tipeCounts: Record<string, number> = {};
    for (const s of soalList) {
      tipeCounts[s.tipe] = (tipeCounts[s.tipe] || 0) + 1;
    }

    const tipeLabels: Record<string, string> = {
      PILIHAN_GANDA: 'Pilihan Ganda',
      ESSAY: 'Essay',
      ISIAN_SINGKAT: 'Isian Singkat',
      BENAR_SALAH: 'Benar/Salah',
      PENCOCOKAN: 'Pencocokan',
    };

    let message = `✅ **Ujian + ${createdSoal.length} soal berhasil dibuat!**\n\n`;
    message += `📝 **${ujian.judul}**\n`;
    message += `- Mata Pelajaran: ${ujian.mapel.nama}\n`;
    message += `- Kelas: ${validKelasNames.join(', ')}\n`;
    message += `- Mulai: ${new Date(ujian.startUjian).toLocaleString('id-ID')}\n`;
    message += `- Selesai: ${new Date(ujian.endUjian).toLocaleString('id-ID')}\n`;
    message += `- Status: Draft\n\n`;
    message += `📊 **Soal yang ditambahkan:**\n`;

    for (const [tipe, count] of Object.entries(tipeCounts)) {
      message += `- ${tipeLabels[tipe] || tipe}: ${count} soal\n`;
    }

    message += `\nAnda bisa melihat dan mengedit di halaman [Edit Ujian](/guru/ujian/${ujian.id}/edit).\n`;
    message += `\nMau saya buatkan soal tambahan?`;

    return NextResponse.json({
      success: true,
      data: {
        message,
        intent: 'CREATE_EXAM_WITH_QUESTIONS',
        actionResult: {
          success: true,
          ujianId: ujian.id,
          ujianJudul: ujian.judul,
          addedCount: createdSoal.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error creating exam with questions:', error);
    return NextResponse.json({
      success: true,
      data: {
        message: `❌ Gagal membuat ujian + soal: ${error.message}`,
        intent: 'GENERAL_CHAT',
        actionResult: { success: false, error: error.message },
      },
    });
  }
}
