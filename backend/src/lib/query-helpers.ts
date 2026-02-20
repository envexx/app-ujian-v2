// Query optimization helpers to prevent N+1 problem

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

// Pagination helper
export function getPagination(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return {
    skip,
    take: limit,
  };
}
