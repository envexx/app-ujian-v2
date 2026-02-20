import { SWRConfiguration } from 'swr';
import { getApiUrl } from './fetch-api';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  // Revalidate on focus (when user returns to tab) - reduced frequency
  revalidateOnFocus: false, // Disabled to reduce unnecessary requests
  
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  
  // Dedupe requests within 5 seconds (increased from 2s)
  dedupingInterval: 5000,
  
  // Keep data fresh for 10 minutes (increased from 5 minutes)
  focusThrottleInterval: 10 * 60 * 1000,
  
  // Revalidate if data is stale (older than 5 minutes)
  revalidateIfStale: true,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
  
  // Retry on error
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Cache provider (optional, uses default Map)
  // provider: () => new Map(),
};

// Fetcher function for SWR - uses backend API with cookies
export const fetcher = async (url: string) => {
  // Convert /api/* paths to backend API URL
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  
  const res = await fetch(fullUrl, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};

// Fetcher with authentication - uses backend API with cookies (Lucia Auth)
export const fetcherWithAuth = async (url: string) => {
  // Convert /api/* paths to backend API URL
  const fullUrl = url.startsWith('/api') ? getApiUrl(url) : url;
  
  const res = await fetch(fullUrl, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  
  return res.json();
};
