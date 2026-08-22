import type { AuthResponse, AuthUser, AuthTokens } from '@/types/auth';

const STORAGE_KEYS = {
  accessToken: 'smart-soma-access-token',
  refreshToken: 'smart-soma-refresh-token',
  user: 'smart-soma-user',
} as const;

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
let refreshPromise: Promise<string | null> | null = null;

function getJsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

export function setAuthState(tokens: AuthTokens, user: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearAuthState() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = performRefreshAccessToken();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function performRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearAuthState();
    return null;
  }

  const data = (await response.json()) as AuthTokens;
  const user = getStoredUser();
  if (!user) {
    clearAuthState();
    return null;
  }

  setAuthState(data, user);
  return data.accessToken;
}

export async function apiFetch<T>(
  input: string,
  init: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers ?? {});

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiUrl}${input}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retryCount === 0) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      const retryHeaders = new Headers(init.headers ?? {});
      retryHeaders.set('Authorization', `Bearer ${nextAccessToken}`);
      if (init.body && !retryHeaders.has('Content-Type')) {
        retryHeaders.set('Content-Type', 'application/json');
      }
      const retryResponse = await fetch(`${apiUrl}${input}`, {
        ...init,
        headers: retryHeaders,
      });

      if (!retryResponse.ok) {
        throw new Error(`Request failed with status ${retryResponse.status}`);
      }

      return (await retryResponse.json()) as T;
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Request failed with status ${response.status}`;
    try {
      const data = JSON.parse(text) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function registerUser(payload: {
  displayName: string;
  email: string;
  password: string;
  grade: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}/auth/register`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message ?? 'Registration failed');
  }

  const data = (await response.json()) as AuthResponse;
  setAuthState({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
  return data;
}

export async function loginUser(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message ?? 'Login failed');
  }

  const data = (await response.json()) as AuthResponse;
  setAuthState({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
  return data;
}

export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthState();
    return;
  }

  try {
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearAuthState();
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const user = await apiFetch<AuthUser>('/auth/me');
    return user;
  } catch {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) return null;

    try {
      const user = await apiFetch<AuthUser>('/auth/me');
      if (user) {
        const stored = getStoredUser();
        if (stored) {
          localStorage.setItem('smart-soma-user', JSON.stringify({ ...stored, ...user }));
        }
      }
      return user;
    } catch {
      clearAuthState();
      return null;
    }
  }
}
