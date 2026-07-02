import type { ApiResponse, AdminAnalyticsStats, AdminSignSample } from '@signbridge/shared-types';
import { API_URL } from './auth-api';

type AuthFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function fetchAdminAnalytics(
  authFetch: AuthFetch,
): Promise<AdminAnalyticsStats | null> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/analytics`);
    const json = (await res.json()) as ApiResponse<AdminAnalyticsStats>;
    if (json.success) return json.data;
    return null;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
}

export async function fetchAdminSigns(authFetch: AuthFetch): Promise<AdminSignSample[] | null> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/signs`);
    const json = (await res.json()) as ApiResponse<AdminSignSample[]>;
    if (json.success) return json.data;
    return null;
  } catch (error) {
    console.error('Failed to fetch admin signs:', error);
    return null;
  }
}

export async function retrainModels(authFetch: AuthFetch): Promise<string> {
  try {
    const res = await authFetch(`${API_URL}/api/admin/retrain`, { method: 'POST' });
    const json = (await res.json()) as ApiResponse<{ message: string }>;
    if (json.success) return json.data.message;
    throw new Error('Failed to retrain');
  } catch (error) {
    console.error('Failed to retrain models:', error);
    throw error;
  }
}
