import { sql } from './db';

export interface TierLimits {
  maxSiswa: number;
  maxGuru: number;
  maxKelas: number;
  maxMapel: number;
  maxUjian: number;
  maxStorage: number;
  fipitur: Record<string, boolean>;
}

const DEFAULT_LIMITS: TierLimits = {
  maxSiswa: 50,
  maxGuru: 5,
  maxKelas: 5,
  maxMapel: 10,
  maxUjian: 10,
  maxStorage: 500,
  fipitur: {},
};

export async function getSchoolTierLimits(schoolId: string): Promise<TierLimits> {
  const result = await sql`
    SELECT t.* FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${schoolId} LIMIT 1
  `;
  const tier = result[0];
  if (!tier) return DEFAULT_LIMITS;

  return {
    maxSiswa: tier.maxSiswa ?? DEFAULT_LIMITS.maxSiswa,
    maxGuru: tier.maxGuru ?? DEFAULT_LIMITS.maxGuru,
    maxKelas: tier.maxKelas ?? DEFAULT_LIMITS.maxKelas,
    maxMapel: tier.maxMapel ?? DEFAULT_LIMITS.maxMapel,
    maxUjian: tier.maxUjian ?? DEFAULT_LIMITS.maxUjian,
    maxStorage: tier.maxStorage ?? DEFAULT_LIMITS.maxStorage,
    fipitur: (tier.fipitur as Record<string, boolean>) || {},
  };
}

export async function getSchoolCurrentUsage(schoolId: string) {
  const [siswa, guru, kelas, mapel, ujian] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM siswa WHERE "schoolId" = ${schoolId}`,
    sql`SELECT COUNT(*) as count FROM guru WHERE "schoolId" = ${schoolId}`,
    sql`SELECT COUNT(*) as count FROM kelas WHERE "schoolId" = ${schoolId}`,
    sql`SELECT COUNT(*) as count FROM mata_pelajaran WHERE "schoolId" = ${schoolId}`,
    sql`SELECT COUNT(*) as count FROM ujian WHERE "schoolId" = ${schoolId}`,
  ]);

  return {
    siswaCount: parseInt(siswa[0]?.count || '0'),
    guruCount: parseInt(guru[0]?.count || '0'),
    kelasCount: parseInt(kelas[0]?.count || '0'),
    mapelCount: parseInt(mapel[0]?.count || '0'),
    ujianCount: parseInt(ujian[0]?.count || '0'),
  };
}

export async function checkTierLimit(
  schoolId: string,
  resource: 'siswa' | 'guru' | 'kelas' | 'mapel' | 'ujian',
  addCount: number = 1
): Promise<{ allowed: boolean; current: number; max: number; tierLabel: string }> {
  const limits = await getSchoolTierLimits(schoolId);
  const usage = await getSchoolCurrentUsage(schoolId);

  const schoolResult = await sql`
    SELECT t.label FROM schools s JOIN tiers t ON t.id = s."tierId" WHERE s.id = ${schoolId} LIMIT 1
  `;
  const tierLabel = schoolResult[0]?.label || 'No Tier';

  const mapping: Record<string, { current: number; max: number }> = {
    siswa: { current: usage.siswaCount, max: limits.maxSiswa },
    guru: { current: usage.guruCount, max: limits.maxGuru },
    kelas: { current: usage.kelasCount, max: limits.maxKelas },
    mapel: { current: usage.mapelCount, max: limits.maxMapel },
    ujian: { current: usage.ujianCount, max: limits.maxUjian },
  };

  const { current, max } = mapping[resource];

  return {
    allowed: current + addCount <= max,
    current,
    max,
    tierLabel,
  };
}
