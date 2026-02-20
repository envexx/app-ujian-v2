import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/fetch-api';

interface UserProfile {
  id: string;
  nama?: string;
  nis?: string;
  nisn?: string;
  nip?: string;
  kelasId?: string;
  kelas?: any;
  jenisKelamin?: string;
  foto?: string;
  email?: string;
  mapel?: any[];
  role?: string;
}

interface SessionData {
  userId: string;
  email: string;
  role: 'ADMIN' | 'GURU' | 'SISWA';
  profile: UserProfile | null;
}

interface SessionResponse {
  success: boolean;
  isLoggedIn: boolean;
  data: SessionData | null;
}

// Fetcher that uses cookies for authentication (Lucia Auth)
const fetcher = async (url: string): Promise<SessionResponse> => {
  const fullUrl = getApiUrl(url);
  
  const res = await fetch(fullUrl, {
    cache: 'no-store',
    credentials: 'include', // Important for cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Handle 401 immediately
  if (res.status === 401) {
    return {
      success: false,
      isLoggedIn: false,
      data: null,
    };
  }
  
  return res.json();
};

export function useAuth(requireAuth = true) {
  const router = useRouter();
  
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>(
    '/api/auth/session',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      refreshInterval: 60000, // Check session every 60 seconds
      dedupingInterval: 5000, // Prevent too frequent requests
    }
  );

  const isAuthenticated = data?.isLoggedIn || false;
  const user = data?.data || null;

  // Login function - now uses cookies set by backend
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Revalidate session after login
        await mutate();
        
        toast.success('Login berhasil');
        
        // Redirect based on role
        const role = result.data.role.toLowerCase();
        window.location.href = `/${role}`;
        
        return { success: true, data: result.data };
      } else {
        toast.error(result.error || 'Login gagal');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Terjadi kesalahan saat login');
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        credentials: 'include', // Important for cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await mutate(undefined, false);
        toast.success('Logout berhasil');
        
        // Hard redirect to clear all state
        window.location.href = '/admin-guru';
        return { success: true };
      } else {
        toast.error('Logout gagal');
        return { success: false };
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Terjadi kesalahan saat logout');
      return { success: false };
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    mutate,
  };
}

// Hook to check if user has specific role
export function useRequireRole(allowedRoles: Array<'ADMIN' | 'GURU' | 'SISWA'>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (!isLoading && user && !allowedRoles.includes(user.role)) {
    router.push(`/${user.role.toLowerCase()}`);
  }

  return { user, isLoading };
}

// Hook to get current user's ID for data filtering
export function useUserId() {
  const { user, isLoading } = useAuth();
  return {
    userId: user?.userId || null,
    profileId: user?.profile?.id || null,
    isLoading,
  };
}
