// API configuration for different environments
export const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Get the full API URL for a given endpoint
 * In development: uses Vite proxy (relative paths)
 * In production: uses full backend URL
 */
export function getApiUrl(endpoint: string): string {
  // In development, use relative paths (Vite proxy handles it)
  if (import.meta.env.DEV) {
    return endpoint;
  }
  
  // In production, use full backend URL
  return `${API_URL}${endpoint}`;
}

/**
 * Enhanced fetch wrapper that automatically uses the correct API URL
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Add credentials for cross-origin requests
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
  };
  
  return fetch(url, fetchOptions);
}

