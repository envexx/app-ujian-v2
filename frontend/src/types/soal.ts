/**
 * TypeScript Types untuk Sistem Soal Multi-Type
 */

// ============================================
// TIPE SOAL
// ============================================

export type TipeSoal = 
  | 'PILIHAN_GANDA'
  | 'ESSAY'
  | 'ISIAN_SINGKAT'
  | 'PENCOCOKAN'
  | 'BENAR_SALAH';

// ============================================
// DATA STRUCTURES PER TIPE SOAL
// ============================================

// Pilihan Ganda
export interface PilihanGandaData {
  opsi: Array<{
    label: string; // 'A', 'B', 'C', 'D'
    text: string;
  }>;
  kunciJawaban: string; // 'A', 'B', 'C', 'D'
}

// Essay
export interface EssayData {
  kunciJawaban: string;
  minKata?: number;
  maxKata?: number;
}

// Isian Singkat
export interface IsianSingkatData {
  kunciJawaban: string[]; // Multiple acceptable answers
  caseSensitive: boolean;
}

// Pencocokan
export interface PencocokanItem {
  id: string;
  text: string;
}

export interface PencocokanData {
  itemKiri: PencocokanItem[];
  itemKanan: PencocokanItem[];
  jawaban: Record<string, string>; // kiriId -> kananId
}

// Benar/Salah
export interface BenarSalahData {
  kunciJawaban: boolean; // true = Benar, false = Salah
}

// Union type untuk semua data soal
export type SoalData = 
  | PilihanGandaData
  | EssayData
  | IsianSingkatData
  | PencocokanData
  | BenarSalahData;

// ============================================
// SOAL MODEL
// ============================================

