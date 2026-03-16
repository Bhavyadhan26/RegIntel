const BASE_URL = 'http://localhost:8000/api/auth';

function getAccessToken(): string | null {
  return sessionStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  return sessionStorage.getItem('refresh_token');
}

function saveTokens(access: string, refresh: string) {
  sessionStorage.setItem('access_token', access);
  sessionStorage.setItem('refresh_token', refresh);

  // Cleanup legacy persistent tokens from older builds.
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

function clearTokens() {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  saveTokens(data.access, data.refresh ?? refresh);
  return data.access;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let access = getAccessToken();

  const makeRequest = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let response = await makeRequest(access);

  if (response.status === 401) {
    access = await refreshAccessToken();
    if (access) {
      response = await makeRequest(access);
    }
  }

  return response;
}

// ── Auth endpoints ───────────────────────────────────────────────────────────

export async function apiRegister(payload: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}) {
  const res = await fetch(`${BASE_URL}/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  saveTokens(data.access, data.refresh);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  saveTokens(data.access, data.refresh);
  return data;
}

export async function apiLogout() {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiFetch('/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
    }
  } finally {
    // Always clear local auth state, even if backend logout fails.
    clearTokens();
  }
}

export async function apiGetProfile() {
  const res = await apiFetch('/profile/');
  const data = await res.json();
  if (!res.ok) throw data;
  return data as { full_name: string; email: string; profession: string; email_notifications: boolean };
}

export async function apiUpdateProfile(payload: Partial<{
  full_name: string;
  profession: string;
  email_notifications: boolean;
}>) {
  const res = await apiFetch('/profile/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function apiChangePassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const res = await apiFetch('/change-password/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export { saveTokens, clearTokens, getAccessToken };
