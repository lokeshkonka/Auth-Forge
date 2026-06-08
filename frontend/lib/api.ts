const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/${endpoint.replace(/^\//, '')}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    // Handle unauthorized - maybe redirect to login or refresh token
    // For now, let's just clear the token
    // localStorage.removeItem('token');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || response.statusText || 'An error occurred');
  }

  return data;
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body?: any, options?: RequestInit) => 
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body?: any, options?: RequestInit) => 
    request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' }),
};
