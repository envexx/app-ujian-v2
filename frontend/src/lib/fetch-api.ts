// Wrapper for fetch that automatically uses backend API URL
// This module patches the global fetch for /api/* paths
// Now uses cookies for authentication (Lucia Auth)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getApiUrl(path: string): string {
  // Remove leading /api if present
  const cleanPath = path.replace(/^\/api/, '');
  return `${API_BASE_URL}${cleanPath}`;
}

function getAuthToken(): string | null {
  // Deprecated - now using cookies
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

interface FetchApiOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchApi(
  path: string,
  options: FetchApiOptions = {}
): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  
  // Convert /api/* paths to backend API URL
  const url = path.startsWith('/api') ? getApiUrl(path) : path;
  
  // Prepare headers
  const existingHeaders = options.headers || {};
  const headers: Record<string, string> = {};
  
  // Copy existing headers
  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (Array.isArray(existingHeaders)) {
    existingHeaders.forEach(([key, value]) => {
      headers[key] = value;
    });
  } else {
    Object.assign(headers, existingHeaders);
  }
  
  // Set default content-type if not FormData
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Use credentials: 'include' to send cookies cross-origin
  return fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Important for cookies
  });
}

// Helper to make JSON requests
export async function fetchApiJson<T = any>(
  path: string,
  options: FetchApiOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const response = await fetchApi(path, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle 401 - redirect to login
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/admin-guru';
      }
      
      return {
        success: false,
        error: data.error || data.message || 'Request failed',
        status: response.status,
      };
    }
    
    return { success: true, data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

// Auth helpers
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Export getApiUrl for use in other modules
export { getApiUrl, getAuthToken };
