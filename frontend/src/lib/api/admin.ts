import { apiFetch, getAccessToken, SCRAPER_BASE_URL } from '../api';

async function adminFetch(path: string, options?: RequestInit) {
  const res = await apiFetch(path, options, SCRAPER_BASE_URL);
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

export interface AdminRun {
  id: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  total_new_rows: number;
  pending_before?: number;
  summary_success?: number;
  summary_failed?: number;
  pending_after?: number;
  error_text: string | null;
  action?: 'scrape' | 'summary' | 'full';
  activity?: string;
  websites?: string[];
  duration_seconds?: number;
  duration_display?: string;
  errors?: string[];
  metrics?: {
    new_rows: number;
    failed: number;
    processed: number;
    pending_before: number;
    success: number;
    pending_after: number;
  };
  stats?: Array<{
    id: number;
    website_name: string;
    active: boolean;
    total_notices: number;
    latest_new_notices: number;
    new_rows: number;
    created_at: string;
  }>;
  details?: Array<{
    id: number;
    website_name: string;
    status: string;
    error_message: string | null;
    started_at: string;
    finished_at: string | null;
  }>;
}

export interface AdminSelector {
  id: number;
  website_name: string;
  selector_key: string;
  selector_value: string;
}

export interface AdminSource {
  id: number;
  website_name: string;
  website_full_name: string;
  start_url: string;
  active: boolean;
  professional_category: number | null;
}

export interface AdminDataRow {
  id: number;
  title: string;
  category: string;
  website_name: string;
  url: string;
  notice_date: string;
  processed: boolean;
  detail_url?: string | null;
  pdf_url?: string | null;
  due_date?: string;
  summary?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminDataPage {
  results: AdminDataRow[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export const fetchAdminRunLogs = async (): Promise<AdminRun[]> => {
  return adminFetch('/admin/run-logs/');
};

export interface PendingSummaryCounts {
  total: number;
  by_website: Record<string, number>;
}

export const fetchPendingSummaryCounts = async (): Promise<PendingSummaryCounts> => {
  return adminFetch('/admin/pending-summaries/');
};

export interface PipelineStatus {
  run: AdminRun | null;
  website_totals: Record<string, number>;
  sites: Array<{
    website_name: string;
    active: boolean;
    total_notices: number;
    latest_new_notices: number;
    status: string;
    stage: string | null;
    current_url: string | null;
    heartbeat_at: string | null;
    finished_at: string | null;
    discovered_rows: number;
    new_rows: number;
    processed_rows: number;
    failed_rows: number;
    error_message: string | null;
  }>;
  pending_summaries: number;
  items: Array<{
    data_id: number | null;
    website_name: string;
    stage: string;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    error_message: string | null;
  }>;
  failure_reasons: Array<{
    reason: string;
    count: number;
    sites: string[];
    items: PipelineStatus['items'];
  }>;
}

export const fetchAdminPipelineStatus = async (): Promise<PipelineStatus> => {
  return adminFetch('/admin/pipeline-status/');
};

export const stopAdminScraper = async (): Promise<{ status: string }> => {
  return adminFetch('/admin/stop-scraper/', { method: 'POST' });
};

export const fetchAdminSources = async (): Promise<AdminSource[]> => {
  return adminFetch('/admin/sources/');
};

export const fetchAdminSelectors = async (website_name?: string): Promise<AdminSelector[]> => {
  const query = website_name ? `?website_name=${website_name}` : '';
  return adminFetch(`/admin/selectors/${query}`);
};

export const fetchAdminData = async (params: Record<string, string | number | undefined> = {}): Promise<AdminDataPage> => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return adminFetch(`/admin/data/${query.toString() ? `?${query}` : ''}`);
};

export const deleteAdminSource = async (id: number): Promise<void> => {
  const token = getAccessToken();
  await fetch(`${SCRAPER_BASE_URL}/admin/sources/${id}/`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
};

export const saveAdminSource = async (id: number | null, payload: Partial<AdminSource>): Promise<AdminSource> => {
  const token = getAccessToken();
  const url = id ? `${SCRAPER_BASE_URL}/admin/sources/${id}/` : `${SCRAPER_BASE_URL}/admin/sources/`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export const deleteAdminSelector = async (id: number): Promise<void> => {
  const token = getAccessToken();
  await fetch(`${SCRAPER_BASE_URL}/admin/selectors/${id}/`, {
    method: 'DELETE',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
};

export const saveAdminSelector = async (id: number | null, payload: Partial<AdminSelector>): Promise<AdminSelector> => {
  const token = getAccessToken();
  const url = id ? `${SCRAPER_BASE_URL}/admin/selectors/${id}/` : `${SCRAPER_BASE_URL}/admin/selectors/`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

export interface AdminUserFeedback {
  id: number;
  full_name: string;
  user_email: string;
  star_rating: number;
  type_of_feedback: string;
  message: string;
  created_at: string;
}

export interface AdminProfessionalCategory {
  id: number;
  name: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
  last_login: string | null;
  date_joined: string;
  profile?: {
    profession_category: number | null;
    email_notifications: boolean;
  };
}

export const fetchAdminFeedback = async (): Promise<AdminUserFeedback[]> => {
  return adminFetch('/admin/feedback/');
};

export const fetchAdminProfessions = async (): Promise<AdminProfessionalCategory[]> => {
  const res = await apiFetch('/admin/professions/');
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const res = await apiFetch('/admin/users/');
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

export const saveAdminUser = async (id: number, payload: Partial<AdminUser>): Promise<AdminUser> => {
  const res = await apiFetch(`/admin/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};
