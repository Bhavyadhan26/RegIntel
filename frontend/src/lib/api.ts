const API_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:8000';
const BASE_URL = `${API_ROOT}/api/auth`;
const SCRAPER_BASE_URL = `${API_ROOT}/api/scraper`;

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

async function apiFetch(path: string, options: RequestInit = {}, baseUrl = BASE_URL): Promise<Response> {
  let access = getAccessToken();

  const makeRequest = (token: string | null) =>
    fetch(`${baseUrl}${path}`, {
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

export async function apiSubmitFeedback(payload: {
  star_rating: number;
  type_of_feedback: 'Bug Report' | 'Feature Request' | 'Improvement' | 'Other';
  message: string;
}) {
  const res = await apiFetch('/feedback/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function apiForgotPassword(email: string) {
  const res = await fetch(`${BASE_URL}/forgot-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export async function apiResetPassword(payload: {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}) {
  const res = await fetch(`${BASE_URL}/reset-password/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export interface PublicationApiItem {
  id: string;
  title: string;
  authority: string;
  summary: string;
  notice_date: string;
  created_at: string;
  category: string;
  type: 'Notice' | 'Circular' | 'Amendment' | 'Tender' | 'Notifications' | 'Updates' | 'Tenders';
  website_name: string;
  pdf_url: string;
  detail_url: string;
  source_url: string;
  url: string;
}

export interface PublicationListResponse {
  results: PublicationApiItem[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
  filters: {
    professions: string[];
    selected: {
      profession: string;
      website: string;
    };
  };
}

export async function apiGetPublications(params: {
  page: number;
  page_size?: number;
  category?: 'All' | 'Notifications' | 'Updates' | 'Tenders';
  website?: string;
  profession?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  query.set('page', String(params.page));
  query.set('page_size', String(params.page_size ?? 10));
  query.set('website', params.website?.trim() || 'all');
  query.set('profession', params.profession?.trim() || 'all');

  if (params.category && params.category !== 'All') {
    query.set('category', params.category.toLowerCase());
  }

  if (params.search && params.search.trim()) {
    query.set('search', params.search.trim());
  }

  const res = await apiFetch(`/publications/?${query.toString()}`, {}, SCRAPER_BASE_URL);
  const data = await res.json();
  if (!res.ok) throw data;
  return data as PublicationListResponse;
}

export interface AlertApiItem {
  id: string;
  title: string;
  authority: string;
  summary: string;
  notice_date: string;
  category: string;
  tag: 'Notifications' | 'Updates' | 'Tenders' | string;
  url: string;
  created_at: string;
}

export interface AlertListResponse {
  results: AlertApiItem[];
  tab: 'new' | 'old' | string;
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
  profession: string;
}

export async function apiGetAlerts(params: { tab: 'new' | 'old'; page?: number; page_size?: number }) {
  const query = new URLSearchParams();
  query.set('tab', params.tab);
  query.set('page', String(params.page ?? 1));
  query.set('page_size', String(params.page_size ?? 20));

  const res = await apiFetch(`/alerts/?${query.toString()}`, {}, SCRAPER_BASE_URL);
  const data = await res.json();
  if (!res.ok) throw data;
  return data as AlertListResponse;
}

export interface DeadlineApiItem {
  id: string;
  title: string;
  category: string;
  website_name: string;
  due_date: string;
  days_left: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
  url: string;
}

export interface DeadlineListResponse {
  results: DeadlineApiItem[];
  profession: string;
  filters: {
    websites: Array<{ code: string; name: string }>;
    professions: string[];
    selected: {
      website: string;
      profession: string;
    };
  };
  counts: {
    urgent: number;
    this_week: number;
    total: number;
  };
}

export async function apiGetDeadlines(params?: { website?: string; profession?: string }) {
  const query = new URLSearchParams();
  query.set('website', params?.website?.trim() || 'all');
  query.set('profession', params?.profession?.trim() || 'all');

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await apiFetch(`/deadlines/${suffix}`, {}, SCRAPER_BASE_URL);
  const data = await res.json();
  if (!res.ok) throw data;
  return data as DeadlineListResponse;
}

export interface DashboardUpcomingDeadlineItem {
  id: string;
  title: string;
  due_date: string;
  days_left: number;
  urgent: boolean;
  url: string;
}

export interface DashboardSummaryResponse {
  cards: {
    unread_alerts: number;
    unread_alerts_three_day: number;
    publications_today: number;
    publications_week: number;
    deadlines_active: number;
    deadlines_week_with_due: number;
  };
  last_updated: string | null;
  upcoming_deadlines: DashboardUpcomingDeadlineItem[];
  upcoming_deadlines_total: number;
  upcoming_deadlines_page: number;
  upcoming_deadlines_page_size: number;
  upcoming_deadlines_has_more: boolean;
  profession: string;
}

export async function apiGetDashboardSummary(params?: { page?: number; page_size?: number }) {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('page_size', String(params?.page_size ?? 10));

  const res = await apiFetch(`/dashboard-summary/?${query.toString()}`, {}, SCRAPER_BASE_URL);
  const data = await res.json();
  if (!res.ok) throw data;
  return data as DashboardSummaryResponse;
}

export { saveTokens, clearTokens, getAccessToken };
