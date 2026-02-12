// Query optimization helpers to prevent N+1 problem
import { prisma } from './prisma';
import { cache } from './redis';

// Common includes for eager loading
export const includes = {
  // Siswa with relations
  siswaWithRelations: {
    user: true,
    kelas: true,
    kartuPelajar: true,
  },

  // Guru with relations
  guruWithRelations: {
    user: true,
    mapel: {
      include: {
        mapel: true,
      },
    },
    kelas: {
      include: {
        kelas: true,
      },
    },
  },

  // Tugas with submissions count
  tugasWithStats: {
    guru: {
      select: {
        nama: true,
      },
    },
    mapel: {
      select: {
        nama: true,
      },
    },
    submissions: {
      select: {
        id: true,
        nilai: true,
      },
    },
  },

  // Ujian with soal count
  ujianWithStats: {
    guru: {
      select: {
        nama: true,
      },
    },
    mapel: {
      select: {
        nama: true,
      },
    },
    soal: {
      select: {
        id: true,
      },
    },
  },

  // Nilai with student and mapel
  nilaiWithRelations: {
    siswa: {
      select: {
        nisn: true,
        nama: true,
      },
    },
    mapel: {
      select: {
        nama: true,
      },
    },
  },
};

// Cached query wrapper
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  // Try to get from cache first
  const cached = await cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // If not in cache, execute query
  const result = await queryFn();

  // Store in cache
  await cache.set(key, result, ttl);

  return result;
}

// Batch query helper to prevent N+1
export async function batchQuery<T, K extends keyof T>(
  ids: string[],
  model: any,
  key: K
): Promise<T[]> {
  if (ids.length === 0) return [];

  return await model.findMany({
    where: {
      [key]: {
        in: ids,
      },
    },
  });
}

// Pagination helper
export function getPagination(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}

// Common query patterns with caching
export const queries = {
  // Get siswa by kelas with caching
  async getSiswaByKelas(kelasId: string) {
    return cachedQuery(
      `siswa:kelas:${kelasId}`,
      () =>
        prisma.siswa.findMany({
          where: { kelasId },
          include: includes.siswaWithRelations,
          orderBy: { nama: 'asc' },
        }),
      600 // 10 minutes
    );
  },

  // Get active tugas with caching
  async getActiveTugas(guruId?: string) {
    const key = guruId ? `tugas:active:guru:${guruId}` : 'tugas:active';
    return cachedQuery(
      key,
      () =>
        prisma.tugas.findMany({
          where: {
            // status: 'aktif', // Will be enabled after migration
            ...(guruId && { guruId }),
          },
          include: includes.tugasWithStats,
          orderBy: { deadline: 'asc' },
        }),
      300 // 5 minutes
    );
  },

  // Get presensi by date with caching
  async getPresensiByDate(tanggal: Date) {
    const dateKey = tanggal.toISOString().split('T')[0];
    return cachedQuery(
      `presensi:date:${dateKey}`,
      () =>
        prisma.presensi.findMany({
          where: {
            tanggal: {
              gte: new Date(tanggal.setHours(0, 0, 0, 0)),
              lt: new Date(tanggal.setHours(23, 59, 59, 999)),
            },
          },
          include: {
            siswa: {
              select: {
                nama: true,
                kelas: {
                  select: {
                    nama: true,
                  },
                },
              },
            },
          },
        }),
      600 // 10 minutes
    );
  },
};

// Cache invalidation helpers
export const invalidateCache = {
  siswa: (kelasId?: string) => {
    if (kelasId) {
      cache.del(`siswa:kelas:${kelasId}`);
    }
    cache.delPattern('siswa:*');
  },

  tugas: (guruId?: string) => {
    if (guruId) {
      cache.del(`tugas:active:guru:${guruId}`);
    }
    cache.delPattern('tugas:*');
  },

  presensi: (tanggal?: Date) => {
    if (tanggal) {
      const dateKey = tanggal.toISOString().split('T')[0];
      cache.del(`presensi:date:${dateKey}`);
    }
    cache.delPattern('presensi:*');
  },
};
