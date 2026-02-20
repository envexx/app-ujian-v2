// Shared fetcher for superadmin pages with token support
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const superadminFetcher = (url: string) => {
  const fullUrl = url.startsWith('/api') ? `${API_BASE_URL}${url.replace('/api', '')}` : url;
  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(fullUrl, { credentials: "include", headers }).then((r) => r.json());
};

export const superadminFetch = async (url: string, options: RequestInit = {}) => {
  const fullUrl = url.startsWith('/api') ? `${API_BASE_URL}${url.replace('/api', '')}` : url;
  const token = typeof window !== 'undefined' ? localStorage.getItem('superadmin_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(fullUrl, { ...options, credentials: "include", headers });
};

export const clearSuperadminToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('superadmin_token');
  }
};
