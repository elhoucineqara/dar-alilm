const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Normalize API URL - remove trailing slash
const normalizeApiUrl = (url: string): string => {
  return url.replace(/\/+$/, '');
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Normalize endpoint - ensure it starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const normalizedApiUrl = normalizeApiUrl(API_URL);
  const url = endpoint.startsWith('http') ? endpoint : `${normalizedApiUrl}${normalizedEndpoint}`;
  
  // Don't set Content-Type if body is FormData (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }), // Only set for non-FormData requests
    ...(options.headers || {}),
  } as any;

  // Auto-add token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

// Helper to get full URL for images/files from the backend
export const getFileUrl = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedApiUrl = normalizeApiUrl(API_URL);
  return `${normalizedApiUrl}${normalizedPath}`;
};