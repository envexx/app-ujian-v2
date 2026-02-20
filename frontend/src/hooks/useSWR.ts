import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, fetcherWithAuth } from '@/lib/swr-config';
import { getApiUrl } from '@/lib/fetch-api';

// Generic hook for GET requests
export function useData<T>(key: string | null, useAuth = false) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    key,
    useAuth ? fetcherWithAuth : fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 2000,
      refreshInterval: 0, // Disable auto-refresh, use manual mutate
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for POST/PUT/DELETE requests with mutation (cookie-based auth)
async function sendRequest(url: string, { arg }: { arg: { method: string; body?: any } }) {
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  
  const res = await fetch(fullUrl, {
    method: arg.method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });

  if (!res.ok) {
    throw new Error('Request failed');
  }

  return res.json();
}

export function useMutateData<T>(key: string) {
  const { trigger, isMutating, error } = useSWRMutation(key, sendRequest);

  return {
    trigger,
    isMutating,
    isError: error,
  };
}

// Specific hooks for common data types

// Siswa
export function useSiswa(kelas?: string) {
  const key = kelas ? `/api/siswa?kelas=${kelas}` : '/api/siswa';
  return useData(key, true);
}

// Kelas
export function useKelas() {
  return useData('/api/kelas', true);
}

// Mata Pelajaran
export function useMapel() {
  return useData('/api/mapel', true);
}

// Kartu Pelajar
export function useKartuPelajar(kelas?: string) {
  const key = kelas ? `/api/kartu-pelajar?kelas=${kelas}` : '/api/kartu-pelajar';
  return useData(key, true);
}

// Nilai
export function useNilai(kelas?: string, mapel?: string) {
  let key = '/api/nilai';
  const params = [];
  if (kelas) params.push(`kelas=${kelas}`);
  if (mapel) params.push(`mapel=${mapel}`);
  if (params.length > 0) key += `?${params.join('&')}`;
  
  return useData(key, true);
}

// Ujian
export function useUjian(kelas?: string, status?: string) {
  let key = '/api/ujian';
  const params = [];
  if (kelas) params.push(`kelas=${kelas}`);
  if (status) params.push(`status=${status}`);
  if (params.length > 0) key += `?${params.join('&')}`;
  
  return useData(key, true);
}

// Guru
export function useGuru(mapel?: string) {
  const key = mapel && mapel !== 'all' ? `/api/guru?mapel=${mapel}` : '/api/guru';
  return useData(key, true);
}

// Sekolah Info
export function useSekolahInfo() {
  return useData('/api/school/info', true);
}

// Sekolah Info with manual refresh capability
export function useSekolahInfoWithRefresh() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/school/info',
    fetcher,
    {
      revalidateOnFocus: true,       // Refresh when user returns to tab
      revalidateOnReconnect: true,   // Refresh when internet reconnects
      dedupingInterval: 5000,       // 5 seconds deduplication
      refreshInterval: 0,           // No auto-refresh
      errorRetryCount: 3,
      errorRetryInterval: 3000,
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
    refresh: () => {
      // Force refresh by clearing cache and revalidating
      mutate(undefined, { revalidate: true });
    }
  };
}

// Sekolah Info - Lazy version for sidebar (optimized caching)
export function useSekolahInfoLazy() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/school/info',
    fetcherWithAuth,
    {
      revalidateIfStale: false,      // Jangan ambil data lagi jika sudah ada di cache
      revalidateOnFocus: false,      // Jangan loading ulang saat user pindah tab browser
      revalidateOnReconnect: false,  // Jangan loading ulang saat internet nyambung lagi
      dedupingInterval: 3600000,     // Anggap data "segar" selama 1 jam
      refreshInterval: 0,           // Tidak ada auto-refresh
      errorRetryCount: 1,            // Coba retry hanya sekali
      errorRetryInterval: 5000,      // Retry setelah 5 detik
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Sekolah Info - With localStorage fallback (most optimal)
export function useSekolahInfoWithFallback() {
  // Get fallback data from localStorage
  const getFallbackData = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('school-info-cache');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 24 hours
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return data;
          }
        }
      } catch (error) {
        console.warn('Error reading school info from localStorage:', error);
      }
    }
    return null;
  };

  const { data, error, isLoading, mutate } = useSWR(
    '/api/school/info',
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000,     // 1 hour
      refreshInterval: 0,
      errorRetryCount: 1,
      errorRetryInterval: 5000,
      fallbackData: getFallbackData(), // Use localStorage as fallback
      onSuccess: (data) => {
        // Cache successful data to localStorage
        if (typeof window !== 'undefined' && data) {
          try {
            localStorage.setItem('school-info-cache', JSON.stringify({
              data,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Error caching school info to localStorage:', error);
          }
        }
      }
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}