export interface Soal {
  id: string;
  ujianId: string;
  tipe: TipeSoal;
  urutan: number;
  pertanyaan: string;
  poin: number;
  data: SoalData;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// JAWABAN STRUCTURES PER TIPE SOAL
// ============================================

// Jawaban Pilihan Ganda
export interface JawabanPilihanGanda {
  jawaban: string; // 'A', 'B', 'C', 'D'
}

// Jawaban Essay
export interface JawabanEssay {
  jawaban: string; // Rich text
}

// Jawaban Isian Singkat
export interface JawabanIsianSingkat {
  jawaban: string;
}

// Jawaban Pencocokan
export interface JawabanPencocokan {
  jawaban: Record<string, string>; // kiriId -> kananId (student's answer)
}

// Jawaban Benar/Salah
export interface JawabanBenarSalah {
  jawaban: boolean;
}

// Union type untuk semua jawaban
export type JawabanData = 
  | JawabanPilihanGanda
  | JawabanEssay
  | JawabanIsianSingkat
  | JawabanPencocokan
  | JawabanBenarSalah;

// ============================================
// JAWABAN SOAL MODEL
// ============================================

export interface JawabanSoal {
  id: string;
  submissionId: string;
  soalId: string;
  jawaban: JawabanData;
  nilai?: number;
  feedback?: string;
  isCorrect?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FORM INTERFACES (untuk UI)
// ============================================

export interface SoalFormData {
  tipe: TipeSoal;
  pertanyaan: string;
  poin: number;
  data: SoalData;
}

// ============================================
// HELPER TYPES
// ============================================

export interface SoalWithType<T extends TipeSoal> {
  id: string;
  ujianId: string;
  tipe: T;
  urutan: number;
  pertanyaan: string;
  poin: number;
  data: T extends 'PILIHAN_GANDA' ? PilihanGandaData
      : T extends 'ESSAY' ? EssayData
      : T extends 'ISIAN_SINGKAT' ? IsianSingkatData
      : T extends 'PENCOCOKAN' ? PencocokanData
      : T extends 'BENAR_SALAH' ? BenarSalahData
      : never;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// CONSTANTS
// ============================================

export const TIPE_SOAL_LABELS: Record<TipeSoal, string> = {
  PILIHAN_GANDA: 'Pilihan Ganda',
  ESSAY: 'Essay',
  ISIAN_SINGKAT: 'Isian Singkat',
  PENCOCOKAN: 'Pencocokan',
  BENAR_SALAH: 'Benar/Salah',
};

export const TIPE_SOAL_ICONS: Record<TipeSoal, string> = {
  PILIHAN_GANDA: 'ListChecks',
  ESSAY: 'Article',
  ISIAN_SINGKAT: 'TextT',
  PENCOCOKAN: 'ArrowsLeftRight',
  BENAR_SALAH: 'CheckCircle',
};

export const DEFAULT_POIN: Record<TipeSoal, number> = {
  PILIHAN_GANDA: 1,
  ESSAY: 5,
  ISIAN_SINGKAT: 1,
  PENCOCOKAN: 3,
  BENAR_SALAH: 1,
};

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateSoalData(tipe: TipeSoal, data: any): boolean {
  switch (tipe) {
    case 'PILIHAN_GANDA':
      const pgData = data as PilihanGandaData;
      return (
        Array.isArray(pgData.opsi) &&
        pgData.opsi.length >= 2 &&
        pgData.opsi.every(o => Boolean(o.label) && Boolean(o.text)) &&
        Boolean(pgData.kunciJawaban) &&
        pgData.opsi.some(o => o.label === pgData.kunciJawaban)
      );
    
    case 'ESSAY':
      const essayData = data as EssayData;
      return !!essayData.kunciJawaban;
    
    case 'ISIAN_SINGKAT':
      const isianData = data as IsianSingkatData;
      return (
        Array.isArray(isianData.kunciJawaban) &&
        isianData.kunciJawaban.length > 0 &&
        typeof isianData.caseSensitive === 'boolean'
      );
    
    case 'PENCOCOKAN':
      const pencocokanData = data as PencocokanData;
      return (
        Array.isArray(pencocokanData.itemKiri) &&
        Array.isArray(pencocokanData.itemKanan) &&
        pencocokanData.itemKiri.length >= 2 &&
        pencocokanData.itemKanan.length >= 2 &&
        pencocokanData.itemKiri.every(i => i.id && i.text) &&
        pencocokanData.itemKanan.every(i => i.id && i.text) &&
        typeof pencocokanData.jawaban === 'object' &&
        Object.keys(pencocokanData.jawaban).length >= 2
      );
    
    case 'BENAR_SALAH':
      const benarSalahData = data as BenarSalahData;
      return typeof benarSalahData.kunciJawaban === 'boolean';
    
    default:
      return false;
  }
}

// ============================================
// AUTO-GRADING HELPERS
// ============================================

/**
 * Auto-grade a soal.
 * Returns:
 * - isCorrect: true only if fully correct (score === 1)
 * - score: 0.0 to 1.0 ratio (supports partial scoring for Pencocokan)
 * - nilai: score as percentage (0-100)
 */
export function autoGradeSoal(
  tipe: TipeSoal,
  soalData: SoalData,
  jawabanData: JawabanData
): { isCorrect: boolean; score: number; nilai: number } {
  let score = 0; // 0.0 to 1.0
  
  switch (tipe) {
    case 'PILIHAN_GANDA':
      const pgSoal = soalData as PilihanGandaData;
      const pgJawaban = jawabanData as JawabanPilihanGanda;
      score = pgSoal.kunciJawaban === pgJawaban.jawaban ? 1 : 0;
      break;
    
    case 'ISIAN_SINGKAT':
      const isianSoal = soalData as IsianSingkatData;
      const isianJawaban = jawabanData as JawabanIsianSingkat;
      const jawabanText = isianSoal.caseSensitive 
        ? isianJawaban.jawaban 
        : isianJawaban.jawaban.toLowerCase();
      const kunciJawabanList = isianSoal.caseSensitive
        ? isianSoal.kunciJawaban
        : isianSoal.kunciJawaban.map(k => k.toLowerCase());
      score = kunciJawabanList.includes(jawabanText) ? 1 : 0;
      break;
    
    case 'BENAR_SALAH':
      const benarSalahSoal = soalData as BenarSalahData;
      const benarSalahJawaban = jawabanData as JawabanBenarSalah;
      score = benarSalahSoal.kunciJawaban === benarSalahJawaban.jawaban ? 1 : 0;
      break;
    
    case 'PENCOCOKAN':
      const pencocokanSoal = soalData as PencocokanData;
      const pencocokanJawaban = jawabanData as JawabanPencocokan;
      
      // Partial scoring: count correct pairs / total pairs
      const kunciEntries = Object.entries(pencocokanSoal.jawaban);
      if (kunciEntries.length === 0) {
        score = 0;
        break;
      }
      let correctPairs = 0;
      for (const [kiriId, kananId] of kunciEntries) {
        if (pencocokanJawaban.jawaban[kiriId] === kananId) {
          correctPairs++;
        }
      }
      score = correctPairs / kunciEntries.length;
      break;
    
    // Essay tidak bisa auto-grade
    case 'ESSAY':
      return { isCorrect: false, score: 0, nilai: 0 };
  }
  
  const isCorrect = score === 1;
  return { isCorrect, score, nilai: Math.round(score * 100) };
}
