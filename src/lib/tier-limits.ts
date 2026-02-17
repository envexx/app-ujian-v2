import { prisma } from '@/lib/prisma';

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
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { tier: true },
  });

  if (!school?.tier) return DEFAULT_LIMITS;

  return {
    maxSiswa: school.tier.maxSiswa,
    maxGuru: school.tier.maxGuru,
    maxKelas: school.tier.maxKelas,
    maxMapel: school.tier.maxMapel,
    maxUjian: school.tier.maxUjian,
    maxStorage: school.tier.maxStorage,
    fipitur: (school.tier.fipitur as Record<string, boolean>) || {},
  };
}

export async function getSchoolCurrentUsage(schoolId: string) {
  const [siswaCount, guruCount, kelasCount, mapelCount, ujianCount] = await Promise.all([
    prisma.siswa.count({ where: { schoolId } }),
    prisma.guru.count({ where: { schoolId } }),
    prisma.kelas.count({ where: { schoolId } }),
    prisma.mataPelajaran.count({ where: { schoolId } }),
    prisma.ujian.count({ where: { schoolId } }),
  ]);

  return { siswaCount, guruCount, kelasCount, mapelCount, ujianCount };
}

export async function checkTierLimit(
  schoolId: string,
  resource: 'siswa' | 'guru' | 'kelas' | 'mapel' | 'ujian',
  addCount: number = 1
): Promise<{ allowed: boolean; current: number; max: number; tierLabel: string }> {
  const limits = await getSchoolTierLimits(schoolId);
  const usage = await getSchoolCurrentUsage(schoolId);

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { tier: true },
  });

  const tierLabel = school?.tier?.label || 'No Tier';

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
