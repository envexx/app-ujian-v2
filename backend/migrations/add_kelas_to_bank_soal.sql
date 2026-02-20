-- Migration: Add kelas column to bank_soal table
ALTER TABLE bank_soal ADD COLUMN IF NOT EXISTS kelas TEXT[] DEFAULT '{}';
