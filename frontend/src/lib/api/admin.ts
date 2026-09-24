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
  error_text: string | null;
  stats?: Array<{
    id: number;
    website_name: string;
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
}

export const fetchAdminRunLogs = async (): Promise<AdminRun[]> => {
  return adminFetch('/admin/run-logs/');
};

export const fetchAdminSources = async (): Promise<AdminSource[]> => {
  return adminFetch('/admin/sources/');
};

export const fetchAdminSelectors = async (website_name?: string): Promise<AdminSelector[]> => {
  const query = website_name ? `?website_name=${website_name}` : '';
  return adminFetch(`/admin/selectors/${query}`);
};

export const fetchAdminData = async (): Promise<AdminDataRow[]> => {
  return adminFetch('/admin/data/');
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
