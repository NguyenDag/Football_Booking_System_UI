const BASE_URL = 'http://localhost:5252/api';
//const BASE_URL = 'https://localhost:7290/api';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: any;
}

export async function apiClient(
  endpoint: string,
  options: ApiOptions = {}
) {
  const { method = 'GET', body, headers: customHeaders, ...customConfig } = options;
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as any) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    ...customConfig,
  };

  // Only add body if method is not GET or HEAD
  if (body && method !== 'GET' && method !== 'HEAD') {
    config.body = typeof body === 'object' ? JSON.stringify(body) : body;
  }

  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const url = `${BASE_URL}${path}`;
    console.log(`API [${method}] ${url}`, body ? { body } : '');
    const response = await fetch(url, config);
    console.log(`API Response [${response.status}] ${url}`, response);

    if (response.status === 401) {
      // If we're not on the login page, clear tokens and redirect
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // window.location.assign('/login');
      }
    }

    // Try to parse as JSON, but handle non-JSON or empty responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      return data;
    }

    return Promise.reject(data);
  } catch (error: any) {
    return Promise.reject({ message: error.message || 'Something went wrong' });
  }
}
